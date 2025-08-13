import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, BedDouble, Bath, Ruler } from "lucide-react";
import { Link } from "react-router-dom";

export interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    price?: number | null;
    price_currency?: string | null;
    image_urls?: string[] | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    area_m2?: number | null;
    transaction_type?: string | null;
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
  const br = typeof property.bedrooms === "number" ? property.bedrooms : undefined;
  const ba = typeof property.bathrooms === "number" ? property.bathrooms : undefined;
  const ar = typeof property.area_m2 === "number" ? property.area_m2 : undefined;
  const txLabel = property.transaction_type === "rent"
    ? "Alquiler"
    : property.transaction_type === "anticretico"
    ? "Anticrético"
    : property.transaction_type === "sale"
    ? "Venta"
    : undefined;

  const handleFavClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.(property.id, !isFavorited);
  };

return (
  <Link to={`/properties/${property.id}`} aria-label={`Ver ${property.title}`} className="block">
    <Card key={property.id} className="relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
      {onToggleFavorite && (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label={isFavorited ? "Quitar de favoritos" : "Agregar a favoritos"}
          aria-pressed={isFavorited}
          className="absolute right-2 top-2 z-20"
          onClick={handleFavClick}
        >
          <Heart className="h-4 w-4" fill={isFavorited ? "currentColor" : "none"} />
        </Button>
      )}
      {txLabel && (
        <Badge variant="secondary" className="absolute left-2 top-2 z-20">
          {txLabel}
        </Badge>
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
        {/* Overlay de legibilidad y precio destacado */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-background/10 to-transparent" />
        <div className="absolute right-2 top-2 z-20 rounded-md bg-primary/90 px-2.5 py-1.5 text-sm sm:text-base font-semibold text-primary-foreground shadow">
          {priceText}
        </div>
      </AspectRatio>
      <CardContent className="p-4">
        <h3 className="font-semibold line-clamp-1">{property.title}</h3>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <BedDouble className="h-4 w-4" aria-hidden="true" />
            {typeof br === "number" ? `${br} Hab.` : "—"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Bath className="h-4 w-4" aria-hidden="true" />
            {typeof ba === "number" ? `${ba} Baños` : "—"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Ruler className="h-4 w-4" aria-hidden="true" />
            {typeof ar === "number" ? `${ar} m²` : "—"}
          </span>
        </div>
        <div className="mt-4">
          <Button size="sm" className="w-full sm:w-auto" asChild>
            <span>Ver Detalles</span>
          </Button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">Match Score AURA — próximamente</div>
      </CardContent>
    </Card>
  </Link>
);
}
