'use client'

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';

// SEO helper (reutilizado del patrón existente)
function usePageSEO(options: { title: string; description: string; canonicalPath?: string }) {
  const { title, description, canonicalPath } = options;
  useEffect(() => {
    document.title = title;

    const ensureMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    ensureMeta('description', description);

    if (canonicalPath) {
      const canonicalUrl = new URL(canonicalPath, window.location.origin).toString();
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonicalUrl);
    }
  }, [title, description, canonicalPath]);
}

interface RankedAgent {
  rank: number;
  name: string; // Idealmente viene de un JOIN con "profiles"
  averageRating: number;
  salesMonth: number;
}

export default function LeaderboardPage() {
  const { franchiseId = '' } = useParams();
  const [leaderboard, setLeaderboard] = useState<RankedAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  usePageSEO({
    title: 'Leaderboard de Agentes | Inmobiliaria DOMIN10',
    description: 'Ranking de rendimiento de agentes por franquicia con calificación y ventas del mes.',
    canonicalPath: `/dashboard/franchise/${franchiseId}/leaderboard`,
  });

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);

        let query = (supabase as any)
          .from('agent_performance')
          .select('agent_id, average_rating, properties_sold_month, franchise_rank, global_rank');

        // Nota: Cuando exista relación directa con franquicia, se podrá filtrar por franchiseId.
        // Por ahora, ordenamos por ranking de franquicia, luego global y finalmente por rating.
        query = query.order('franchise_rank', { ascending: true, nullsFirst: false });
        query = query.order('global_rank', { ascending: true, nullsFirst: false });
        query = query.order('average_rating', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;

        const mapped: RankedAgent[] = (data ?? []).map((row: any, idx: number) => {
          const rank = row.franchise_rank ?? row.global_rank ?? idx + 1;
          const name = `Agente ${String(row.agent_id).slice(0, 8)}`;
          return {
            rank,
            name,
            averageRating: Number(row.average_rating ?? 0),
            salesMonth: Number(row.properties_sold_month ?? 0),
          };
        });

        setLeaderboard(mapped);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setLeaderboard([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, [franchiseId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <main className="container mx-auto py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard de Agentes</h1>
          <p className="mt-2 text-muted-foreground">Franquicia: {franchiseId || '—'}</p>
        </header>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Tabla de Clasificación</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Calculando rankings...</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Agente</TableHead>
                      <TableHead>Calificación</TableHead>
                      <TableHead>Ventas (Mes)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((agent) => (
                      <TableRow key={agent.rank}>
                        <TableCell className="text-xl font-bold">{agent.rank}</TableCell>
                        <TableCell className="text-lg">{agent.name}</TableCell>
                        <TableCell className="text-lg font-semibold text-primary">
                          {agent.averageRating.toFixed(2)} ★
                        </TableCell>
                        <TableCell className="text-lg">{agent.salesMonth}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
