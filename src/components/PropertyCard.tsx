import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

export interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    price?: number | null;
    image_urls?: string[] | null;
  };
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const cover = property.image_urls?.[0] || "/default-placeholder.jpg";
  const priceText =
    typeof property.price === "number"
      ? `$${property.price.toLocaleString()}`
      : "Precio a consultar";

  return (
    <Link to={`/properties/${property.id}`} aria-label={`Ver ${property.title}`} className="block">
      <Card key={property.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <AspectRatio ratio={16 / 9}>
          <img
            src={cover}
            alt={`Propiedad: ${property.title} — Inmobiliaria DOMIN10`}
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
