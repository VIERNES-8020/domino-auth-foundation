import React, { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export interface PropertiesMapMarker {
  id: string;
  lng: number;
  lat: number;
  title?: string;
  label?: string;
}

interface PropertiesMapProps {
  token: string;
  markers: PropertiesMapMarker[];
  className?: string;
  defaultCenter?: { lng: number; lat: number };
}

const DEFAULT_CENTER = { lng: -66.1568, lat: -17.3895 }; // Cochabamba

const PropertiesMap: React.FC<PropertiesMapProps> = ({ token, markers, className, defaultCenter }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerObjs = useRef<mapboxgl.Marker[]>([]);

  const center = useMemo(() => defaultCenter ?? DEFAULT_CENTER, [defaultCenter]);

  useEffect(() => {
    if (!containerRef.current || !token) return;
    mapboxgl.accessToken = token;

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [center.lng, center.lat],
      zoom: 11,
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");

    return () => {
      markerObjs.current.forEach((m) => m.remove());
      markerObjs.current = [];
      mapRef.current?.remove();
    };
  }, [token]);

  useEffect(() => {
    if (!mapRef.current) return;
    // Remove previous markers
    markerObjs.current.forEach((m) => m.remove());
    markerObjs.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasBounds = false;

    markers.forEach((mk) => {
      // Custom price label marker
      const el = document.createElement("div");
      el.className = "rounded-md bg-primary text-primary-foreground px-2 py-1 text-xs font-semibold shadow-md ring-1 ring-primary/30";
      el.textContent = mk.label ?? mk.title ?? "";

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" }).setLngLat([mk.lng, mk.lat]);

      // Click: scroll to property card
      el.addEventListener("click", () => {
        const target = document.querySelector(`#property-${mk.id}`) as HTMLElement | null;
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      marker.addTo(mapRef.current!);
      markerObjs.current.push(marker);
      bounds.extend([mk.lng, mk.lat]);
      hasBounds = true;
    });

    if (hasBounds) {
      mapRef.current.fitBounds(bounds, { padding: 40, maxZoom: 14, duration: 300 });
    } else {
      mapRef.current.easeTo({ center: [center.lng, center.lat], zoom: 11, duration: 300 });
    }
  }, [markers, center]);

  return <div ref={containerRef} className={className ?? "w-full h-72 rounded-md overflow-hidden"} />;
};

export default PropertiesMap;
