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
  status: 'pending' | 'confirmed' | 'completed' | 'successful' | 'rejected';
  message?: string;
  visit_result?: 'successful' | 'rejected';
  sale_amount?: number;
  commission_percentage?: number;
  commission_amount?: number;
  currency?: 'USD' | 'BOB';
  transaction_type?: 'venta' | 'alquiler' | 'anticretico';
  created_at: string;
  properties?: {
    title: string;
    address: string;
    price: number;
    price_currency: string;
  };
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
      setVisits(data || []);
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
    const pending = visits.filter(v => v.status === 'pending').length;
    const confirmed = visits.filter(v => v.status === 'confirmed').length;
    const completed = visits.filter(v => v.status === 'completed').length;
    const successful = visits.filter(v => v.status === 'successful');
    
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
    children 
  }: {
    icon: any;
    title: string;
    count: number;
    color: string;
    bgColor: string;
    children?: React.ReactNode;
  }) => (
    <Card className={`${bgColor} border-2 hover:shadow-lg transition-all duration-300`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-800">{count}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
        </div>
        <div className="text-sm font-medium text-gray-700 text-center mb-3">
          {title}
        </div>
        {children}
      </CardContent>
    </Card>
  );

  const VisitCard = ({ visit }: { visit: PropertyVisit }) => (
    <Card className="mb-3 border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-semibold">{visit.properties?.title}</h4>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <MapPin className="w-4 h-4" />
              {visit.properties?.address}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {visit.client_name}
              </div>
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {visit.client_phone}
              </div>
            </div>
          </div>
          <Badge variant="outline">
            {new Date(visit.scheduled_at).toLocaleDateString()}
          </Badge>
        </div>
        
        {visit.status === 'pending' && (
          <Button 
            size="sm" 
            onClick={() => updateVisitStatus(visit.id, 'confirmed')}
            className="w-full"
          >
            Confirmar Cita
          </Button>
        )}
        
        {visit.status === 'confirmed' && (
          <Button 
            size="sm" 
            onClick={() => updateVisitStatus(visit.id, 'completed')}
            className="w-full"
          >
            Marcar como Realizada
          </Button>
        )}
        
        {visit.status === 'completed' && (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleVisitResult(visit, 'rejected')}
              className="flex-1"
            >
              Visita Rechazada
            </Button>
            <Button 
              size="sm" 
              onClick={() => handleVisitResult(visit, 'successful')}
              className="flex-1"
            >
              Visita Exitosa
            </Button>
          </div>
        )}
        
        {visit.status === 'successful' && visit.sale_amount && (
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-green-800">
              <div><strong>Tipo:</strong> {visit.transaction_type}</div>
              <div><strong>Monto:</strong> {visit.sale_amount?.toLocaleString()} {visit.currency}</div>
              <div><strong>Comisión:</strong> {visit.commission_amount?.toLocaleString()} {visit.currency} ({visit.commission_percentage}%)</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <div className="text-center py-4">Cargando estadísticas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold text-primary">Proceso de Ventas</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          title="Citas Pendientes"
          count={stats.pending}
          color="bg-yellow-500"
          bgColor="bg-yellow-50"
        >
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {visits.filter(v => v.status === 'pending').map(visit => (
              <VisitCard key={visit.id} visit={visit} />
            ))}
          </div>
        </StatCard>

        <StatCard
          icon={CheckCircle}
          title="Citas Confirmadas"
          count={stats.confirmed}
          color="bg-blue-500"
          bgColor="bg-blue-50"
        >
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {visits.filter(v => v.status === 'confirmed').map(visit => (
              <VisitCard key={visit.id} visit={visit} />
            ))}
          </div>
        </StatCard>

        <StatCard
          icon={Eye}
          title="Visitas Realizadas"
          count={stats.completed}
          color="bg-orange-500"
          bgColor="bg-orange-50"
        >
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {visits.filter(v => v.status === 'completed').map(visit => (
              <VisitCard key={visit.id} visit={visit} />
            ))}
          </div>
        </StatCard>

        <StatCard
          icon={DollarSign}
          title="Ventas Exitosas"
          count={stats.successful}
          color="bg-green-500"
          bgColor="bg-green-50"
        >
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-sm font-semibold text-green-700 mb-1">Ventas Totales</div>
              {stats.totalSalesUSD > 0 && (
                <div className="text-xs">USD: ${stats.totalSalesUSD.toLocaleString()}</div>
              )}
              {stats.totalSalesBOB > 0 && (
                <div className="text-xs">BOB: Bs. {stats.totalSalesBOB.toLocaleString()}</div>
              )}
            </div>
            <div className="text-center border-t pt-2">
              <div className="text-sm font-semibold text-green-700 mb-1">Comisiones</div>
              {stats.totalCommissionUSD > 0 && (
                <div className="text-xs">USD: ${stats.totalCommissionUSD.toLocaleString()}</div>
              )}
              {stats.totalCommissionBOB > 0 && (
                <div className="text-xs">BOB: Bs. {stats.totalCommissionBOB.toLocaleString()}</div>
              )}
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {visits.filter(v => v.status === 'successful').map(visit => (
                <VisitCard key={visit.id} visit={visit} />
              ))}
            </div>
          </div>
        </StatCard>
      </div>

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