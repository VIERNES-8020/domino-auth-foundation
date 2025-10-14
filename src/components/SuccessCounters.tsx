import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Building2, MapPin, Briefcase, Home as HomeIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CounterData {
  activeProperties: number;
  activeFranchises: number;
  uniqueCities: number;
  arxisProjects: number;
}

interface PropertyDetail {
  id: string;
  title: string;
  property_type: string;
  address: string;
  agent_name?: string;
}

interface FranchiseDetail {
  id: string;
  name: string;
  description?: string;
}

interface CityDetail {
  city: string;
  count: number;
}

interface ArxisProject {
  id: string;
  title: string;
  status: string;
  end_date?: string;
}

export default function SuccessCounters() {
  const [counters, setCounters] = useState<CounterData>({
    activeProperties: 0,
    activeFranchises: 0,
    uniqueCities: 0,
    arxisProjects: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [showFranchisesModal, setShowFranchisesModal] = useState(false);
  const [showCitiesModal, setShowCitiesModal] = useState(false);
  const [showArxisModal, setShowArxisModal] = useState(false);
  
  // Detail data
  const [properties, setProperties] = useState<PropertyDetail[]>([]);
  const [franchises, setFranchises] = useState<FranchiseDetail[]>([]);
  const [cities, setCities] = useState<CityDetail[]>([]);
  const [arxisProjects, setArxisProjects] = useState<ArxisProject[]>([]);

  useEffect(() => {
    const fetchCounters = async () => {
      try {
        // Fetch active properties count
        const { count: activePropsCount } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved')
          .eq('is_archived', false);

        // Fetch successful properties count (sold, rented, or anticresis)
        const { count: franchisesCount } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('is_archived', true)
          .not('concluded_status', 'is', null);

        // Fetch unique cities count
        const { data: cityData } = await supabase
          .from('properties')
          .select('address')
          .eq('status', 'approved')
          .eq('is_archived', false);

        const uniqueCitiesSet = new Set<string>();
        cityData?.forEach(prop => {
          if (prop.address) {
            const parts = prop.address.split(',');
            if (parts.length > 1) {
              const city = parts[parts.length - 2].trim();
              uniqueCitiesSet.add(city);
            }
          }
        });

        // Fetch ARXIS completed projects count
        const { count: arxisCount } = await supabase
          .from('arxis_projects')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed');

        setCounters({
          activeProperties: activePropsCount || 0,
          activeFranchises: franchisesCount || 0,
          uniqueCities: uniqueCitiesSet.size,
          arxisProjects: arxisCount || 0
        });
      } catch (error) {
        console.error('Error fetching counters:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounters();
  }, []);

  const fetchPropertiesDetails = async () => {
    try {
      const { data } = await supabase
        .from('properties')
        .select('property_type')
        .eq('status', 'approved')
        .eq('is_archived', false);

      const typeMap = new Map<string, number>();
      data?.forEach(prop => {
        if (prop.property_type) {
          const type = prop.property_type;
          typeMap.set(type, (typeMap.get(type) || 0) + 1);
        }
      });

      const typeArray = Array.from(typeMap.entries()).map(([type, count]) => ({
        id: type,
        title: '',
        property_type: type,
        address: '',
        count
      })).sort((a, b) => b.count - a.count);

      setProperties(typeArray as any);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchFranchisesDetails = async () => {
    try {
      const { data } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          property_type,
          address,
          concluded_status,
          concluded_at,
          profiles!properties_agent_id_fkey(full_name)
        `)
        .eq('is_archived', true)
        .not('concluded_status', 'is', null)
        .order('concluded_at', { ascending: false })
        .limit(50);

      setProperties(data?.map(p => ({
        id: p.id,
        title: p.title,
        property_type: p.property_type || 'N/A',
        address: p.address,
        agent_name: (p.profiles as any)?.full_name || 'Sin asignar'
      })) || []);
    } catch (error) {
      console.error('Error fetching successful properties:', error);
    }
  };

  const fetchCitiesDetails = async () => {
    try {
      const { data } = await supabase
        .from('properties')
        .select('address')
        .eq('status', 'approved')
        .eq('is_archived', false);

      const cityMap = new Map<string, number>();
      data?.forEach(prop => {
        if (prop.address) {
          const parts = prop.address.split(',');
          if (parts.length > 1) {
            const city = parts[parts.length - 2].trim();
            cityMap.set(city, (cityMap.get(city) || 0) + 1);
          }
        }
      });

      const cityArray = Array.from(cityMap.entries()).map(([city, count]) => ({
        city,
        count
      })).sort((a, b) => b.count - a.count);

      setCities(cityArray);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchArxisDetails = async () => {
    try {
      const { data } = await supabase
        .from('arxis_projects')
        .select('id, title, status, end_date')
        .eq('status', 'completed')
        .order('end_date', { ascending: false })
        .limit(50);

      setArxisProjects(data || []);
    } catch (error) {
      console.error('Error fetching ARXIS projects:', error);
    }
  };

  const handleCardClick = async (type: 'properties' | 'franchises' | 'cities' | 'arxis') => {
    switch (type) {
      case 'properties':
        await fetchPropertiesDetails();
        setShowPropertiesModal(true);
        break;
      case 'franchises':
        await fetchFranchisesDetails();
        setShowFranchisesModal(true);
        break;
      case 'cities':
        await fetchCitiesDetails();
        setShowCitiesModal(true);
        break;
      case 'arxis':
        await fetchArxisDetails();
        setShowArxisModal(true);
        break;
    }
  };

  const CounterCard = ({ 
    icon: Icon, 
    title, 
    subtitle,
    value, 
    color,
    onClick
  }: {
    icon: any;
    title: string;
    subtitle: string;
    value: number;
    color: string;
    onClick: () => void;
  }) => (
    <Card 
      className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50 cursor-pointer hover:scale-[1.02]"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{subtitle}</p>
            <div className="text-3xl font-bold text-primary">
              {isLoading ? "..." : value.toLocaleString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const getPropertyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'casa': 'Casa',
      'departamento': 'Departamento',
      'terreno': 'Terreno',
      'oficina': 'Oficina',
      'local_comercial': 'Local Comercial'
    };
    return types[type] || type;
  };

  return (
    <>
      <div className="mb-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Números que Hablan por Sí Solos
          </h2>
          <p className="text-muted-foreground">
            Datos en tiempo real de nuestra plataforma inmobiliaria
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CounterCard
            icon={HomeIcon}
            title="Propiedades Activas"
            subtitle="Disponibles ahora"
            value={counters.activeProperties}
            color="bg-blue-500"
            onClick={() => handleCardClick('properties')}
          />
          
          <CounterCard
            icon={Building2}
            title="Éxitos Recientes"
            subtitle="Propiedades vendidas, alquiladas o en anticrético"
            value={counters.activeFranchises}
            color="bg-green-600"
            onClick={() => handleCardClick('franchises')}
          />
          
          <CounterCard
            icon={MapPin}
            title="Ciudades"
            subtitle="Con presencia"
            value={counters.uniqueCities}
            color="bg-orange-500"
            onClick={() => handleCardClick('cities')}
          />
          
          <CounterCard
            icon={Briefcase}
            title="ARXIS"
            subtitle="Proyectos completados"
            value={counters.arxisProjects}
            color="bg-purple-600"
            onClick={() => handleCardClick('arxis')}
          />
        </div>
      </div>

      {/* Properties Modal */}
      <Dialog open={showPropertiesModal} onOpenChange={setShowPropertiesModal}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Propiedades Activas</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            {properties.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay datos disponibles</p>
            ) : (
              <div className="space-y-3">
                {properties.map((prop) => (
                  <Card key={prop.property_type} className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <HomeIcon className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">{getPropertyTypeLabel(prop.property_type)}</h3>
                      </div>
                      <Badge variant="secondary" className="text-lg px-4 py-1">
                        {(prop as any).count} {(prop as any).count === 1 ? 'propiedad' : 'propiedades'}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Successful Properties Modal */}
      <Dialog open={showFranchisesModal} onOpenChange={setShowFranchisesModal}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Éxitos Recientes</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            {properties.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay datos disponibles</p>
            ) : (
              <div className="space-y-3">
                {properties.map((prop) => (
                  <Card key={prop.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{prop.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{prop.address}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary">{getPropertyTypeLabel(prop.property_type)}</Badge>
                          <Badge variant="outline">Agente: {prop.agent_name}</Badge>
                          <Badge variant="default">Exitoso</Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Cities Modal */}
      <Dialog open={showCitiesModal} onOpenChange={setShowCitiesModal}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Ciudades con Propiedades</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            {cities.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay datos disponibles</p>
            ) : (
              <div className="space-y-3">
                {cities.map((city) => (
                  <Card key={city.city} className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">{city.city}</h3>
                      </div>
                      <Badge variant="secondary" className="text-lg px-4 py-1">
                        {city.count} {city.count === 1 ? 'propiedad' : 'propiedades'}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ARXIS Projects Modal */}
      <Dialog open={showArxisModal} onOpenChange={setShowArxisModal}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Proyectos ARXIS Completados</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            {arxisProjects.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay datos disponibles</p>
            ) : (
              <div className="space-y-3">
                {arxisProjects.map((project) => (
                  <Card key={project.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{project.title}</h3>
                        {project.end_date && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Finalizado: {new Date(project.end_date).toLocaleDateString('es-BO')}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary">Completado</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}