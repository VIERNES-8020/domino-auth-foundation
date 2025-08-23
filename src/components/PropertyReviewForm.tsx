import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, MessageSquare } from "lucide-react";

interface PropertyReviewFormProps {
  propertyId: string;
  isOpen: boolean;
  onClose: () => void;
  onReviewAdded: () => void;
}

export default function PropertyReviewForm({ 
  propertyId, 
  isOpen, 
  onClose, 
  onReviewAdded 
}: PropertyReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewData, setReviewData] = useState({
    clientName: "",
    clientEmail: "",
    comment: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Por favor selecciona una puntuación");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("property_reviews")
        .insert({
          property_id: propertyId,
          client_name: reviewData.clientName,
          client_email: reviewData.clientEmail,
          rating: rating,
          comment: reviewData.comment,
          is_approved: false // Requires admin approval
        });

      if (error) throw error;

      toast.success("¡Reseña enviada exitosamente! Será publicada después de la moderación.");
      onReviewAdded();
      onClose();
      setRating(0);
      setReviewData({ clientName: "", clientEmail: "", comment: "" });
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Error al enviar la reseña. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Deja tu reseña
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Califica la propiedad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="transition-colors"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= (hoveredRating || rating)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  {rating === 1 && "Muy malo"}
                  {rating === 2 && "Malo"}
                  {rating === 3 && "Regular"}
                  {rating === 4 && "Bueno"}
                  {rating === 5 && "Excelente"}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div>
              <Label htmlFor="review-name">Tu nombre *</Label>
              <Input
                id="review-name"
                value={reviewData.clientName}
                onChange={(e) => setReviewData(prev => ({ ...prev, clientName: e.target.value }))}
                placeholder="Tu nombre"
                required
              />
            </div>

            <div>
              <Label htmlFor="review-email">Correo electrónico *</Label>
              <Input
                id="review-email"
                type="email"
                value={reviewData.clientEmail}
                onChange={(e) => setReviewData(prev => ({ ...prev, clientEmail: e.target.value }))}
                placeholder="tu@correo.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="review-comment">Tu comentario</Label>
              <Textarea
                id="review-comment"
                value={reviewData.comment}
                onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Comparte tu experiencia con esta propiedad..."
                className="min-h-[100px]"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={rating === 0 || !reviewData.clientName || !reviewData.clientEmail || loading}
              className="flex-1"
            >
              {loading ? "Enviando..." : "Enviar reseña"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}