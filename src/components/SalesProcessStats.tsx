import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, CheckCircle, Eye, DollarSign, Calendar, MapPin, User, Phone, Mail, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PropertyVisit {
  id: string;
  property_id: string;
  agent_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  scheduled_at: string;
  status: string;
  message?: string;
  visit_result?: string;
  sale_amount?: number;
  commission_percentage?: number;
  commission_amount?: number;
  currency?: string;
  transaction_type?: string;
  created_at: string;
  properties?: {
    title: string;
    address: string;
    price: number;
    price_currency: string;
  } | null;
}

interface SalesProcessStatsProps {
  agentId: string;
}

export default function SalesProcessStats({ agentId }: SalesProcessStatsProps) {
  const [visits, setVisits] = useState<PropertyVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState<PropertyVisit | null>(null);
  const [saleData, setSaleData] = useState({
    saleAmount: '',
    commissionPercentage: '',
    currency: 'USD' as 'USD' | 'BOB',
    transactionType: 'venta' as 'venta' | 'alquiler' | 'anticretico'
  });

  const exchangeRate = 6.96; // USD to BOB rate

  useEffect(() => {
    fetchVisits();
  }, [agentId]);

  const fetchVisits = async () => {
    try {
      const { data, error } = await supabase
        .from('property_visits')
        .select(`
          *,
          properties (
            title,
            address,
            price,
            price_currency
          )
        `)
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Fetched visits data:', data);
      console.log('Agent ID:', agentId);
      
      setVisits((data as any) || []);
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateVisitStatus = async (visitId: string, newStatus: string, additionalData?: any) => {
    try {
      const { error } = await supabase
        .from('property_visits')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString(),
          ...additionalData 
        })
        .eq('id', visitId);

      if (error) throw error;
      
      toast.success('Estado actualizado correctamente');
      fetchVisits();
    } catch (error) {
      console.error('Error updating visit:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const handleVisitResult = (visit: PropertyVisit, result: 'successful' | 'rejected') => {
    if (result === 'successful') {
      setSelectedVisit(visit);
    } else {
      updateVisitStatus(visit.id, 'rejected', { visit_result: 'rejected' });
    }
  };

  const handleSaleComplete = async () => {
    if (!selectedVisit) return;

    const commissionAmount = (parseFloat(saleData.saleAmount) * parseFloat(saleData.commissionPercentage)) / 100;

    await updateVisitStatus(selectedVisit.id, 'successful', {
      visit_result: 'successful',
      sale_amount: parseFloat(saleData.saleAmount),
      commission_percentage: parseFloat(saleData.commissionPercentage),
      commission_amount: commissionAmount,
      currency: saleData.currency,
      transaction_type: saleData.transactionType
    });

    setSelectedVisit(null);
    setSaleData({
      saleAmount: '',
      commissionPercentage: '',
      currency: 'USD',
      transactionType: 'venta'
    });
  };

  const getStatsData = () => {
    console.log('All visits:', visits);
    console.log('Visit statuses:', visits.map(v => ({ id: v.id, status: v.status })));
    
    const pending = visits.filter(v => v.status === 'pending').length;
    const confirmed = visits.filter(v => v.status === 'confirmed').length;
    const completed = visits.filter(v => v.status === 'completed').length;
    const successful = visits.filter(v => v.status === 'successful');
    
    console.log('Stats:', { pending, confirmed, completed, successful: successful.length });
    
    const totalSalesUSD = successful
      .filter(v => v.currency === 'USD')
      .reduce((sum, v) => sum + (v.sale_amount || 0), 0);
    
    const totalSalesBOB = successful
      .filter(v => v.currency === 'BOB')
      .reduce((sum, v) => sum + (v.sale_amount || 0), 0);

    const totalCommissionUSD = successful
      .filter(v => v.currency === 'USD')
      .reduce((sum, v) => sum + (v.commission_amount || 0), 0);
    
    const totalCommissionBOB = successful
      .filter(v => v.currency === 'BOB')
      .reduce((sum, v) => sum + (v.commission_amount || 0), 0);

    return {
      pending,
      confirmed,
      completed,
      successful: successful.length,
      totalSalesUSD,
      totalSalesBOB,
      totalCommissionUSD,
      totalCommissionBOB
    };
  };

  const stats = getStatsData();

  const StatCard = ({ 
    icon: Icon, 
    title, 
    count, 
    color, 
    bgColor,
    subtitle,
    details
  }: {
    icon: any;
    title: string;
    count: number;
    color: string;
    bgColor: string;
    subtitle?: string;
    details?: React.ReactNode;
  }) => (
    <Card className={`${bgColor} border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-10 rounded-full -mr-8 -mt-8`}></div>
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-foreground">{count}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Total</div>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mb-2">{subtitle}</p>}
          {details && <div className="mt-3">{details}</div>}
        </div>
      </CardContent>
    </Card>
  );

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Pendiente', icon: Clock };
      case 'confirmed':
        return { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Confirmada', icon: CheckCircle };
      case 'completed':
        return { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Realizada', icon: Eye };
      case 'successful':
        return { color: 'bg-green-100 text-green-800 border-green-200', label: 'Exitosa', icon: DollarSign };
      case 'rejected':
        return { color: 'bg-red-100 text-red-800 border-red-200', label: 'Rechazada', icon: Clock };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', label: status, icon: Clock };
    }
  };

  const VisitCard = ({ visit }: { visit: PropertyVisit }) => {
    const statusInfo = getStatusInfo(visit.status);
    const StatusIcon = statusInfo.icon;

    return (
      <Card className="border-l-4 border-l-primary hover:shadow-md transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-semibold text-lg text-foreground">{visit.properties?.title}</h4>
                <Badge className={`${statusInfo.color} flex items-center gap-1`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusInfo.label}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <MapPin className="w-4 h-4" />
                <span>{visit.properties?.address}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{visit.client_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{visit.client_phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{visit.client_email}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <Badge variant="outline" className="mb-2">
                {new Date(visit.scheduled_at).toLocaleDateString('es-ES', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short'
                })}
              </Badge>
              <div className="text-xs text-muted-foreground">
                {new Date(visit.scheduled_at).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>

          {visit.message && (
            <div className="bg-muted/50 p-3 rounded-lg mb-4">
              <p className="text-sm text-muted-foreground">
                <strong>Mensaje:</strong> {visit.message}
              </p>
            </div>
          )}
          
          {visit.status === 'pending' && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => updateVisitStatus(visit.id, 'confirmed')}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmar Cita
              </Button>
            </div>
          )}
          
          {visit.status === 'confirmed' && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => updateVisitStatus(visit.id, 'completed')}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                <Eye className="w-4 h-4 mr-2" />
                Marcar como Realizada
              </Button>
            </div>
          )}
          
          {visit.status === 'completed' && (
            <div className="flex gap-3">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleVisitResult(visit, 'rejected')}
                className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
              >
                Visita Rechazada
              </Button>
              <Button 
                size="sm" 
                onClick={() => handleVisitResult(visit, 'successful')}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Visita Exitosa
              </Button>
            </div>
          )}
          
          {visit.status === 'successful' && visit.sale_amount && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-green-700 font-medium">Tipo de Transacción:</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {visit.transaction_type?.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-700">Monto de Venta:</span>
                    <span className="font-bold text-green-800">
                      {visit.currency === 'USD' ? '$' : 'Bs. '}{visit.sale_amount?.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-green-700">Porcentaje Comisión:</span>
                    <span className="font-semibold text-green-800">{visit.commission_percentage}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-700">Comisión Ganada:</span>
                    <span className="font-bold text-green-800">
                      {visit.currency === 'USD' ? '$' : 'Bs. '}{visit.commission_amount?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              
              {visit.currency === 'USD' && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <div className="text-xs text-green-600">
                    <strong>Equivalente en Bolivianos:</strong> Bs. {((visit.commission_amount || 0) * exchangeRate).toLocaleString()}
                  </div>
                </div>
              )}
              
              {visit.currency === 'BOB' && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <div className="text-xs text-green-600">
                    <strong>Equivalente en Dólares:</strong> ${((visit.commission_amount || 0) / exchangeRate).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return <div className="text-center py-4">Cargando estadísticas...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Proceso de Ventas</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Clock}
          title="Citas Pendientes"
          count={stats.pending}
          color="bg-amber-500"
          bgColor="bg-gradient-to-br from-amber-50 to-yellow-50"
          subtitle="Esperando confirmación"
        />

        <StatCard
          icon={CheckCircle}
          title="Citas Confirmadas"
          count={stats.confirmed}
          color="bg-blue-500"
          bgColor="bg-gradient-to-br from-blue-50 to-indigo-50"
          subtitle="Listas para realizar"
        />

        <StatCard
          icon={Eye}
          title="Visitas Realizadas"
          count={stats.completed}
          color="bg-orange-500"
          bgColor="bg-gradient-to-br from-orange-50 to-red-50"
          subtitle="Esperando resultado"
        />

        <StatCard
          icon={DollarSign}
          title="Ventas Exitosas"
          count={stats.successful}
          color="bg-emerald-500"
          bgColor="bg-gradient-to-br from-emerald-50 to-green-50"
          subtitle="Transacciones completadas"
          details={
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Ventas USD:</span>
                <span className="font-semibold text-green-600">${stats.totalSalesUSD.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Ventas BOB:</span>
                <span className="font-semibold text-green-600">Bs. {stats.totalSalesBOB.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Comisión USD:</span>
                  <span className="font-bold text-emerald-600">${stats.totalCommissionUSD.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Comisión BOB:</span>
                  <span className="font-bold text-emerald-600">Bs. {stats.totalCommissionBOB.toLocaleString()}</span>
                </div>
              </div>
            </div>
          }
        />
      </div>

      {/* Active Appointments Management */}
      {(stats.pending > 0 || stats.confirmed > 0 || stats.completed > 0) && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Citas Programadas</h3>
            <div className="text-sm text-muted-foreground">
              Gestiona las visitas a tus propiedades solicitadas por clientes
            </div>
          </div>

          <div className="grid gap-4">
            {/* Pending Appointments */}
            {visits.filter(v => v.status === 'pending').map(visit => (
              <VisitCard key={visit.id} visit={visit} />
            ))}
            
            {/* Confirmed Appointments */}
            {visits.filter(v => v.status === 'confirmed').map(visit => (
              <VisitCard key={visit.id} visit={visit} />
            ))}
            
            {/* Completed Visits */}
            {visits.filter(v => v.status === 'completed').map(visit => (
              <VisitCard key={visit.id} visit={visit} />
            ))}
          </div>
        </div>
      )}

      {/* Successful Sales History */}
      {stats.successful > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-green-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Historial de Ventas Exitosas</h3>
          </div>

          <div className="grid gap-4">
            {visits.filter(v => v.status === 'successful').map(visit => (
              <VisitCard key={visit.id} visit={visit} />
            ))}
          </div>
        </div>
      )}

      {/* Sale Completion Dialog */}
      <Dialog open={!!selectedVisit} onOpenChange={() => setSelectedVisit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Venta Exitosa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transactionType">Tipo de Transacción</Label>
              <Select value={saleData.transactionType} onValueChange={(value: any) => setSaleData(prev => ({ ...prev, transactionType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="venta">Venta</SelectItem>
                  <SelectItem value="alquiler">Alquiler</SelectItem>
                  <SelectItem value="anticretico">Anticrético</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Select value={saleData.currency} onValueChange={(value: any) => setSaleData(prev => ({ ...prev, currency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">Dólares (USD)</SelectItem>
                  <SelectItem value="BOB">Bolivianos (BOB)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="saleAmount">Monto de la Transacción</Label>
              <Input
                id="saleAmount"
                type="number"
                placeholder="Ingrese el monto"
                value={saleData.saleAmount}
                onChange={(e) => setSaleData(prev => ({ ...prev, saleAmount: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commissionPercentage">Porcentaje de Comisión (%)</Label>
              <Input
                id="commissionPercentage"
                type="number"
                placeholder="Ej: 5, 7, 10"
                value={saleData.commissionPercentage}
                onChange={(e) => setSaleData(prev => ({ ...prev, commissionPercentage: e.target.value }))}
              />
              <div className="text-xs text-gray-500">
                Para alquileres: normalmente 50%, 70% o 100%
              </div>
            </div>

            {saleData.saleAmount && saleData.commissionPercentage && (
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-green-800">
                  <strong>Comisión calculada:</strong> {' '}
                  {((parseFloat(saleData.saleAmount) * parseFloat(saleData.commissionPercentage)) / 100).toLocaleString()} {saleData.currency}
                </div>
                {saleData.currency === 'USD' && (
                  <div className="text-xs text-green-600">
                    Equivalente: Bs. {((parseFloat(saleData.saleAmount) * parseFloat(saleData.commissionPercentage)) / 100 * exchangeRate).toLocaleString()}
                  </div>
                )}
                {saleData.currency === 'BOB' && (
                  <div className="text-xs text-green-600">
                    Equivalente: ${((parseFloat(saleData.saleAmount) * parseFloat(saleData.commissionPercentage)) / 100 / exchangeRate).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectedVisit(null)} className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={handleSaleComplete} 
                className="flex-1"
                disabled={!saleData.saleAmount || !saleData.commissionPercentage}
              >
                Registrar Venta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}