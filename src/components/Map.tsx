import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapProps {
  token?: string;
  lng: number;
  lat: number;
  className?: string;
}

const Map: React.FC<MapProps> = ({ token, lng, lat, className }) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !token) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [lng, lat],
      zoom: 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");

    const marker = new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map.current);

    return () => {
      marker.remove();
      map.current?.remove();
    };
  }, [token, lng, lat]);

  if (!token) return null;

  return <div ref={mapContainer} className={className ?? "w-full h-80 rounded-lg overflow-hidden"} />;
};

export default Map;
