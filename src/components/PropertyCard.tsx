import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, BedDouble, Bath, Ruler, Star } from "lucide-react";
import { Link } from "react-router-dom";
import WatermarkedImage from "@/components/WatermarkedImage";
import { useLanguage } from "@/contexts/LanguageContext";

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
    constructed_area_m2?: number | null;
    transaction_type?: string | null;
    concluded_status?: string | null;
    property_code?: string | null;
  };
  isFavorited?: boolean;
  onToggleFavorite?: (id: string, next: boolean) => void;
  showConcludedBadge?: boolean;
  rating?: number; // Rating from 1-5 stars
  reviewCount?: number; // Number of reviews
}

function formatPrice(price?: number | null, currency?: string | null, t?: (key: string) => string) {
  if (typeof price !== "number") return t ? t('property.priceConsult') : "Precio a consultar";
  const cur = (currency || "USD").toUpperCase();
  const symbol = cur === "BOB" ? "Bs." : "$us.";
  return `${symbol} ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PropertyCard({ property, isFavorited = false, onToggleFavorite, showConcludedBadge = false, rating = 4.2, reviewCount = Math.floor(Math.random() * 50) + 5 }: PropertyCardProps) {
  const { t } = useLanguage();
  
  // Fix image display: check if image_urls array exists and has valid URL
  const hasValidImage = property.image_urls && 
    Array.isArray(property.image_urls) && 
    property.image_urls.length > 0 && 
    property.image_urls[0] && 
    typeof property.image_urls[0] === 'string' &&
    property.image_urls[0].trim() !== '' &&
    !property.image_urls[0].includes('google.com/search'); // Filter out invalid URLs
  
  const cover = hasValidImage ? property.image_urls[0] : "/default-placeholder.jpg";
  const priceText = formatPrice(property.price, property.price_currency, t);
  const br = typeof property.bedrooms === "number" ? property.bedrooms : undefined;
  const ba = typeof property.bathrooms === "number" ? property.bathrooms : undefined;
  const ar = typeof property.area_m2 === "number" ? property.area_m2 : undefined;
  const car = typeof property.constructed_area_m2 === "number" ? property.constructed_area_m2 : undefined;
  const txLabel = property.transaction_type === "rent"
    ? t('property.rent')
    : property.transaction_type === "anticretico"
    ? t('properties.anticretico')
    : property.transaction_type === "sale"
    ? t('property.sale')
    : undefined;

  const handleFavClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.(property.id, !isFavorited);
  };

  return (
    <Link id={`property-${property.id}`} to={`/propiedad/${property.id}`} aria-label={`${t('property.view')} ${property.title}`} className="block">
      <Card key={property.id} className="relative overflow-hidden group shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 bg-gradient-to-br from-card to-card/80 rounded-xl border-0 h-full">
        {onToggleFavorite && (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label={isFavorited ? t('card.removeFavorites') : t('card.addFavorites')}
            aria-pressed={isFavorited}
            className="absolute right-2 top-2 z-20 bg-background/90 backdrop-blur-sm hover:bg-background hover:scale-110 transition-all duration-200 w-8 h-8 sm:w-10 sm:h-10"
            onClick={handleFavClick}
          >
            <Heart className="h-3 w-3 sm:h-4 sm:w-4" fill={isFavorited ? "currentColor" : "none"} />
          </Button>
        )}
        {txLabel && (
          <Badge variant="secondary" className="absolute left-2 top-2 z-20 bg-primary text-primary-foreground text-xs px-2 py-1">
            {txLabel}
          </Badge>
        )}
        <AspectRatio ratio={16 / 9} className="rounded-t-xl overflow-hidden">
          <WatermarkedImage
            src={cover}
            alt={`${t('properties.propertyType')}: ${property.title} — Inmobiliaria DOMINIO`}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {/* Overlay de legibilidad y precio destacado */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-background/10 to-transparent" />
          
          {/* Concluded status badge overlay */}
          {showConcludedBadge && property.concluded_status && (
            <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center z-10">
              <div className="bg-orange-500/90 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-md font-bold text-sm sm:text-lg uppercase tracking-wide shadow-lg">
                {property.concluded_status === 'vendido' && t('property.sold').replace(' ✓', '')}
                {property.concluded_status === 'alquilado' && t('property.rented').replace(' ✓', '')}
                {property.concluded_status === 'anticretico' && t('property.anticretico').replace(' ✓', '')}
              </div>
            </div>
          )}
          
          <div className="absolute right-2 top-2 z-20 rounded-md bg-primary/90 px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow">
            {priceText}
          </div>
        </AspectRatio>
        <CardContent className="p-3 sm:p-4 flex flex-col flex-1">
          <h3 className="font-semibold line-clamp-2 text-sm sm:text-base mb-2">{property.title}</h3>
          {property.property_code && (
            <div className="mb-2">
              <Badge variant="outline" className="text-xs font-mono bg-primary/5 border-primary/20 text-primary">
                ID: {property.property_code}
              </Badge>
            </div>
          )}
          <div className="flex flex-col gap-2 text-xs sm:text-sm text-muted-foreground mb-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1">
                <BedDouble className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                {typeof br === "number" ? `${br} ${t('card.bedrooms')}` : "—"}
              </span>
              <span className="inline-flex items-center gap-1">
                <Bath className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                {typeof ba === "number" ? `${ba} ${t('card.bathrooms')}` : "—"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Ruler className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
              <span className="flex-1">
                {typeof ar === "number" ? `${ar} ${t('property.area')}` : "—"}
                {typeof car === "number" && ` (${car} ${t('card.constructed')})` }
              </span>
            </div>
          </div>
          {/* Rating Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 sm:h-4 sm:w-4 ${
                      star <= Math.floor(rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : star <= rating
                        ? "fill-yellow-400/50 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                {rating.toFixed(1)} ({reviewCount})
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              AURA: <span className="font-semibold text-primary">{75 + (br || 0) * 5 + (ba || 0) * 3}%</span>
            </span>
          </div>
          
          <div className="mt-auto">
            <Button size="sm" className="w-full group-hover:bg-primary/90 transition-colors text-xs sm:text-sm py-2" asChild>
              <span>{t('property.viewDetails')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
