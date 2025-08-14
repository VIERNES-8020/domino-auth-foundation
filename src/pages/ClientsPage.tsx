import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Star, Quote, User, MessageSquare } from "lucide-react";

interface ClientReview {
  id: string;
  client_name: string;
  transaction_type: string;
  company_rating: number;
  agent_rating: number;
  comment: string | null;
  created_at: string;
  agent_id: string;
  agent?: {
    full_name: string | null;
    agent_code: string | null;
  };
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

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`}
        />
      ))}
    </div>
  );
};

const getTransactionTypeBadge = (type: string) => {
  const config = {
    venta: { label: "Venta", variant: "default" as const },
    alquiler: { label: "Alquiler", variant: "secondary" as const },
    anticrético: { label: "Anticrético", variant: "outline" as const },
  };
  
  return config[type as keyof typeof config] || { label: type, variant: "default" as const };
};

export default function ClientsPage() {
  usePageSEO({ 
    title: "Nuestros Clientes | DOMINIO", 
    description: "Lee testimonios reales de nuestros clientes satisfechos en toda Bolivia.", 
    canonicalPath: "/nuestros-clientes" 
  });
  
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("client_reviews")
          .select(`
            id,
            client_name,
            transaction_type,
            company_rating,
            agent_rating,
            comment,
            created_at,
            agent_id,
            agent:agent_id (
              full_name,
              agent_code
            )
          `)
          .eq("is_approved", true)
          .order("created_at", { ascending: false });
        
        if (!active) return;
        if (error) {
          console.error("Error loading reviews:", error);
          setReviews([]);
        } else {
          setReviews((data as any[]) || []);
        }
        setLoading(false);
      } catch (e) { 
        console.error("Error loading reviews:", e);
        setReviews([]);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
        <main className="container mx-auto py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando testimonios...</p>
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
            Nuestros Clientes
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre lo que dicen nuestros clientes sobre su experiencia con DOMINIO. 
            Testimonios reales de transacciones exitosas en toda Bolivia.
          </p>
        </header>

        <section className="animate-fade-in">
          {reviews.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="h-24 w-24 text-muted-foreground/40 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-muted-foreground mb-2">Próximamente</h3>
              <p className="text-muted-foreground">Estamos recopilando testimonios de nuestros clientes satisfechos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {reviews.map((review) => {
                const transactionConfig = getTransactionTypeBadge(review.transaction_type);
                return (
                  <Card key={review.id} className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-card border-0 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent group-hover:from-primary/10 transition-all duration-300" />
                    
                    <CardContent className="p-6 relative">
                      {/* Quote Icon */}
                      <div className="mb-4">
                        <Quote className="h-8 w-8 text-primary/40" />
                      </div>

                      {/* Client Info */}
                      <div className="mb-4">
                        <div className="flex items-center gap-3 mb-2">
                          <User className="h-5 w-5 text-primary" />
                          <h3 className="font-bold text-foreground">{review.client_name}</h3>
                        </div>
                        <Badge variant={transactionConfig.variant} className="mb-2">
                          {transactionConfig.label}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString('es-BO', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>

                      {/* Comment */}
                      {review.comment && (
                        <blockquote className="text-muted-foreground text-sm italic mb-4 line-clamp-4">
                          "{review.comment}"
                        </blockquote>
                      )}

                      {/* Ratings */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-muted-foreground">Empresa:</span>
                            <StarRating rating={review.company_rating} />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-muted-foreground">Agente:</span>
                            <StarRating rating={review.agent_rating} />
                          </div>
                        </div>
                      </div>

                      {/* Agent Info */}
                      {review.agent && (
                        <div className="mt-4 pt-4 border-t border-border/60">
                          <p className="text-xs text-muted-foreground">
                            Agente: <span className="font-medium text-foreground">
                              {review.agent.full_name || 'Agente DOMINIO'}
                            </span>
                            {review.agent.agent_code && (
                              <span className="ml-2 text-primary">#{review.agent.agent_code}</span>
                            )}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Call to Action Section */}
        {reviews.length > 0 && (
          <section className="mt-20 text-center">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20">
              <h2 className="text-2xl font-bold mb-4">¿Quieres ser parte de nuestros testimonios?</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Únete a miles de clientes satisfechos que han encontrado su propiedad ideal con nosotros.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <a href="/properties">Explorar Propiedades</a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="/contact">Contactar Ahora</a>
                </Button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}