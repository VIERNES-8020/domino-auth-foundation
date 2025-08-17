import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { X, MapPin, Bed, Bath, Ruler } from "lucide-react";

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  price_currency: string;
  property_type: string;
  bedrooms?: number;
  bathrooms?: number;
  area_m2?: number;
  constructed_area_m2?: number;
  address: string;
  image_urls?: string[];
  tags?: string[];
}

interface PropertyViewModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PropertyViewModal({ property, isOpen, onClose }: PropertyViewModalProps) {
  if (!property) return null;

  const images = property.image_urls || ['/default-placeholder.jpg'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex-1">
            <DialogTitle className="text-xl font-bold text-primary">{property.title}</DialogTitle>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <MapPin className="h-4 w-4" />
              {property.address}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Images Carousel */}
          <div className="relative">
            <Carousel className="w-full">
              <CarouselContent>
                {images.map((url, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-video overflow-hidden rounded-lg">
                      <img
                        src={url}
                        alt={`${property.title} - imagen ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-placeholder.jpg';
                        }}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {images.length > 1 && (
                <>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </>
              )}
            </Carousel>
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Información General</h3>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-primary">
                    ${property.price?.toLocaleString()} {property.price_currency || 'USD'}
                  </p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{property.address}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                {property.bedrooms && (
                  <div className="flex items-center gap-1">
                    <Bed className="h-4 w-4" />
                    <span>{property.bedrooms} dorm.</span>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex items-center gap-1">
                    <Bath className="h-4 w-4" />
                    <span>{property.bathrooms} baños</span>
                  </div>
                )}
                {property.area_m2 && (
                  <div className="flex items-center gap-1">
                    <Ruler className="h-4 w-4" />
                    <span>{property.area_m2} m²</span>
                  </div>
                )}
              </div>

              {property.constructed_area_m2 && (
                <p className="text-sm text-muted-foreground">
                  Área construida: {property.constructed_area_m2} m²
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Descripción</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {property.description || "Sin descripción disponible."}
                </p>
              </div>

              {property.tags && property.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Características</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center pt-4 border-t">
            <Button onClick={onClose} className="w-full md:w-auto">
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}