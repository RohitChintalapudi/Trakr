import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertCircle } from 'lucide-react';

// Fix Leaflet's default icon path issues with Vite/bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom icon for normal check-ins (blue)
const normalIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:14px;height:14px;border-radius:50%;
    background:#3b82f6;border:2px solid white;
    box-shadow:0 2px 6px rgba(59,130,246,0.6);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -8],
});

// Custom icon for anomaly check-ins (red pulsing ring)
const anomalyIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:18px;height:18px;">
    <div style="
      position:absolute;inset:0;border-radius:50%;
      background:#ef4444;opacity:0.3;
      animation:ping 1.4s cubic-bezier(0,0,.2,1) infinite;
    "></div>
    <div style="
      position:absolute;inset:2px;border-radius:50%;
      background:#ef4444;border:2px solid white;
      box-shadow:0 2px 6px rgba(239,68,68,0.7);
    "></div>
  </div>
  <style>@keyframes ping{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.2);opacity:0}}</style>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -10],
});

// Auto-fit map bounds to all check-in markers
const AutoFitBounds = ({ checkIns }) => {
  const map = useMap();
  useEffect(() => {
    if (!checkIns || checkIns.length === 0) return;
    const coords = checkIns
      .filter(c => c.location?.coordinates?.length === 2)
      .map(c => [c.location.coordinates[1], c.location.coordinates[0]]);
    if (coords.length > 0) {
      map.fitBounds(coords, { padding: [40, 40], maxZoom: 14 });
    }
  }, [checkIns, map]);
  return null;
};

const LiveMap = ({ checkIns = [] }) => {
  const [selectedPin, setSelectedPin] = useState(null);

  // Default center: Central Delhi
  const defaultCenter = [28.6139, 77.2090];

  const validCheckIns = checkIns.filter(
    c => c.location?.coordinates?.length === 2
  );

  // Group and offset overlapping check-in coordinates (spiderfy style)
  const coordCounts = {};
  validCheckIns.forEach(c => {
    const [lon, lat] = c.location.coordinates;
    const key = `${lat.toFixed(5)}_${lon.toFixed(5)}`;
    coordCounts[key] = (coordCounts[key] || 0) + 1;
  });

  const coordIndices = {};
  const displayCheckIns = validCheckIns.map(c => {
    const [lon, lat] = c.location.coordinates;
    const key = `${lat.toFixed(5)}_${lon.toFixed(5)}`;
    const count = coordCounts[key];

    let offsetLat = lat;
    let offsetLon = lon;

    if (count > 1) {
      const index = coordIndices[key] || 0;
      coordIndices[key] = index + 1;

      // Spread markers by ~25 meters radially
      const radius = 0.00022;
      const angle = (2 * Math.PI * index) / count;

      offsetLat = lat + radius * Math.sin(angle);
      const latRad = (lat * Math.PI) / 180;
      offsetLon = lon + (radius * Math.cos(angle)) / Math.max(0.1, Math.cos(latRad));
    }

    return {
      ...c,
      displayCoordinates: [offsetLon, offsetLat]
    };
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full min-h-[480px]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 flex-shrink-0">
        <div>
          <h3 className="font-bold text-slate-200 text-sm">Live Activity Map</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Real-time field check-ins via OpenStreetMap · {displayCheckIns.length} pins loaded
          </p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-semibold text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
            <span>Check-in</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block animate-pulse"></span>
            <span>Anomaly</span>
          </div>
        </div>
      </div>

      {/* Map container */}
      <div className="flex-1 relative" style={{ minHeight: 400 }}>
        <MapContainer
          center={defaultCenter}
          zoom={11}
          style={{ width: '100%', height: '100%', minHeight: 400 }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <AutoFitBounds checkIns={displayCheckIns} />

          {displayCheckIns.map((pin, idx) => {
            const [lon, lat] = pin.displayCoordinates;
            const salesperson = pin.salespersonId?.name
              || pin.salespersonId
              || 'Salesperson';

            // Photo: prefer base64 from mobile, fall back to imageUrl
            const photoSrc = pin.imageBase64
              ? `data:image/png;base64,${pin.imageBase64}`
              : pin.imageUrl || null;

            // Generate premium dynamic map pin containing the actual captured image thumbnail
            const markerHtml = photoSrc
              ? `<div style="
                  position: relative;
                  width: 38px; height: 38px; border-radius: 50%;
                  border: 2px solid ${pin.isAnomaly ? '#ef4444' : '#3b82f6'};
                  box-shadow: 0 3px 8px rgba(0,0,0,0.5);
                  overflow: hidden; background: #0f172a;
                  display: flex; align-items: center; justify-content: center;
                ">
                  <img src="${photoSrc}" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
                ${pin.isAnomaly ? `
                <div style="
                  position: absolute; top: -1px; right: -1px;
                  width: 11px; height: 11px; border-radius: 50%;
                  background: #ef4444; border: 1.5px solid white;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                "></div>` : ''}`
              : `<div style="
                  position: relative;
                  width: 16px; height: 16px; border-radius: 50%;
                  background: ${pin.isAnomaly ? '#ef4444' : '#3b82f6'};
                  border: 2px solid white;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                "></div>`;

            const customIcon = L.divIcon({
              className: '',
              html: markerHtml,
              iconSize: photoSrc ? [38, 38] : [16, 16],
              iconAnchor: photoSrc ? [19, 19] : [8, 8],
              popupAnchor: photoSrc ? [0, -20] : [0, -8],
            });

            return (
              <Marker
                key={pin._id || idx}
                position={[lat, lon]}
                icon={customIcon}
              >
                <Popup
                  minWidth={220}
                  maxWidth={280}
                  className="leaflet-popup-dark"
                >
                  <div style={{
                    background: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: 10,
                    padding: 12,
                    color: '#e2e8f0',
                    fontFamily: 'system-ui, sans-serif',
                    minWidth: 200,
                  }}>
                    {/* Photo */}
                    {photoSrc ? (
                      <img
                        src={photoSrc}
                        alt={pin.shopName}
                        style={{
                          width: '100%',
                          height: 110,
                          objectFit: 'cover',
                          borderRadius: 6,
                          marginBottom: 8,
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: 70, background: '#1e293b',
                        borderRadius: 6, marginBottom: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, color: '#475569',
                      }}>
                        No photo captured
                      </div>
                    )}

                    {/* Shop name + anomaly badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{pin.shopName}</span>
                      {pin.isAnomaly && (
                        <span style={{
                          padding: '1px 6px', background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.3)', borderRadius: 999,
                          fontSize: 9, color: '#f87171', fontWeight: 700,
                        }}>
                          ⚠ ANOMALY
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: 10, color: '#94a3b8', margin: '2px 0' }}>
                      By: <strong style={{ color: '#cbd5e1' }}>{salesperson}</strong>
                    </p>

                    {pin.summary || pin.notes ? (
                      <p style={{
                        fontSize: 10, color: '#64748b',
                        marginTop: 6, lineHeight: 1.4,
                        borderTop: '1px solid #1e293b', paddingTop: 6,
                      }}>
                        "{pin.summary || pin.notes}"
                      </p>
                    ) : null}

                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      marginTop: 8, fontSize: 9, color: '#475569',
                    }}>
                      <span>{new Date(pin.timestamp).toLocaleString([], {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}</span>
                      {pin.isAnomaly && (
                        <span style={{ color: '#f87171', fontWeight: 700 }}>
                          +{pin.distance}m deviation
                        </span>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {validCheckIns.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
            <div className="bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl px-8 py-6 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={20} className="text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-300">No check-ins to display</p>
              <p className="text-xs text-slate-500 mt-1">Pins will appear here as field visits are submitted</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveMap;
