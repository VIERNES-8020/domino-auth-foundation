import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Bug, 
  Trash2, 
  Download, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Info, 
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { errorLogger, ErrorInfo } from '@/utils/errorLogger';
import { toast } from '@/hooks/use-toast';

interface ErrorDebugPanelProps {
  isVisible?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const ErrorDebugPanel: React.FC<ErrorDebugPanelProps> = ({
  isVisible: initialVisible = false,
  position = 'bottom-right'
}) => {
  const [isOpen, setIsOpen] = useState(initialVisible);
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const [activeTab, setActiveTab] = useState('recent');

  useEffect(() => {
    const updateErrors = () => {
      const storedErrors = errorLogger.getStoredErrors();
      setErrors(storedErrors);
    };

    // Actualizar errores inicialmente
    updateErrors();

    // Actualizar cada segundo para capturar nuevos errores
    const interval = setInterval(updateErrors, 1000);

    return () => clearInterval(interval);
  }, []);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  const clearAllErrors = () => {
    errorLogger.clearStoredErrors();
    setErrors([]);
    toast({
      title: "Errores limpiados",
      description: "Todos los errores han sido eliminados del historial"
    });
  };

  const downloadErrorReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      totalErrors: errors.length,
      errors: errors,
      systemInfo: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        screen: {
          width: screen.width,
          height: screen.height
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Reporte descargado",
      description: "El reporte de errores se ha descargado correctamente"
    });
  };

  const getErrorTypeIcon = (error: ErrorInfo) => {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
    if (message.includes('warning')) {
      return <Info className="h-4 w-4 text-yellow-500" />;
    }
    return <Bug className="h-4 w-4 text-red-500" />;
  };

  const recentErrors = errors.slice(-10);
  const errorsByType = errors.reduce((acc, error) => {
    const type = error.message.toLowerCase().includes('network') ? 'Network' :
                 error.message.toLowerCase().includes('auth') ? 'Authentication' :
                 error.message.toLowerCase().includes('validation') ? 'Validation' :
                 'Runtime';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (!isOpen) {
    return (
      <div className={`fixed ${getPositionClasses()} z-50`}>
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur-sm border-border/50 hover:bg-accent/50"
        >
          <Bug className="h-4 w-4 mr-2" />
          Debug ({errors.length})
          {errors.length > 0 && (
            <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {errors.length}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-50 w-96 max-h-[70vh]`}>
      <Card className="bg-background/95 backdrop-blur-sm border-border/50 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Bug className="h-5 w-5" />
              <span>Panel de Debug</span>
              {errors.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {errors.length}
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex space-x-1">
              <Button
                onClick={() => setErrors(errorLogger.getStoredErrors())}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
                size="sm"
              >
                <EyeOff className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={clearAllErrors} variant="outline" size="sm">
              <Trash2 className="h-3 w-3 mr-1" />
              Limpiar
            </Button>
            
            <Button onClick={downloadErrorReport} variant="outline" size="sm">
              <Download className="h-3 w-3 mr-1" />
              Exportar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recent">Recientes</TabsTrigger>
              <TabsTrigger value="stats">Estadísticas</TabsTrigger>
              <TabsTrigger value="system">Sistema</TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="mt-3">
              <ScrollArea className="h-64">
                {recentErrors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mb-2" />
                    <p className="text-sm">No hay errores recientes</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentErrors.slice().reverse().map((error, index) => (
                      <Card key={error.errorId} className="p-2">
                        <div className="flex items-start space-x-2">
                          {getErrorTypeIcon(error)}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-mono truncate">
                              {error.message}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <Badge variant="outline" className="text-xs">
                                {error.errorId.split('-')[1]}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(error.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="stats" className="mt-3">
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Errores por Tipo</h4>
                  {Object.entries(errorsByType).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center py-1">
                      <span className="text-sm">{type}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-semibold mb-2">Resumen</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-semibold">{errors.length}</div>
                      <div className="text-muted-foreground">Total</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-semibold">{recentErrors.length}</div>
                      <div className="text-muted-foreground">Recientes</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="system" className="mt-3">
              <div className="space-y-2 text-xs">
                <div>
                  <strong>URL:</strong>
                  <div className="font-mono bg-muted p-1 rounded mt-1 truncate">
                    {window.location.pathname}
                  </div>
                </div>
                
                <div>
                  <strong>Conexión:</strong> {navigator.onLine ? '🟢 Online' : '🔴 Offline'}
                </div>
                
                <div>
                  <strong>Memoria:</strong> {
                    (performance as any).memory ? 
                    `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB` : 
                    'No disponible'
                  }
                </div>
                
                <div>
                  <strong>Viewport:</strong> {window.innerWidth} x {window.innerHeight}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};