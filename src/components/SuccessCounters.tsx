import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Home, Key } from "lucide-react";

interface CounterData {
  ventaLeads: number;
  alquilerLeads: number;
  anticrieticoLeads: number;
  ventaConcluded: number;
  alquilerConcluded: number;
  anticreticoConcluded: number;
}

export default function SuccessCounters() {
  const [counters, setCounters] = useState<CounterData>({
    ventaLeads: 0,
    alquilerLeads: 0,
    anticrieticoLeads: 0,
    ventaConcluded: 0,
    alquilerConcluded: 0,
    anticreticoConcluded: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCounters = async () => {
      try {
        // Fetch listing leads counts
        const { data: ventaLeads } = await supabase
          .from('listing_leads')
          .select('id', { count: 'exact', head: true })
          .eq('request_type', 'venta');

        const { data: alquilerLeads } = await supabase
          .from('listing_leads')
          .select('id', { count: 'exact', head: true })
          .eq('request_type', 'alquiler');

        const { data: anticrieticoLeads } = await supabase
          .from('listing_leads')
          .select('id', { count: 'exact', head: true })
          .eq('request_type', 'anticretico');

        // Fetch concluded properties counts
        const { data: ventaConcluded } = await supabase
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('transaction_type', 'venta')
          .eq('concluded_status', 'vendida');

        const { data: alquilerConcluded } = await supabase
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('transaction_type', 'alquiler')
          .eq('concluded_status', 'alquilada');

        const { data: anticreticoConcluded } = await supabase
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('transaction_type', 'anticretico')
          .eq('concluded_status', 'concluida');

        setCounters({
          ventaLeads: ventaLeads?.length || 0,
          alquilerLeads: alquilerLeads?.length || 0,
          anticrieticoLeads: anticrieticoLeads?.length || 0,
          ventaConcluded: ventaConcluded?.length || 0,
          alquilerConcluded: alquilerConcluded?.length || 0,
          anticreticoConcluded: anticreticoConcluded?.length || 0
        });
      } catch (error) {
        console.error('Error fetching counters:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounters();
  }, []);

  const CounterCard = ({ 
    icon: Icon, 
    title, 
    subtitle,
    solicitudes, 
    concluidas, 
    color 
  }: {
    icon: any;
    title: string;
    subtitle: string;
    solicitudes: number;
    concluidas: number;
    color: string;
  }) => (
    <Card className="hover:shadow-lg transition-shadow duration-300 border-2 hover:border-primary/50">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{subtitle}</p>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Clientes interesados:</span>
                <span className="font-semibold text-primary text-lg">
                  {isLoading ? "..." : solicitudes.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Transacciones exitosas:</span>
                <span className="font-bold text-green-600 text-lg">
                  {isLoading ? "..." : concluidas.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="mb-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Nuestros Resultados Hablan por Sí Mismos
        </h2>
        <p className="text-muted-foreground">
          Miles de familias bolivianas confían en nosotros para sus transacciones inmobiliarias
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CounterCard
          icon={TrendingUp}
          title="Ventas"
          subtitle="Propiedades en venta"
          solicitudes={counters.ventaLeads}
          concluidas={counters.ventaConcluded}
          color="bg-orange-500"
        />
        
        <CounterCard
          icon={Home}
          title="Alquileres"
          subtitle="Propiedades en alquiler"
          solicitudes={counters.alquilerLeads}
          concluidas={counters.alquilerConcluded}
          color="bg-blue-500"
        />
        
        <CounterCard
          icon={Key}
          title="Anticréticos"
          subtitle="Propiedades en anticrético"
          solicitudes={counters.anticrieticoLeads}
          concluidas={counters.anticreticoConcluded}
          color="bg-green-600"
        />
      </div>
    </div>
  );
}