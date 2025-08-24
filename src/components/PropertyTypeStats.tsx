import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home, Building, TreePine, Briefcase, Store, TrendingUp, FilterIcon } from "lucide-react";

interface PropertyTypeStatsProps {
  properties: any[];
  onFilterChange?: (type: string, status: 'all' | 'active' | 'concluded') => void;
}

export default function PropertyTypeStats({ properties, onFilterChange }: PropertyTypeStatsProps) {
  const [activeFilter, setActiveFilter] = useState<{ type: string; status: 'all' | 'active' | 'concluded' } | null>(null);

  const propertyTypes = [
    { 
      type: 'casa', 
      label: 'Casas', 
      icon: Home,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    { 
      type: 'departamento', 
      label: 'Departamentos', 
      icon: Building,
      color: 'from-green-500 to-green-600', 
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    { 
      type: 'terreno', 
      label: 'Terrenos', 
      icon: TreePine,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50', 
      borderColor: 'border-orange-200'
    },
    { 
      type: 'oficina', 
      label: 'Oficinas', 
      icon: Briefcase,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    { 
      type: 'local comercial', 
      label: 'Locales Comerciales', 
      icon: Store,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200'
    }
  ];

  const getPropertyStats = (type: string) => {
    const filteredProperties = properties.filter(p => 
      p.property_type?.toLowerCase() === type.toLowerCase()
    );
    
    const total = filteredProperties.length;
    const concluded = filteredProperties.filter(p => p.concluded_status).length;
    const active = total - concluded;
    
    return { total, concluded, active };
  };

  const handleFilterClick = (type: string, status: 'all' | 'active' | 'concluded') => {
    const newFilter = { type, status };
    setActiveFilter(activeFilter?.type === type && activeFilter?.status === status ? null : newFilter);
    onFilterChange?.(type, status);
  };

  const isFilterActive = (type: string, status: 'all' | 'active' | 'concluded') => {
    return activeFilter?.type === type && activeFilter?.status === status;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold text-primary">Estadísticas por Tipo de Propiedad</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {propertyTypes.map((propertyType) => {
          const stats = getPropertyStats(propertyType.type);
          const IconComponent = propertyType.icon;
          
          return (
            <Card key={propertyType.type} className={`${propertyType.bgColor} ${propertyType.borderColor} border-2 hover:shadow-lg transition-all duration-300 group`}>
              <CardContent className="p-4 space-y-4">
                {/* Header with icon and type */}
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${propertyType.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                    <div className="text-xs text-gray-600">Total</div>
                  </div>
                </div>

                {/* Property type label */}
                <div className="text-sm font-medium text-gray-700 text-center">
                  {propertyType.label}
                </div>

                {/* Statistics */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Por Comercializar:</span>
                    <Badge variant="outline" className="text-xs bg-white/70">
                      {stats.active}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Comercializadas:</span>
                    <Badge variant="default" className="text-xs">
                      {stats.concluded}
                    </Badge>
                  </div>
                </div>

                {/* Filter buttons */}
                <div className="grid grid-cols-3 gap-1 mt-3">
                  <Button
                    size="sm"
                    variant={isFilterActive(propertyType.type, 'all') ? 'default' : 'ghost'}
                    onClick={() => handleFilterClick(propertyType.type, 'all')}
                    className="text-xs p-1 h-7"
                  >
                    Todas
                  </Button>
                  <Button
                    size="sm"
                    variant={isFilterActive(propertyType.type, 'active') ? 'default' : 'ghost'}
                    onClick={() => handleFilterClick(propertyType.type, 'active')}
                    className="text-xs p-1 h-7"
                  >
                    Activas
                  </Button>
                  <Button
                    size="sm"
                    variant={isFilterActive(propertyType.type, 'concluded') ? 'default' : 'ghost'}
                    onClick={() => handleFilterClick(propertyType.type, 'concluded')}
                    className="text-xs p-1 h-7"
                  >
                    Vendidas
                  </Button>
                </div>

                {/* Active filter indicator */}
                {activeFilter?.type === propertyType.type && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <FilterIcon className="w-3 h-3 text-primary" />
                    <span className="text-xs text-primary font-medium">
                      Filtro Activo
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}