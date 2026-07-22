import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

interface LiveMapProps {
  lat: number;
  lng: number;
  poNumber?: string;
}

export const LiveMaplibreMap: React.FC<LiveMapProps> = ({ lat, lng, poNumber }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // CartoDB Dark Matter tile source with MapLibre GL
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto-dark': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap &copy; CARTO'
          }
        },
        layers: [
          {
            id: 'carto-dark-layer',
            type: 'raster',
            source: 'carto-dark',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [lng, lat],
      zoom: 6.5
    });

    // Add navigation control
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    // Create custom vehicle marker HTML element
    const markerEl = document.createElement('div');
    markerEl.className = 'relative flex items-center justify-center';
    markerEl.innerHTML = `
      <div class="absolute w-8 h-8 rounded-full animate-ping opacity-75" style="background-color: var(--theme-aqua, #5cd5fb)"></div>
      <div class="w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2" style="background-color: #18191a; border-color: var(--theme-aqua, #5cd5fb); color: var(--theme-aqua, #5cd5fb)">
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

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
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
    <div className="w-full h-[380px] rounded-lg overflow-hidden relative">
      <div ref={mapContainer} className="w-full h-[380px]" />
    </div>
  );
};
