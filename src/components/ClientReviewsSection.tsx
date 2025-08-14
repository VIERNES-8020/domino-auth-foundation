import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Star, Quote, MessageSquare } from "lucide-react";

interface ClientReview {
  id: string;
  client_name: string;
  transaction_type: string;
  company_rating: number;
  agent_rating: number;
  comment: string | null;
  created_at: string;
}

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3 w-3 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`}
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

interface ClientReviewsSectionProps {
  agentId: string;
}

export default function ClientReviewsSection({ agentId }: ClientReviewsSectionProps) {
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("client_reviews")
          .select("id, client_name, transaction_type, company_rating, agent_rating, comment, created_at")
          .eq("agent_id", agentId)
          .eq("is_approved", true)
          .order("created_at", { ascending: false })
          .limit(6);
        
        if (!active) return;
        if (error) {
          console.error("Error loading reviews:", error);
          setReviews([]);
        } else {
          setReviews(data || []);
        }
        setLoading(false);
      } catch (e) { 
        console.error("Error loading reviews:", e);
        setReviews([]);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [agentId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          Opiniones de mis Clientes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-48 bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          Opiniones de mis Clientes
        </h2>
        <p className="text-muted-foreground">
          Lo que dicen mis clientes sobre mi trabajo y atención
        </p>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              Aún no hay opiniones
            </h3>
            <p className="text-muted-foreground text-sm">
              Las opiniones de clientes aparecerán aquí una vez que haya transacciones completadas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review) => {
            const transactionConfig = getTransactionTypeBadge(review.transaction_type);
            return (
              <Card key={review.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  {/* Quote Icon */}
                  <div className="mb-4">
                    <Quote className="h-6 w-6 text-primary/40" />
                  </div>

                  {/* Client Info */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-foreground">{review.client_name}</h4>
                      <Badge variant={transactionConfig.variant} className="text-xs">
                        {transactionConfig.label}
                      </Badge>
                    </div>
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
                    <blockquote className="text-muted-foreground text-sm italic mb-4 line-clamp-3">
                      "{review.comment}"
                    </blockquote>
                  )}

                  {/* Ratings */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Empresa:</span>
                      <StarRating rating={review.company_rating} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Agente:</span>
                      <StarRating rating={review.agent_rating} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}