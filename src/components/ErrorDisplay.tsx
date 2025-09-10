import React, { useState } from 'react';
import { ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, RefreshCw, Home, Copy, Bug, Clock, Code, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { errorLogger } from '@/utils/errorLogger';

interface ErrorDisplayProps {
  error: Error | null;
  errorId: string | null;
  errorInfo?: ErrorInfo | null;
  onRetry?: () => void;
  onReload?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  errorId,
  errorInfo,
  onRetry,
  onReload
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const recentErrors = errorLogger.getRecentErrors();
  const storedErrors = errorLogger.getStoredErrors();

  const copyErrorDetails = () => {
    const errorDetails = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
    toast({
      title: "Información copiada",
      description: "Los detalles del error han sido copiados al portapapeles"
    });
  };

  const formatStackTrace = (stack?: string) => {
    if (!stack) return 'Stack trace no disponible';
    
    return stack
      .split('\n')
      .map((line, index) => {
        // Resaltar líneas que contienen archivos del proyecto
        const isProjectFile = line.includes('/src/') || line.includes('.tsx') || line.includes('.ts');
        return (
          <div 
            key={index} 
            className={`text-sm font-mono py-1 px-2 rounded ${
              isProjectFile 
                ? 'bg-destructive/10 text-destructive border-l-2 border-destructive' 
                : 'text-muted-foreground'
            }`}
          >
            {line.trim()}
          </div>
        );
      });
  };

  const getErrorSeverity = (error: Error | null) => {
    if (!error) return 'unknown';
    
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) return 'network';
    if (message.includes('permission') || message.includes('unauthorized')) return 'auth';
    if (message.includes('not found') || message.includes('404')) return 'notfound';
    if (message.includes('syntax') || message.includes('unexpected token')) return 'syntax';
    
    return 'runtime';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'network': return 'bg-blue-500';
      case 'auth': return 'bg-yellow-500';
      case 'notfound': return 'bg-orange-500';
      case 'syntax': return 'bg-red-500';
      case 'runtime': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'network': return 'Error de Red';
      case 'auth': return 'Error de Autenticación';
      case 'notfound': return 'Recurso No Encontrado';
      case 'syntax': return 'Error de Sintaxis';
      case 'runtime': return 'Error de Ejecución';
      default: return 'Error Desconocido';
    }
  };

  const severity = getErrorSeverity(error);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="border-destructive/50">
          <CardHeader className="space-y-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <CardTitle className="text-2xl text-destructive">
                  Error del Sistema Detectado
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  Se ha producido un error inesperado. Detalles completos disponibles abajo.
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="destructive" className="space-x-1">
                <Bug className="h-3 w-3" />
                <span>ID: {errorId}</span>
              </Badge>
              
              <Badge className={`text-white ${getSeverityColor(severity)}`}>
                {getSeverityLabel(severity)}
              </Badge>
              
              <Badge variant="outline" className="space-x-1">
                <Clock className="h-3 w-3" />
                <span>{new Date().toLocaleString()}</span>
              </Badge>
            </div>

            <div className="flex space-x-2">
              {onRetry && (
                <Button onClick={onRetry} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Intentar de Nuevo
                </Button>
              )}
              
              {onReload && (
                <Button onClick={onReload} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recargar Página
                </Button>
              )}
              
              <Button onClick={() => window.location.href = '/'} variant="outline" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Ir al Inicio
              </Button>
              
              <Button onClick={copyErrorDetails} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Copiar Detalles
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Detalles del Error</TabsTrigger>
                <TabsTrigger value="stack">Stack Trace</TabsTrigger>
                <TabsTrigger value="context">Contexto</TabsTrigger>
                <TabsTrigger value="history">Historial</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bug className="h-5 w-5" />
                      <span>Información del Error</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Mensaje de Error:</h4>
                      <div className="p-3 bg-destructive/10 rounded border border-destructive/20">
                        <code className="text-destructive font-mono">
                          {error?.message || 'Mensaje no disponible'}
                        </code>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">URL Actual:</h4>
                        <code className="text-sm bg-muted p-2 rounded block break-all">
                          {window.location.href}
                        </code>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Timestamp:</h4>
                        <code className="text-sm bg-muted p-2 rounded block">
                          {new Date().toISOString()}
                        </code>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">User Agent:</h4>
                      <code className="text-xs bg-muted p-2 rounded block break-all">
                        {navigator.userAgent}
                      </code>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stack" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Code className="h-5 w-5" />
                      <span>Stack Trace Detallado</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96 w-full">
                      <div className="space-y-1">
                        {formatStackTrace(error?.stack)}
                      </div>
                    </ScrollArea>

                    {errorInfo?.componentStack && (
                      <>
                        <Separator className="my-4" />
                        <h4 className="font-semibold mb-2">Component Stack:</h4>
                        <ScrollArea className="h-32 w-full">
                          <pre className="text-xs bg-muted p-3 rounded">
                            {errorInfo.componentStack}
                          </pre>
                        </ScrollArea>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="context" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Contexto de la Aplicación</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Estado del Navegador:</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Conexión: {navigator.onLine ? 'Conectado' : 'Sin conexión'}</li>
                          <li>• Cookies habilitadas: {navigator.cookieEnabled ? 'Sí' : 'No'}</li>
                          <li>• Idioma: {navigator.language}</li>
                          <li>• Plataforma: {navigator.platform}</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Información de Pantalla:</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Resolución: {screen.width} x {screen.height}</li>
                          <li>• Ventana: {window.innerWidth} x {window.innerHeight}</li>
                          <li>• Color depth: {screen.colorDepth} bits</li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Local Storage:</h4>
                      <p className="text-sm text-muted-foreground">
                        Errores almacenados: {storedErrors.length}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>Historial de Errores Recientes</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentErrors.length === 0 ? (
                      <p className="text-muted-foreground">No hay errores recientes</p>
                    ) : (
                      <ScrollArea className="h-64 w-full">
                        <div className="space-y-3">
                          {recentErrors.slice().reverse().map((err, index) => (
                            <div key={err.errorId} className="border rounded p-3">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {err.errorId}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(err.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm font-mono">{err.message}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};