import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Play, Coffee, Pause, Upload, Compass, Navigation } from 'lucide-react';

const SalespersonDashboard = () => {
  const [status, setStatus] = useState('Active');
  const [reason, setReason] = useState('');
  const [showReasonSelect, setShowReasonSelect] = useState(false);
  const [myCheckIns, setMyCheckIns] = useState([]);
  
  // Check-In Form State
  const [shopName, setShopName] = useState('');
  const [summary, setSummary] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [mockImgUrl, setMockImgUrl] = useState('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80');
  
  // Coordinate Presets (For testing normal vs anomaly check-ins easily)
  // Target coordinates for Reliance Fresh are: [77.2090, 28.6139]
  const [coordType, setCoordType] = useState('Normal'); 
  const [coordinates, setCoordinates] = useState([77.2092, 28.6141]); // ~25m away (normal)

  const [formMsg, setFormMsg] = useState({ text: '', isError: false });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchSalespersonData = async () => {
    try {
      setLoading(true);
      const attRes = await api.get('/attendance/current');
      setStatus(attRes.data.status);
      setReason(attRes.data.reason || '');

      const checkinRes = await api.get('/checkin/my-today');
      setMyCheckIns(checkinRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalespersonData();
  }, []);

  const handleStatusChange = async (newStatus, holdReason = '') => {
    try {
      setStatus(newStatus);
      if (newStatus !== 'Hold') {
        setReason('');
        setShowReasonSelect(false);
      }
      
      await api.post('/attendance', {
        status: newStatus,
        reason: holdReason
      });
      fetchSalespersonData();
    } catch (err) {
      console.error('Failed to update attendance status:', err);
    }
  };

  const handleHoldClick = () => {
    setShowReasonSelect(true);
  };

  const handleHoldConfirm = (e) => {
    const selectedReason = e.target.value;
    if (selectedReason) {
      setReason(selectedReason);
      handleStatusChange('Hold', selectedReason);
    }
  };

  const handleCoordPresetChange = (preset) => {
    setCoordType(preset);
    if (preset === 'Normal') {
      setCoordinates([77.2092, 28.6141]); // 25 meters (normal)
    } else {
      setCoordinates([77.2200, 28.6250]); // 1.7 km away (anomaly)
    }
  };

  // HTML5 Browser Geolocation capture
  const fetchLiveBrowserGPS = () => {
    if (!navigator.geolocation) {
      setFormMsg({ text: 'Browser Geolocation is not supported by your browser.', isError: true });
      return;
    }

    setFormMsg({ text: 'Fetching GPS coordinates...', isError: false });
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lon = position.coords.longitude;
        const lat = position.coords.latitude;
        setCoordinates([lon, lat]);
        setCoordType('Live Browser GPS');
        setFormMsg({ text: `GPS coordinates captured successfully: [${lon.toFixed(5)}, ${lat.toFixed(5)}]`, isError: false });
      },
      (error) => {
        console.error(error);
        setFormMsg({ text: 'GPS Access Denied. Falling back to preset Delhi CP coordinates.', isError: true });
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setMockImgUrl('https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=300&q=80');
    }
  };

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!shopName || !summary) {
      setFormMsg({ text: 'All fields are required.', isError: true });
      return;
    }

    try {
      setSubmitting(true);
      setFormMsg({ text: '', isError: false });

      const formData = new FormData();
      formData.append('shopName', shopName);
      formData.append('summary', summary);
      formData.append('coordinates', JSON.stringify(coordinates));

      if (imageFile) {
        formData.append('image', imageFile);
      } else {
        formData.append('imageUrl', mockImgUrl);
      }

      await api.post('/checkin', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setFormMsg({ text: 'Check-in submitted successfully!', isError: false });
      setSummary('');
      setImageFile(null);
      
      const checkinRes = await api.get('/checkin/my-today');
      setMyCheckIns(checkinRes.data);
    } catch (err) {
      console.error(err);
      setFormMsg({ text: err.response?.data?.message || 'Check-in submission failed.', isError: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const targetGoal = 5;
  const completedToday = myCheckIns.length;
  const percentage = Math.min(100, Math.round((completedToday / targetGoal) * 100));
  
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const isInterlocked = status === 'Break' || status === 'Hold' || status === 'Offline';

  return (
    <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col min-h-[640px] animate-fade-in">
      
      {/* PERSISTENT TOP ATTENDANCE TOGGLE BAR */}
      <div className="bg-slate-950 border-b border-slate-850 p-4 sticky top-0 z-20 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-bold uppercase tracking-wider">Attendance Status</span>
          <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
            status === 'Active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
            status === 'Break' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
            'bg-amber-500/10 text-amber-500 border border-amber-500/20'
          }`}>
            {status} {status === 'Hold' && reason ? `(${reason})` : ''}
          </span>
        </div>

        {/* Status Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleStatusChange('Active')}
            className={`flex flex-col items-center justify-center py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              status === 'Active'
                ? 'bg-green-600 text-white border-green-500 shadow-lg shadow-green-600/10 scale-[1.02]'
                : 'bg-slate-900 text-slate-400 border-slate-850 hover:bg-slate-800'
            }`}
          >
            <Play size={16} className="mb-1" />
            Active
          </button>
          
          <button
            onClick={() => handleStatusChange('Break')}
            className={`flex flex-col items-center justify-center py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              status === 'Break'
                ? 'bg-yellow-600 text-white border-yellow-500 shadow-lg shadow-yellow-600/10 scale-[1.02]'
                : 'bg-slate-900 text-slate-400 border-slate-850 hover:bg-slate-800'
            }`}
          >
            <Coffee size={16} className="mb-1" />
            Break
          </button>

          <button
            onClick={handleHoldClick}
            className={`flex flex-col items-center justify-center py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              status === 'Hold'
                ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/10 scale-[1.02]'
                : 'bg-slate-900 text-slate-400 border-slate-850 hover:bg-slate-800'
            }`}
          >
            <Pause size={16} className="mb-1" />
            Hold
          </button>
        </div>

        {/* Hold Reason Dropdown */}
        {showReasonSelect && (
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 animate-slide-down">
            <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Specify Hold Reason</label>
            <select
              onChange={handleHoldConfirm}
              defaultValue=""
              className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="" disabled>Select reason...</option>
              <option value="Vehicle Breakdown">Vehicle Breakdown</option>
              <option value="Traffic Delay">Traffic Delay</option>
              <option value="Client Unavailable">Client Unavailable</option>
              <option value="Lunch / Rest">Lunch / Rest</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Body */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        
        {/* Metric Tracker */}
        <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-200">Daily Metric Tracker</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Visits completed today against required quota.</p>
            <div className="text-lg font-black text-slate-100 mt-2">
              {completedToday} <span className="text-xs font-semibold text-slate-500">/ {targetGoal} Shops</span>
            </div>
          </div>

          <div className="relative flex items-center justify-center flex-shrink-0">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="text-slate-850"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="text-blue-500 transition-all duration-500"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-xs font-black text-slate-200">{percentage}%</span>
          </div>
        </div>

        {/* Geofence Form Portal */}
        {isInterlocked ? (
          <div className="bg-slate-950 border border-dashed border-red-500/30 rounded-2xl p-6 text-center space-y-3 py-10 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
              <Compass size={24} className="animate-spin" />
            </div>
            <h4 className="text-sm font-bold text-red-400">Check-In Form Interlocked</h4>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
              Submission forms are disabled while in <span className="font-semibold text-amber-500">{status}</span> attendance state to prevent transactional conflicts.
            </p>
          </div>
        ) : (
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-4 animate-fade-in">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Compass size={14} className="text-blue-500" /> Geo-Fenced Check-In Portal
            </h3>

            {/* GPS Tracker Presets & live GPS query */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2.5">
              <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold">
                <span>GPS POSITION CAPTURE SOURCE</span>
                <span className={coordType.startsWith('Live') ? 'text-blue-400' : coordType === 'Normal' ? 'text-green-400' : 'text-red-400'}>{coordType}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCoordPresetChange('Normal')}
                  className={`py-1 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                    coordType === 'Normal' ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-slate-950 text-slate-500'
                  }`}
                >
                  Normal Preset (Delhi CP)
                </button>
                <button
                  type="button"
                  onClick={() => handleCoordPresetChange('Anomaly')}
                  className={`py-1 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                    coordType === 'Anomaly' ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-slate-950 text-slate-500'
                  }`}
                >
                  Anomaly Preset (1.7km Away)
                </button>
              </div>

              <button
                type="button"
                onClick={fetchLiveBrowserGPS}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white py-1.5 rounded text-[10px] font-semibold border border-slate-800 transition-colors cursor-pointer"
              >
                <Navigation size={10} className="text-blue-400" />
                Capture Live Browser GPS Coordinates
              </button>
            </div>

            <form onSubmit={handleCheckInSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Shop Outlet</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Reliance Fresh"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-lg px-3.5 py-2 text-xs text-slate-200 placeholder-slate-650 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Visit Summary Journal</label>
                <textarea
                  placeholder="Describe your field progress, stock status, and notes..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows="3"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Camera Capture (Mock)</label>
                <div className="flex gap-2.5 items-center">
                  <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs font-semibold text-slate-300 hover:text-white cursor-pointer hover:border-slate-700 transition-all">
                    <Upload size={14} />
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                  <span className="text-[10px] text-slate-500 truncate flex-1">
                    {imageFile ? imageFile.name : 'No image captured'}
                  </span>
                </div>
              </div>

              {formMsg.text && (
                <div className={`p-2.5 rounded text-[10px] font-bold border ${
                  formMsg.isError ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'
                }`}>
                  {formMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-xs cursor-pointer transition-colors"
              >
                {submitting ? 'Submitting Check-In...' : 'Submit Geo-Fenced Check-In'}
              </button>
            </form>
          </div>
        )}

        {/* Completed list */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">Completed Today ({completedToday})</h4>
          <div className="space-y-2">
            {myCheckIns.map((ci) => (
              <div key={ci._id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between">
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-300 truncate">{ci.shopName}</h4>
                  <p className="text-[9px] text-slate-500 truncate">{ci.summary}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-[9px] text-slate-500 font-medium block">
                    {new Date(ci.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {ci.isAnomaly ? (
                    <span className="text-[9px] text-red-400 font-bold text-right block">Anomaly (+{ci.distance}m)</span>
                  ) : (
                    <span className="text-[9px] text-green-400 font-bold text-right block">Verified CP</span>
                  )}
                </div>
              </div>
            ))}
            {myCheckIns.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-2">No visits registered today yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalespersonDashboard;
