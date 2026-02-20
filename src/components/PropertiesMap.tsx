import React, { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export interface PropertiesMapMarker {
  id: string;
  lng: number;
  lat: number;
  title?: string;
  label?: string;
  propertyType?: string;
}

interface PropertiesMapProps {
  token: string;
  markers: PropertiesMapMarker[];
  className?: string;
  defaultCenter?: { lng: number; lat: number };
}

const DEFAULT_CENTER = { lng: -66.1568, lat: -17.3895 }; // Cochabamba

/** SVG icon based on property type */
function getPropertyIcon(type?: string): string {
  const isDept = type === "departamento" || type === "oficina";
  if (isDept) {
    // Building icon
    return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`;
  }
  // House icon (default)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`;
}

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
      // Custom marker element with icon + price label
      const el = document.createElement("div");
      el.style.display = "flex";
      el.style.flexDirection = "column";
      el.style.alignItems = "center";
      el.style.cursor = "pointer";

      // Icon circle
      const iconCircle = document.createElement("div");
      iconCircle.style.cssText = "width:36px;height:36px;border-radius:50%;background:hsl(var(--primary));display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;";
      iconCircle.innerHTML = getPropertyIcon(mk.propertyType);
      el.appendChild(iconCircle);

      // Price label below
      if (mk.label) {
        const labelEl = document.createElement("div");
        labelEl.style.cssText = "margin-top:2px;background:hsl(var(--primary));color:white;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:600;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.2);";
        labelEl.textContent = mk.label;
        el.appendChild(labelEl);
      }

      // Arrow/triangle
      const arrow = document.createElement("div");
      arrow.style.cssText = "width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid hsl(var(--primary));";
      el.appendChild(arrow);

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" }).setLngLat([mk.lng, mk.lat]);

      // Click: navigate to property detail
      el.addEventListener("click", () => {
        window.location.href = `/propiedad/${mk.id}`;
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
