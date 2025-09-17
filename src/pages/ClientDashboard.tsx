import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Profile {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

export default function ClientDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Panel Cliente | Inmobiliaria DOMIN10";

    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      setEmail(user?.email ?? null);
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      setProfile(data as Profile | null);
    };

    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <main className="container mx-auto py-10">
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Panel del Cliente</h1>
          <p className="text-muted-foreground mt-2">Bienvenido(a){profile?.full_name ? `, ${profile.full_name}` : ''}.</p>
        </header>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Mi cuenta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Nombre:</strong> {profile?.full_name || '—'}</p>
              <p><strong>Email:</strong> {email || '—'}</p>
              
              <Button onClick={() => window.location.href = '/contacto'} variant="secondary">Necesito ayuda</Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Mis solicitudes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Pronto verás aquí tus solicitudes de visitas y mensajes enviados.</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Favoritos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Próximamente podrás guardar propiedades favoritas.</p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
