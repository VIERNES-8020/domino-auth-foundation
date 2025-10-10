import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, DollarSign, Users, Building2, Download, BarChart3 } from "lucide-react";

export default function AccountingDashboard() {
  const [activeTab, setActiveTab] = useState("ventas");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [salesByOffice, setSalesByOffice] = useState<any[]>([]);
  const [agentCommissions, setAgentCommissions] = useState<any[]>([]);
  const [financialReport, setFinancialReport] = useState<any>({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0
  });

  useEffect(() => {
    document.title = "Panel de Contabilidad - Dominio Inmobiliaria";
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchProfile(user.id);
        await fetchSalesByOffice();
        await fetchAgentCommissions();
        await fetchFinancialReport();
      }
      setLoading(false);
    };
    getCurrentUser();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, roles(nombre), franchises(name)')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchSalesByOffice = async () => {
    try {
      const { data, error } = await supabase
        .from('sale_closures')
        .select(`
          *,
          properties(franchise_id, franchises(name)),
          agent_captador:profiles!agent_captador_id(full_name),
          agent_vendedor:profiles!agent_vendedor_id(full_name)
        `)
        .eq('status', 'approved');

      if (error) throw error;
      setSalesByOffice(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const fetchAgentCommissions = async () => {
    try {
      const { data, error } = await supabase
        .from('sale_closures')
        .select(`
          *,
          agent_captador:profiles!agent_captador_id(full_name, agent_code),
          agent_vendedor:profiles!agent_vendedor_id(full_name, agent_code)
        `)
        .eq('status', 'approved')
        .order('closure_date', { ascending: false });

      if (error) throw error;
      setAgentCommissions(data || []);
    } catch (error) {
      console.error('Error fetching commissions:', error);
    }
  };

  const fetchFinancialReport = async () => {
    try {
      const { data, error } = await supabase
        .from('sale_closures')
        .select('closure_price, currency')
        .eq('status', 'approved');

      if (error) throw error;
      
      const totalIncome = data?.reduce((sum, sale) => sum + Number(sale.closure_price), 0) || 0;
      
      setFinancialReport({
        totalIncome,
        totalExpenses: 0, // Placeholder - se puede agregar lógica de gastos
        netProfit: totalIncome
      });
    } catch (error) {
      console.error('Error fetching financial report:', error);
    }
  };

  const handleExportReport = () => {
    toast.success('Exportando reporte...');
    // Implementar lógica de exportación
  };

  const calculateAgentRanking = () => {
    const agentStats = new Map();
    
    agentCommissions.forEach(sale => {
      // Captador
      const captadorId = sale.agent_captador_id;
      if (!agentStats.has(captadorId)) {
        agentStats.set(captadorId, {
          name: sale.agent_captador?.full_name || 'N/A',
          code: sale.agent_captador?.agent_code || 'N/A',
          totalCommission: 0,
          salesCount: 0
        });
      }
      const captadorData = agentStats.get(captadorId);
      captadorData.totalCommission += Number(sale.captador_amount || 0);
      captadorData.salesCount += 1;
      
      // Vendedor
      const vendedorId = sale.agent_vendedor_id;
      if (!agentStats.has(vendedorId)) {
        agentStats.set(vendedorId, {
          name: sale.agent_vendedor?.full_name || 'N/A',
          code: sale.agent_vendedor?.agent_code || 'N/A',
          totalCommission: 0,
          salesCount: 0
        });
      }
      const vendedorData = agentStats.get(vendedorId);
      vendedorData.totalCommission += Number(sale.vendedor_amount || 0);
      vendedorData.salesCount += 1;
    });

    return Array.from(agentStats.values())
      .sort((a, b) => b.totalCommission - a.totalCommission)
      .slice(0, 10);
  };

  const groupSalesByOffice = () => {
    const officeMap = new Map();
    
    salesByOffice.forEach(sale => {
      const officeName = sale.properties?.franchises?.name || 'Sin oficina';
      if (!officeMap.has(officeName)) {
        officeMap.set(officeName, {
          name: officeName,
          totalSales: 0,
          salesCount: 0
        });
      }
      const officeData = officeMap.get(officeName);
      officeData.totalSales += Number(sale.closure_price);
      officeData.salesCount += 1;
    });

    return Array.from(officeMap.values());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  const agentRanking = calculateAgentRanking();
  const officeStats = groupSalesByOffice();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Modern Header Section */}
          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-500/5 via-indigo-500/10 to-indigo-500/5 rounded-2xl border border-indigo-500/10 shadow-lg">
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            <div className="relative p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    {profile?.avatar_url && (
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-500/20">
                        <img 
                          src={profile.avatar_url} 
                          alt="Foto de perfil"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full animate-pulse"></div>
                      <h1 className="text-3xl lg:text-4xl font-bold text-indigo-600">
                        Panel de Contabilidad
                      </h1>
                    </div>
                  </div>
                  {profile && (
                    <div className="space-y-2">
                      <p className="text-lg text-muted-foreground">
                        Bienvenido, <span className="font-semibold text-indigo-600">{profile.full_name || user?.email}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-sm font-mono bg-indigo-500/5 border-indigo-500/20 text-indigo-600">
                          Contabilidad
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {officeStats.length} Oficinas
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {agentRanking.length} Agentes
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={handleExportReport}
                    className="bg-gradient-to-r from-indigo-500 to-indigo-400 hover:from-indigo-600 hover:to-indigo-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Exportar Reporte
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/">Portal Principal</Link>
                  </Button>
                  <Button variant="outline" onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = '/';
                  }}>
                    Cerrar Sesión
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${financialReport.totalIncome.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                De ventas aprobadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Oficinas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{officeStats.length}</div>
              <p className="text-xs text-muted-foreground">
                Oficinas activas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agentes Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agentRanking.length}</div>
              <p className="text-xs text-muted-foreground">
                Con comisiones generadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="ventas">Ventas por Oficina</TabsTrigger>
            <TabsTrigger value="comisiones">Comisiones de Agentes</TabsTrigger>
            <TabsTrigger value="ranking">Ranking de Asesores</TabsTrigger>
            <TabsTrigger value="reporte">Reporte Financiero</TabsTrigger>
          </TabsList>

          {/* Ventas por Oficina */}
          <TabsContent value="ventas">
            <Card>
              <CardHeader>
                <CardTitle>Ventas por Oficina</CardTitle>
                <CardDescription>Resumen de ventas por cada oficina</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {officeStats.map((office, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <p className="font-semibold">{office.name}</p>
                        <p className="text-sm text-muted-foreground">{office.salesCount} ventas</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${office.totalSales.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comisiones de Agentes */}
          <TabsContent value="comisiones">
            <Card>
              <CardHeader>
                <CardTitle>Comisiones Generadas por Agentes</CardTitle>
                <CardDescription>Detalle de comisiones por venta</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agentCommissions.slice(0, 20).map((sale) => (
                    <div key={sale.id} className="p-4 border border-border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">Venta #{sale.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(sale.closure_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge>{sale.transaction_type}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Captador</p>
                          <p className="font-medium">{sale.agent_captador?.full_name}</p>
                          <p className="text-sm text-primary">${Number(sale.captador_amount || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Vendedor</p>
                          <p className="font-medium">{sale.agent_vendedor?.full_name}</p>
                          <p className="text-sm text-primary">${Number(sale.vendedor_amount || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ranking de Asesores */}
          <TabsContent value="ranking">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Asesores</CardTitle>
                <CardDescription>Ranking por comisiones generadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agentRanking.map((agent, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{agent.name}</p>
                          <p className="text-sm text-muted-foreground">Código: {agent.code}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">
                          ${agent.totalCommission.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">{agent.salesCount} ventas</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reporte Financiero */}
          <TabsContent value="reporte">
            <Card>
              <CardHeader>
                <CardTitle>Reporte de Ingresos y Egresos</CardTitle>
                <CardDescription>Balance financiero general</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                        <p className="text-3xl font-bold text-green-600">
                          ${financialReport.totalIncome.toLocaleString()}
                        </p>
                      </div>
                      <TrendingUp className="h-12 w-12 text-green-600" />
                    </div>
                  </div>

                  <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Egresos Totales</p>
                        <p className="text-3xl font-bold text-red-600">
                          ${financialReport.totalExpenses.toLocaleString()}
                        </p>
                      </div>
                      <BarChart3 className="h-12 w-12 text-red-600" />
                    </div>
                  </div>

                  <div className="p-6 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Utilidad Neta</p>
                        <p className="text-3xl font-bold text-primary">
                          ${financialReport.netProfit.toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
}
