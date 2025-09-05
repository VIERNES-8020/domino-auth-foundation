import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { User, MapPin, Star, Search, Filter } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface AgentProfile { 
  id: string; 
  full_name: string | null; 
  avatar_url?: string | null; 
  bio?: string | null;
  agent_code?: string | null;
  title?: string | null;
  experience_summary?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
  twitter_url?: string | null;
  website_url?: string | null;
}

function usePageSEO(opts: { title: string; description: string; canonicalPath: string }) {
  const { title, description, canonicalPath } = opts;
  useEffect(() => {
    document.title = title;
    const ensure = (n: string, c: string) => {
      let el = document.querySelector(`meta[name="${n}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", n); document.head.appendChild(el); }
      el.setAttribute("content", c);
    };
    ensure("description", description);
    const canonicalUrl = new URL(canonicalPath, window.location.origin).toString();
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) { link = document.createElement("link"); link.setAttribute("rel", "canonical"); document.head.appendChild(link); }
    link.setAttribute("href", canonicalUrl);
  }, [title, description, canonicalPath]);
}

export default function AgentsPage() {
  const { t } = useLanguage();
  usePageSEO({ title: t("agents_page_title"), description: t("agents_seo_description"), canonicalPath: "/agents" });
  
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [minRating, setMinRating] = useState<string>("all");
  const [displayCount, setDisplayCount] = useState(12);
  const [agentPerformance, setAgentPerformance] = useState<Record<string, {average_rating: number, total_ratings: number}>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Get public agent information using the secure function
        const { data, error } = await supabase.rpc('get_public_agent_info');
        
        if (!active) return;
        setAgents((data as AgentProfile[]) ?? []);
        
        // Get agent performance data
        const { data: performanceData } = await supabase
          .from("agent_performance")
          .select("agent_id, average_rating, total_ratings");
        
        if (performanceData) {
          const performanceMap = performanceData.reduce((acc, perf) => {
            acc[perf.agent_id] = {
              average_rating: Number(perf.average_rating) || 4.8,
              total_ratings: perf.total_ratings || 0
            };
            return acc;
          }, {} as Record<string, {average_rating: number, total_ratings: number}>);
          setAgentPerformance(performanceMap);
        }
        
        setLoading(false);
      } catch (e) { 
        console.error("Error loading agents:", e);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Filter agents based on search and rating
  useEffect(() => {
    let filtered = agents;
    
    if (searchTerm.trim()) {
      filtered = filtered.filter(agent => 
        agent.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.agent_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (minRating && minRating !== "all") {
      const minRatingNum = Number(minRating);
      filtered = filtered.filter(agent => {
        const performance = agentPerformance[agent.id];
        return performance && performance.average_rating >= minRatingNum;
      });
    }
    
    setFilteredAgents(filtered);
  }, [agents, searchTerm, minRating, agentPerformance]);

  const displayedAgents = filteredAgents.slice(0, displayCount);
  const hasMore = filteredAgents.length > displayCount;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
        <main className="container mx-auto py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">{t("loading_agents")}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <main className="container mx-auto py-16">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            {t("our_agents")}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("agents_description")}
          </p>
        </header>

        {/* Search and Filter Section */}
        <section className="mb-12">
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder={t("search_agents_placeholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={t("minimum_rating")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all_ratings")}</SelectItem>
                    <SelectItem value="4.5">{t("stars_45_plus")}</SelectItem>
                    <SelectItem value="4.0">{t("stars_40_plus")}</SelectItem>
                    <SelectItem value="3.5">{t("stars_35_plus")}</SelectItem>
                    <SelectItem value="3.0">{t("stars_30_plus")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(searchTerm || (minRating && minRating !== "all")) && (
              <div className="mt-4 text-sm text-muted-foreground">
                {t("showing_agents")} {filteredAgents.length} {t("of_agents")} {agents.length} {t("agents")}
              </div>
            )}
          </Card>
        </section>

        <section className="animate-fade-in">
          {agents.length === 0 ? (
            <div className="text-center py-16">
              <User className="h-24 w-24 text-muted-foreground/40 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-muted-foreground mb-2">{t("coming_soon")}</h3>
              <p className="text-muted-foreground">{t("preparing_profiles")}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {displayedAgents.map((agent) => {
                  const performance = agentPerformance[agent.id] || { average_rating: 4.8, total_ratings: 0 };
                  return (
                    <Card key={agent.id} className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-card border-0 shadow-lg">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent group-hover:from-primary/10 transition-all duration-300" />
                      
                      <CardContent className="p-0 relative">
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <img 
                            src={agent.avatar_url || "/default-placeholder.jpg"}
                            alt={`${t("agent")} ${agent.full_name ?? agent.id}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => { 
                              (e.currentTarget as HTMLImageElement).src = "/default-placeholder.jpg"; 
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          
                          <div className="absolute top-4 right-4">
                            <div className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-medium">{performance.average_rating.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-6">
                          <div className="mb-4">
                            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-1">
                              {agent.full_name ?? `${t("agent")} ${agent.id.slice(0,8)}`}
                            </h3>
                            <p className="text-primary font-medium text-sm mt-1">
                              {agent.title || t("real_estate_broker")}
                            </p>
                            <p className="text-muted-foreground text-xs mt-1">
                              {t("code")}: {agent.agent_code || "N/A"}
                            </p>
                          </div>

                          {agent.bio && (
                            <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                              {agent.bio}
                            </p>
                          )}

                          <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{t("available_in_bolivia")}</span>
                          </div>

                          <Button 
                            asChild 
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 hover:shadow-lg"
                          >
                            <Link to={`/agente/${agent.agent_code}`}>
                              {t("view_full_profile")}
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {hasMore && (
                <div className="text-center mt-12">
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => setDisplayCount(prev => prev + 12)}
                  >
                    {t("load_more_agents")}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>

        {agents.length > 0 && (
          <section className="mt-20 text-center">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20">
              <h2 className="text-2xl font-bold mb-4">{t("need_personalized_help")}</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                {t("agents_ready_help")}
              </p>
              <Button asChild variant="outline" size="lg">
                <Link to="/contact">{t("contact_now")}</Link>
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}