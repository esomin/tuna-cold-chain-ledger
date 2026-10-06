import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Compass } from 'lucide-react';

interface LiveMapProps {
  lat: number;
  lng: number;
  poNumber?: string;
}

// Module-level in-memory cache for map style specification
let cachedStyleJson: maplibregl.StyleSpecification | null = null;
const MAP_STYLE_URL = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

export const LiveMaplibreMap: React.FC<LiveMapProps> = ({ lat, lng, poNumber }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;
    let isCancelled = false;

    const initMap = (style: maplibregl.StyleSpecification | string) => {
      if (isCancelled || !mapContainer.current) return;

      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: style,
        center: [lng, lat],
        zoom: 6.5,
        attributionControl: false
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

      // Create custom vehicle marker HTML element
      const markerEl = document.createElement('div');
      markerEl.className = 'relative flex items-center justify-center';
      markerEl.innerHTML = `
        <div class="absolute w-8 h-8 rounded-full animate-ping opacity-75" style="background-color: var(--theme-aqua, #5cd5fb)"></div>
        <div class="w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2" style="background-color: #ffffff; border-color: var(--theme-aqua, #5cd5fb); color: var(--theme-aqua, #5cd5fb)">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(
        `<div style="color: #18191a; font-size: 11px; font-weight: bold; padding: 2px 4px;">
          🚚 ${poNumber || 'PO 운송 차량'}
         </div>`
      );

      const marker = new maplibregl.Marker({ element: markerEl })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      map.on('load', () => {
        if (!isCancelled) {
          setIsMapReady(true);
        }
      });

      mapRef.current = map;
      markerRef.current = marker;
    };

    if (cachedStyleJson) {
      initMap(cachedStyleJson);
    } else {
      fetch(MAP_STYLE_URL)
        .then((res) => res.json())
        .then((data: maplibregl.StyleSpecification) => {
          cachedStyleJson = data;
          initMap(data);
        })
        .catch(() => {
          // Fallback to direct URL if fetch fails
          initMap(MAP_STYLE_URL);
        });
    }

    return () => {
      isCancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Smooth camera pan and marker position update on GPS coordinates change
  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
      mapRef.current.easeTo({
        center: [lng, lat],
        duration: 1000,
        zoom: 6.5
      });
    }
  }, [lat, lng]);

  return (
    <div className="w-full h-[380px] rounded-lg overflow-hidden relative bg-[#0b101b]">
      {/* Dark ocean placeholder skeleton while map tiles load */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center bg-[#0b101b] transition-opacity duration-500 z-10 pointer-events-none ${
          isMapReady ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border border-sky-500/20 bg-sky-500/5 flex items-center justify-center animate-pulse">
            <Compass className="w-6 h-6 text-sky-400 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
        </div>
        <span className="mt-3 text-xs font-mono text-slate-500 tracking-wider">
          INITIALIZING MAP SATELLITE...
        </span>
      </div>

      {/* MapLibre Canvas Container */}
      <div
        ref={mapContainer}
        className={`w-full h-[380px] transition-opacity duration-300 ${
          isMapReady ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
