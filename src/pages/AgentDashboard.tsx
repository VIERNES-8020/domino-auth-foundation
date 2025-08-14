import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Eye, Edit, Trash, Archive } from "lucide-react";

export default function AgentDashboard() {
  const [activeTab, setActiveTab] = useState("propiedades");
  const [showArchived, setShowArchived] = useState(false);

  // Mock data for visual display
  const mockProperties = [
    {
      id: "1",
      title: "Casa Moderna en Miraflores",
      address: "Av. Larco 123, Miraflores, Lima",
      price: 350000,
      price_currency: "USD"
    },
    {
      id: "2", 
      title: "Departamento con Vista al Mar",
      address: "Malecón de la Marina 456, San Miguel, Lima",
      price: 280000,
      price_currency: "USD"
    }
  ];

  const mockUser = {
    id: "mock-user-id",
    email: "agente@ejemplo.com"
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel del Agente</h1>
          <p className="text-muted-foreground">Gestiona tus propiedades y perfil</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="propiedades">Mis Propiedades</TabsTrigger>
          <TabsTrigger value="caracteristicas">Características</TabsTrigger>
          <TabsTrigger value="perfil">Mi Perfil</TabsTrigger>
        </TabsList>

        <TabsContent value="propiedades" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{showArchived ? "Propiedades Archivadas" : "Mis Propiedades"}</CardTitle>
                <CardDescription>
                  {showArchived 
                    ? "Propiedades que has archivado" 
                    : "Gestiona todas tus propiedades publicadas"}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={!showArchived ? "default" : "outline"}
                  onClick={() => setShowArchived(false)}
                >
                  Activas
                </Button>
                <Button
                  variant={showArchived ? "default" : "outline"}
                  onClick={() => setShowArchived(true)}
                >
                  Archivadas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {(!showArchived ? mockProperties : []).map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{property.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {property.address}
                      </p>
                      <p className="text-lg font-bold">
                        ${property.price?.toLocaleString()} {property.price_currency}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={showArchived ? "default" : "secondary"}
                        size="sm"
                      >
                        {showArchived ? <Eye className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(showArchived ? [] : mockProperties).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {showArchived 
                      ? "No tienes propiedades archivadas." 
                      : "No tienes propiedades publicadas aún."}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="caracteristicas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Características de las Propiedades</CardTitle>
              <CardDescription>
                Gestiona las amenidades y características disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["Piscina", "Gym", "Estacionamiento", "Jardín", "Balcón", "Terraza", "Seguridad 24h", "Ascensor"].map((feature) => (
                  <div key={feature} className="p-3 border rounded-lg text-center">
                    <p className="text-sm font-medium">{feature}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="perfil" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mi Perfil</CardTitle>
              <CardDescription>
                Gestiona tu información personal y profesional
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Componente de perfil en desarrollo...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}