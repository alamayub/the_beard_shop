import { useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
} from '@vis.gl/react-google-maps';
import { ExternalLink, MapPin } from 'lucide-react';

interface SalonLocationMapProps {
  businessName: string;
  address: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  heightClass?: string;
}

export function SalonLocationMap({
  businessName,
  address,
  latitude,
  longitude,
  googleMapsUrl,
  heightClass = 'h-[380px]',
}: SalonLocationMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const [infoOpen, setInfoOpen] = useState(true);
  const position = { lat: latitude || 27.014045, lng: longitude || 84.8482375 };

  if (!apiKey) {
    return (
      <div
        className={`relative flex ${heightClass} w-full flex-col items-center justify-center rounded-md border border-[#E3DDD2] bg-[#E9DFD0]/50 p-8 text-center`}
      >
        <MapPin className="h-8 w-8 text-[#A5844A] mb-3" />
        <h3 className="font-serif text-2xl text-[#111111] mb-1">{businessName}</h3>
        <p className="text-sm text-[#5C5852] max-w-md mb-5">{address}</p>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-[#111111] px-5 py-2.5 text-sm font-medium text-[#FAF8F4] hover:bg-[#2A2826] transition-colors whitespace-nowrap"
        >
          Open in Google Maps <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-md border border-[#E3DDD2]">
      <div className={`${heightClass} w-full`}>
        <APIProvider apiKey={apiKey} language="en" region="NP">
          <GoogleMap
            defaultCenter={position}
            defaultZoom={15}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            gestureHandling="cooperative"
            style={{ width: '100%', height: '100%' }}
          >
            <AdvancedMarker
              position={position}
              title={businessName}
              onClick={() => setInfoOpen(true)}
            >
              <Pin background="#111111" borderColor="#C6A66B" glyphColor="#C6A66B" />
            </AdvancedMarker>

            {infoOpen && (
              <InfoWindow position={position} onCloseClick={() => setInfoOpen(false)}>
                <div className="p-1 max-w-[220px]">
                  <p className="font-serif text-base font-semibold text-[#111111]">
                    {businessName}
                  </p>
                  <p className="text-xs text-[#5C5852] mt-0.5">{address}</p>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-[#8C6D36] hover:underline"
                  >
                    Get Directions <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </APIProvider>
      </div>
    </div>
  );
}
