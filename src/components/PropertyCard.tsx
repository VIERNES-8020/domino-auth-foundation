import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent } from "@/components/ui/card";

export interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    price?: number | null;
    image_urls?: string[] | null;
  };
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const cover = property.image_urls?.[0] || "/placeholder.svg";
  const priceText =
    typeof property.price === "number"
      ? `$${property.price.toLocaleString()}`
      : "Precio a consultar";

  return (
    <Card key={property.id} className="overflow-hidden shadow-sm">
      <AspectRatio ratio={16 / 9}>
        <img
          src={cover}
          alt={`Propiedad: ${property.title} — Inmobiliaria DOMIN10`}
          className="h-full w-full object-cover"
          loading="lazy"
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
  );
}
