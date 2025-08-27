import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";

interface MapPickerProps {
  lat?: number | null;
  lng?: number | null;
  onChange?: (coords: { lat: number; lng: number }) => void;
  className?: string;
  centerLat?: number;
  centerLng?: number;
}

const MapPicker: React.FC<MapPickerProps> = ({ lat, lng, onChange, className, centerLat, centerLng }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("mapbox-public-token");
        if (error) throw error;
        const t = (data as any)?.token as string | undefined;
        if (!t) throw new Error("Falta MAPBOX_PUBLIC_TOKEN");
        if (!cancelled) setToken(t);
      } catch (e: any) {
        console.error("No se pudo obtener el token de Mapbox", e);
        setError("No se pudo cargar el mapa. Configura MAPBOX_PUBLIC_TOKEN.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !token) return;
    mapboxgl.accessToken = token;

    const center: [number, number] = [
      typeof centerLng === "number" ? centerLng : typeof lng === "number" ? lng : -66.1568,
      typeof centerLat === "number" ? centerLat : typeof lat === "number" ? lat : -17.3895,
    ]; // Usa centerLat/centerLng si están disponibles, sino las coordenadas del marcador, sino Cochabamba por defecto

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center,
      zoom: 12,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");

    // Si ya hay coords, colocar un marcador inicial
    if (typeof lat === "number" && typeof lng === "number") {
      markerRef.current = new mapboxgl.Marker({ draggable: true })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
      markerRef.current.on("dragend", () => {
        const pos = markerRef.current!.getLngLat();
        onChange?.({ lat: pos.lat, lng: pos.lng });
      });
    }

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const { lngLat } = e;
      if (!markerRef.current) {
        markerRef.current = new mapboxgl.Marker({ draggable: true })
          .setLngLat(lngLat)
          .addTo(mapRef.current!);
        markerRef.current.on("dragend", () => {
          const pos = markerRef.current!.getLngLat();
          onChange?.({ lat: pos.lat, lng: pos.lng });
        });
      } else {
        markerRef.current.setLngLat(lngLat);
      }
      onChange?.({ lat: lngLat.lat, lng: lngLat.lng });
    };

    mapRef.current.on("click", handleClick);

    return () => {
      mapRef.current?.off("click", handleClick);
      markerRef.current?.remove();
      mapRef.current?.remove();
    };
  }, [token, centerLat, centerLng]);

  if (error) {
    return (
      <div className={className ?? "w-full h-56 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground"}>
        {error}
      </div>
    );
  }

  if (!token) {
    return (
      <div className={className ?? "w-full h-56 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground"}>
        Cargando mapa…
      </div>
    );
  }

  return <div ref={containerRef} className={className ?? "w-full h-56 rounded-md overflow-hidden"} />;
};

export default MapPicker;
