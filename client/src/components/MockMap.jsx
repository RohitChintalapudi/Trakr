import React, { useState } from 'react';
import { MapPin, AlertCircle, ShoppingBag } from 'lucide-react';

const SHOP_TARGETS = [
  { name: 'Reliance Fresh', coords: [77.2090, 28.6139], locationName: 'Connaught Place' },
  { name: 'Horlicks Outlet', coords: [77.2070, 28.6150], locationName: 'Janpath' },
  { name: 'Walmart Supercenter', coords: [77.2150, 28.6110], locationName: 'Barakhamba' },
  { name: 'EasyDay Store', coords: [77.2010, 28.6190], locationName: 'Gole Market' }
];

const MockMap = ({ checkIns = [] }) => {
  const [selectedPin, setSelectedPin] = useState(null);

  // Delhi boundary mapping coordinates for mapping to SVG space
  const minLon = 77.18;
  const maxLon = 77.25;
  const minLat = 28.58;
  const maxLat = 28.65;

  const getXY = (lon, lat) => {
    let x = ((lon - minLon) / (maxLon - minLon)) * 100;
    let y = 100 - ((lat - minLat) / (maxLat - minLat)) * 100;

    // Clamp coordinates safely within layout percentages
    x = Math.max(8, Math.min(92, x));
    y = Math.max(8, Math.min(92, y));

    return { x, y };
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative flex flex-col h-full min-h-[480px]">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="font-bold text-slate-200">Global Activity Monitor</h3>
          <p className="text-xs text-slate-500">Live plotting of shop check-ins in Central Delhi (Grid: 10km x 10km)</p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-semibold text-slate-400">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
            <span>Check-in</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block animate-pulse"></span>
            <span>Anomaly Alert</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-slate-700 border border-dashed border-slate-500 inline-block"></span>
            <span>Target Shop</span>
          </div>
        </div>
      </div>

      {/* SVG Map Layout */}
      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg relative overflow-hidden flex items-center justify-center">
        {/* Background Grid Lines representing Coordinate system */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
        
        {/* Mock Map Topology Elements */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* Mock Roads/Paths */}
          <path d="M 0,20 Q 200,80 400,200 T 800,250" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" />
          <path d="M 100,0 Q 150,300 200,800" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" />
          <path d="M 600,0 C 500,250 400,450 350,800" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" />

          {/* Territory Rings */}
          <circle cx="50%" cy="50%" r="180" fill="none" stroke="#1e293b" strokeWidth="1" opacity="0.5" />
          <circle cx="50%" cy="50%" r="80" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          <text x="50%" y="15%" fill="#475569" fontSize="10" textAnchor="middle" letterSpacing="2">NORTH ZONE</text>
          <text x="50%" y="88%" fill="#475569" fontSize="10" textAnchor="middle" letterSpacing="2">SOUTH ZONE</text>

          {/* Draw Anomaly lines (connecting check-in to target) */}
          {checkIns.map((pin, idx) => {
            if (!pin.isAnomaly) return null;
            const shopTarget = SHOP_TARGETS.find(t => t.name === pin.shopName);
            if (!shopTarget) return null;

            const checkInXY = getXY(pin.location.coordinates[0], pin.location.coordinates[1]);
            const targetXY = getXY(shopTarget.coords[0], shopTarget.coords[1]);

            return (
              <line
                key={`line-${idx}`}
                x1={`${checkInXY.x}%`}
                y1={`${checkInXY.y}%`}
                x2={`${targetXY.x}%`}
                y2={`${targetXY.y}%`}
                stroke="#ef4444"
                strokeWidth="1"
                strokeDasharray="4 4"
                className="animate-pulse"
              />
            );
          })}
        </svg>

        {/* Plot Static Target Shop positions */}
        {SHOP_TARGETS.map((shop, idx) => {
          const { x, y } = getXY(shop.coords[0], shop.coords[1]);
          return (
            <div
              key={`target-${idx}`}
              className="absolute group z-10"
              style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div className="w-5 h-5 rounded border border-dashed border-slate-500 bg-slate-900/80 flex items-center justify-center cursor-help">
                <ShoppingBag size={10} className="text-slate-400" />
              </div>
              
              {/* Tooltip */}
              <div className="absolute left-1/2 bottom-6 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-[9px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                {shop.name} ({shop.locationName})
              </div>
            </div>
          );
        })}

        {/* Plot Active Checkin Pins */}
        {checkIns.map((pin, idx) => {
          const coords = pin.location?.coordinates;
          if (!coords || coords.length !== 2) return null;

          const { x, y } = getXY(coords[0], coords[1]);
          const isSelected = selectedPin?._id === pin._id;

          return (
            <div
              key={`pin-${pin._id || idx}`}
              className="absolute z-20"
              style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <button
                onClick={() => setSelectedPin(isSelected ? null : pin)}
                className={`relative flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-125 focus:outline-none`}
              >
                {pin.isAnomaly ? (
                  <>
                    <span className="absolute w-6 h-6 rounded-full bg-red-500/30 animate-ping"></span>
                    <div className="w-3.5 h-3.5 rounded-full bg-red-500 border border-white flex items-center justify-center text-[7px] font-bold text-white shadow-lg">
                      !
                    </div>
                  </>
                ) : (
                  <>
                    <span className="absolute w-6 h-6 rounded-full bg-blue-500/30 animate-ping"></span>
                    <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border border-white flex items-center justify-center text-[7px] font-bold text-white shadow-lg">
                      ✓
                    </div>
                  </>
                )}
              </button>
            </div>
          );
        })}

        {/* Pin Details Drawer / Tooltip overlay */}
        {selectedPin && (
          <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 border border-slate-800 rounded-lg p-4 shadow-xl z-30 flex items-start justify-between backdrop-blur-sm">
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded bg-slate-800 overflow-hidden border border-slate-700 flex-shrink-0">
                <img src={selectedPin.imageUrl} alt={selectedPin.shopName} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  {selectedPin.shopName}
                  {selectedPin.isAnomaly && (
                    <span className="px-1.5 py-0.5 text-[8px] bg-red-500/10 text-red-400 rounded-full border border-red-500/20 font-bold flex items-center gap-0.5">
                      <AlertCircle size={8} /> Anomaly
                    </span>
                  )}
                </h4>
                <p className="text-[10px] text-slate-400 truncate">
                  Checked in by: <span className="font-semibold text-slate-300">{selectedPin.salespersonId?.name || 'Salesperson'}</span>
                </p>
                <p className="text-[10px] text-slate-500 leading-tight mt-1 truncate">
                  "{selectedPin.summary}"
                </p>
              </div>
            </div>

            <div className="text-right flex flex-col justify-between items-end h-full">
              <button 
                onClick={() => setSelectedPin(null)} 
                className="text-slate-500 hover:text-slate-300 text-[10px] font-bold mb-2"
              >
                Close
              </button>
              <div className="text-[9px] text-slate-500 font-semibold">
                {new Date(selectedPin.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {selectedPin.isAnomaly && (
                  <span className="block text-red-400 font-bold">+{selectedPin.distance}m deviation</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MockMap;
