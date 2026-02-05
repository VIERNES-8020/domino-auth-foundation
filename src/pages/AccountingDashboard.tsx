import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, DollarSign, Users, Building2, Download, BarChart3 } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import * as XLSX from 'xlsx';

export default function AccountingDashboard() {
  const [activeTab, setActiveTab] = useState("ventas");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [salesByOffice, setSalesByOffice] = useState<any[]>([]);
  const [agentCommissions, setAgentCommissions] = useState<any[]>([]);
  const [totalSuccessfulSales, setTotalSuccessfulSales] = useState(0);
  const [activeOffices, setActiveOffices] = useState(0);
  const [activeAgents, setActiveAgents] = useState(0);
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
        await fetchStats();
      }
      setLoading(false);
    };
    getCurrentUser();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
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
        .eq('status', 'validated');

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
        .eq('status', 'validated')
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
        .eq('status', 'validated');

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

  const fetchStats = async () => {
    try {
      // Contar ventas validadas
      const { count: salesCount } = await supabase
        .from('sale_closures')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'validated');
      
      setTotalSuccessfulSales(salesCount || 0);

      // Contar oficinas activas (franchises con ventas)
      const { data: franchisesData } = await supabase
        .from('franchises')
        .select('id');
      
      setActiveOffices(franchisesData?.length || 0);

      // Contar agentes activos (no archivados con código de agente)
      const { count: agentsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('agent_code', 'is', null)
        .eq('is_archived', false);
      
      setActiveAgents(agentsCount || 0);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleExportReport = async () => {
    try {
      const now = new Date();
      const month = now.toLocaleString('es', { month: 'long' });
      const year = now.getFullYear();
      
      // Obtener ventas del mes actual
      const firstDayOfMonth = new Date(year, now.getMonth(), 1);
      const { data: sales, error } = await supabase
        .from('sale_closures')
        .select(`
          id,
          closure_date,
          closure_price,
          currency,
          status,
          properties(title),
          agent_captador:profiles!agent_captador_id(full_name),
          agent_vendedor:profiles!agent_vendedor_id(full_name)
        `)
        .eq('status', 'validated')
        .gte('closure_date', firstDayOfMonth.toISOString());

      if (error) throw error;

      if (!sales || sales.length === 0) {
        toast.error('No hay ventas validadas este mes para exportar');
        return;
      }

      // Preparar datos para Excel según los requisitos
      const excelData = sales.map((sale: any) => ({
        'Fecha': new Date(sale.closure_date).toLocaleDateString('es-ES'),
        'Propiedad': sale.properties?.title || 'N/A',
        'Agente Captador': sale.agent_captador?.full_name || 'N/A',
        'Agente Vendedor': sale.agent_vendedor?.full_name || 'N/A',
        'Precio Cierre': `${sale.currency || 'USD'} ${Number(sale.closure_price).toLocaleString()}`,
        'Estado': sale.status || 'validado'
      }));

      // Crear workbook y worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Ajustar ancho de columnas
      ws['!cols'] = [
        { wch: 12 }, // Fecha
        { wch: 30 }, // Propiedad
        { wch: 25 }, // Agente Captador
        { wch: 25 }, // Agente Vendedor
        { wch: 18 }, // Precio Cierre
        { wch: 15 }  // Estado
      ];
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ventas Validadas');

      // Descargar archivo con formato especificado
      const fileName = `Balance_Mensual_${month}_${year}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success('Reporte generado y descargado correctamente');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Error al generar el reporte');
    }
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
            <div className="relative p-4 sm:p-8">
              <div className="flex flex-col gap-4 sm:gap-6">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-4">
                    {profile?.avatar_url && (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-indigo-500/20 flex-shrink-0">
                        <img 
                          src={profile.avatar_url} 
                          alt="Foto de perfil"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full animate-pulse flex-shrink-0"></div>
                      <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-indigo-600 truncate">
                        Panel de Contabilidad
                      </h1>
                    </div>
                  </div>
                  {profile && (
                    <div className="space-y-1.5 sm:space-y-2">
                      <p className="text-sm sm:text-lg text-muted-foreground truncate">
                        Bienvenido, <span className="font-semibold text-indigo-600 truncate">{profile.full_name || user?.email}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <Badge variant="outline" className="text-xs sm:text-sm font-mono bg-indigo-500/5 border-indigo-500/20 text-indigo-600">
                          Contabilidad
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] sm:text-xs">
                          {activeOffices} Oficinas
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] sm:text-xs">
                          {activeAgents} Agentes
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] sm:text-xs">
                          {totalSuccessfulSales} Ventas
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button 
                    onClick={handleExportReport}
                    className="bg-gradient-to-r from-indigo-500 to-indigo-400 hover:from-indigo-600 hover:to-indigo-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 gap-2 h-9 text-sm w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4" />
                    <span className="sm:hidden">Exportar</span>
                    <span className="hidden sm:inline">Exportar Reporte</span>
                  </Button>
                  <Button variant="outline" asChild className="h-9 text-sm">
                    <Link to="/">Portal Principal</Link>
                  </Button>
                  <Button variant="outline" className="h-9 text-sm" onClick={async () => {
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium truncate">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold truncate">
                ${financialReport.totalIncome.toLocaleString()}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                De ventas validadas
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Oficinas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{activeOffices}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Oficinas activas
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium truncate">Agentes Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{activeAgents}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                No archivados
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium truncate">Ventas Exitosas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{totalSuccessfulSales}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Ventas validadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="bg-card border border-border inline-flex w-max sm:w-auto">
              <TabsTrigger value="ventas" className="text-xs sm:text-sm px-3 sm:px-4">Ventas por Oficina</TabsTrigger>
              <TabsTrigger value="comisiones" className="text-xs sm:text-sm px-3 sm:px-4">Comisiones</TabsTrigger>
              <TabsTrigger value="ranking" className="text-xs sm:text-sm px-3 sm:px-4">Ranking</TabsTrigger>
              <TabsTrigger value="reporte" className="text-xs sm:text-sm px-3 sm:px-4">Reporte</TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Ventas por Oficina */}
          <TabsContent value="ventas">
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-base sm:text-lg">Ventas por Oficina</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Resumen de ventas por cada oficina</CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                {officeStats.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm">
                    No existen cierres validados.
                  </p>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {officeStats.map((office, index) => (
                      <div key={index} className="flex items-center justify-between p-3 sm:p-4 border border-border rounded-lg gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm sm:text-base truncate">{office.name}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{office.salesCount} ventas</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg sm:text-2xl font-bold">${office.totalSales.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comisiones de Agentes */}
          <TabsContent value="comisiones">
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-base sm:text-lg">Comisiones de Agentes</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Detalle de comisiones por venta</CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                {agentCommissions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm">
                    No existen cierres validados.
                  </p>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {agentCommissions.slice(0, 20).map((sale) => (
                      <div key={sale.id} className="p-3 sm:p-4 border border-border rounded-lg">
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm sm:text-base truncate">Venta #{sale.id.slice(0, 8)}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {new Date(sale.closure_date).toLocaleDateString('es')}
                            </p>
                          </div>
                          <Badge className="text-[10px] sm:text-xs flex-shrink-0">{sale.transaction_type}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-3">
                          <div>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">Captador</p>
                            <p className="font-medium text-xs sm:text-sm truncate">{sale.agent_captador?.full_name}</p>
                            <p className="text-xs sm:text-sm text-primary">${Number(sale.captador_amount || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">Vendedor</p>
                            <p className="font-medium text-xs sm:text-sm truncate">{sale.agent_vendedor?.full_name}</p>
                            <p className="text-xs sm:text-sm text-primary">${Number(sale.vendedor_amount || 0).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ranking de Asesores */}
          <TabsContent value="ranking">
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-base sm:text-lg">Top 10 Asesores</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Ranking por comisiones generadas</CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                {agentRanking.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm">
                    No existen registros de ventas aprobadas.
                  </p>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {agentRanking.map((agent, index) => (
                      <div key={index} className="flex items-center justify-between p-3 sm:p-4 border border-border rounded-lg gap-2">
                        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm sm:text-base flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm sm:text-base truncate">{agent.name}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">Código: {agent.code}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base sm:text-xl font-bold text-primary">
                            ${agent.totalCommission.toLocaleString()}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{agent.salesCount} ventas</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reporte Financiero */}
          <TabsContent value="reporte">
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-base sm:text-lg">Reporte de Ingresos y Egresos</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Balance financiero general</CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="space-y-4 sm:space-y-6">
                  <div className="p-4 sm:p-6 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground">Ingresos Totales</p>
                        <p className="text-xl sm:text-3xl font-bold text-green-600 truncate">
                          ${financialReport.totalIncome.toLocaleString()}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 text-green-600 flex-shrink-0" />
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground">Egresos Totales</p>
                        <p className="text-xl sm:text-3xl font-bold text-red-600 truncate">
                          ${financialReport.totalExpenses.toLocaleString()}
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 sm:h-12 sm:w-12 text-red-600 flex-shrink-0" />
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground">Utilidad Neta</p>
                        <p className="text-xl sm:text-3xl font-bold text-primary truncate">
                          ${financialReport.netProfit.toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 sm:h-12 sm:w-12 text-primary flex-shrink-0" />
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
