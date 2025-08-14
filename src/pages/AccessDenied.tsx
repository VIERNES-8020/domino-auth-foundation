import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Home, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Shield className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Acceso Denegado</CardTitle>
          <CardDescription>
            No tienes permisos para acceder a esta página
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Tu rol actual no te permite acceder a este contenido. Si crees que esto es un error, 
            contacta con el administrador del sistema.
          </p>
          
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => navigate('/')}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Volver al Inicio
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/auth')}
              className="w-full"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Iniciar Sesión
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              ¿Necesitas ayuda? Contacta con soporte técnico
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}