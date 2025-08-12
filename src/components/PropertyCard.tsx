import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

export interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    price?: number | null;
    price_currency?: string | null;
    image_urls?: string[] | null;
  };
  isFavorited?: boolean;
  onToggleFavorite?: (id: string, next: boolean) => void;
}

function formatPrice(price?: number | null, currency?: string | null) {
  if (typeof price !== "number") return "Precio a consultar";
  const cur = (currency || "USD").toUpperCase();
  const symbol = cur === "BOB" ? "Bs." : "$us.";
  return `${symbol} ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PropertyCard({ property, isFavorited = false, onToggleFavorite }: PropertyCardProps) {
  const cover = property.image_urls?.[0] || "/default-placeholder.jpg";
  const priceText = formatPrice(property.price, property.price_currency);

  const handleFavClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.(property.id, !isFavorited);
  };

  return (
    <Link to={`/properties/${property.id}`} aria-label={`Ver ${property.title}`} className="block">
      <Card key={property.id} className="relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {onToggleFavorite && (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label={isFavorited ? "Quitar de favoritos" : "Agregar a favoritos"}
            aria-pressed={isFavorited}
            className="absolute right-2 top-2 z-10"
            onClick={handleFavClick}
          >
            <Heart className="h-4 w-4" fill={isFavorited ? "currentColor" : "none"} />
          </Button>
        )}
        <AspectRatio ratio={16 / 9}>
          <img
            src={cover}
            alt={`Propiedad: ${property.title} — Inmobiliaria DOMINIO`}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement;
              if (el.src !== window.location.origin + "/default-placeholder.jpg") {
                el.src = "/default-placeholder.jpg";
              }
            }}
          />
        </AspectRatio>
        <CardContent className="p-4">
          <h3 className="font-semibold line-clamp-1">{property.title}</h3>
          <div className="mt-1 text-sm text-muted-foreground">
            <span className="font-medium">{priceText}</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">Match Score AURA — próximamente</div>
        </CardContent>
      </Card>
    </Link>
  );
}
