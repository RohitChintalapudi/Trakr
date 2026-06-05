import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Clock, AlertTriangle, RefreshCw, Sparkles, MapPin, Eye, PlusCircle } from 'lucide-react';

const ManagerDashboard = ({ user, activeTab }) => {
  const [feed, setFeed] = useState([]);
  const [ticker, setTicker] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingInsight, setSendingInsight] = useState(false);
  const [insightMessage, setInsightMessage] = useState(null);
  const [selectedCheckIn, setSelectedCheckIn] = useState(null);

  const handleSendInsights = async () => {
    setSendingInsight(true);
    setInsightMessage(null);
    try {
      const activeCount = ticker.filter((w) => w.status === 'Active').length;
      const anomalyCount = feed.filter((item) => item.isAnomaly).length;
      
      const content = `Branch Report for ${user?.region || 'Local Territory'}: ${feed.length} check-ins, ${activeCount} active salespeople, and ${anomalyCount} geofence anomalies detected today.`;
      
      await api.post('/analytics/insights', {
        content,
        metrics: {
          totalCheckIns: feed.length,
          activeSalespeople: activeCount,
          anomaliesCount: anomalyCount
        }
      });
      setInsightMessage({
        type: 'success',
        text: 'Branch operational metrics processed and sent to Regional Head successfully!'
      });
    } catch (err) {
      console.error(err);
      setInsightMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to process and send insight report.'
      });
    } finally {
      setSendingInsight(false);
    }
  };

  const handleUpdateAnomaly = async (id, newStatus) => {
    try {
      await api.patch(`/checkin/${id}/anomaly`, { status: newStatus });
      fetchManagerData();
      if (selectedCheckIn && selectedCheckIn._id === id) {
        setSelectedCheckIn(prev => ({ ...prev, anomalyStatus: newStatus }));
      }
    } catch (err) {
      console.error('Failed to update anomaly status:', err);
    }
  };

  // Appoint Salesperson Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState(null);

  const handleAppointSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormMessage(null);
    try {
      const response = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'Salesperson',
        parentId: user?._id || user?.id,
        region: user?.region
      });
      setFormMessage({
        type: 'success',
        text: `Salesperson ${response.data.name} appointed successfully for ${user?.region}!`
      });
      setFormData({
        name: '',
        email: '',
        password: ''
      });
      fetchManagerData();
    } catch (err) {
      console.error(err);
      setFormMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to appoint Salesperson. Please check inputs.'
      });
    } finally {
      setFormLoading(false);
    }
  };

  const fetchManagerData = async () => {
    try {
      setLoading(true);
      const [feedRes, tickerRes] = await Promise.all([
        api.get('/checkin/team'),
        api.get('/attendance/team')
      ]);
      setFeed(feedRes.data);
      setTicker(tickerRes.data);
    } catch (err) {
      console.error('Error fetching manager data feeds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagerData();

    // Auto-poll the feeds every 10 seconds for real-time responsiveness
    const interval = setInterval(() => {
      api.get('/checkin/team').then(res => setFeed(res.data));
      api.get('/attendance/team').then(res => setTicker(res.data));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Filter anomalies for the Anomaly Alert Center
  const anomalies = feed.filter((item) => item.isAnomaly);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Branch Ops Center</h2>
          <p className="text-xs text-slate-400">Live operational feed, team attendance trackers, and geofence verification logs.</p>
        </div>
        <button 
          onClick={fetchManagerData} 
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
        >
          <RefreshCw size={14} /> Force Sync Feed
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Real-Time Field Feed */}
        {activeTab === 'feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto w-full">
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 w-full flex flex-col h-[520px]">
              <h3 className="font-bold text-slate-200 mb-2">Real-Time Field Feed</h3>
              <p className="text-xs text-slate-500 mb-6">Live logging scrolling timeline of salesperson check-ins and notes.</p>
 
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {feed.map((checkin) => (
                  <div 
                    key={checkin._id}
                    className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl relative hover:border-slate-700 transition-colors"
                  >
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0">
                        <img src={checkin.imageUrl} alt={checkin.shopName} className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-200 truncate">{checkin.shopName}</h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[9px] text-slate-500">
                              {new Date(checkin.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(checkin.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedCheckIn(checkin)}
                              className="p-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                              title="Inspect Check-In Details"
                            >
                              <Eye size={12} />
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          By <span className="font-semibold text-slate-300">{checkin.salespersonId?.name}</span>
                        </p>
 
                        <p className="text-[10px] text-slate-400 mt-2 italic bg-slate-900/50 p-2 rounded border border-slate-900 leading-tight">
                          "{checkin.summary}"
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {feed.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-12">No check-in entries submitted today.</p>
                )}
              </div>
            </div>
 
            {/* Branch Insight Processor */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between h-[520px]">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-yellow-500/10 text-yellow-500 rounded">
                    <Sparkles size={16} />
                  </div>
                  <h3 className="font-bold text-slate-200 text-sm">Branch Insight Processor</h3>
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Compile and submit compiled field activity metrics directly to your Regional Head (Super Official) as operational insights.
                </p>
 
                <div className="space-y-4">
                  <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-lg space-y-2.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Today's Aggregated Metrics</span>
                    
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-slate-900/40 rounded border border-slate-850">
                        <span className="text-[9px] text-slate-500 block">Check-Ins</span>
                        <span className="font-black text-slate-200">{feed.length}</span>
                      </div>
                      <div className="p-2 bg-slate-900/40 rounded border border-slate-850">
                        <span className="text-[9px] text-slate-500 block">Active Force</span>
                        <span className="font-black text-slate-200">{ticker.filter(w => w.status === 'Active').length}</span>
                      </div>
                      <div className="p-2 bg-slate-900/40 rounded border border-slate-850">
                        <span className="text-[9px] text-slate-500 block">Anomalies</span>
                        <span className={`font-black ${feed.filter(ci => ci.isAnomaly).length > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                          {feed.filter(ci => ci.isAnomaly).length}
                        </span>
                      </div>
                    </div>
                  </div>
 
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Generated Report Preview</label>
                    <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-lg text-[11px] text-slate-400 italic leading-relaxed">
                      "Branch Report for {user?.region || 'Local Territory'}: {feed.length} check-ins, {ticker.filter(w => w.status === 'Active').length} active salespeople, and {feed.filter(item => item.isAnomaly).length} geofence anomalies detected today."
                    </div>
                  </div>
                </div>
              </div>
 
              <div className="space-y-3">
                {insightMessage && (
                  <div className={`p-2.5 rounded text-[10px] font-bold border text-center ${
                    insightMessage.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    {insightMessage.text}
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={handleSendInsights}
                  disabled={sendingInsight}
                  className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  {sendingInsight ? 'Processing...' : 'Process & Send Insight to Super Official'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Status Ticker */}
        {activeTab === 'attendance' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl mx-auto w-full flex flex-col">
            <h3 className="font-bold text-slate-200 mb-2">Live Attendance & Status Ticker</h3>
            <p className="text-xs text-slate-500 mb-6">Real-time status indicators of assigned field salesperson accounts.</p>

            <div className="space-y-3.5">
              {ticker.map((worker) => (
                <div 
                  key={worker._id}
                  className="p-3 bg-slate-950/50 rounded-lg border border-slate-850 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{worker.name}</h4>
                    <p className="text-[10px] text-slate-500">{worker.email}</p>
                  </div>
                  
                  <div className="text-right">
                    {worker.status === 'Active' ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                        🟢 Active
                      </span>
                    ) : worker.status === 'Break' ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                        🟡 On Break
                      </span>
                    ) : worker.status === 'Offline' ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                        ⚫ Offline
                      </span>
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          🟠 On Hold
                        </span>
                        {worker.reason && (
                          <span className="text-[8px] text-slate-500 mt-0.5 max-w-[150px] truncate" title={worker.reason}>
                            {worker.reason}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {ticker.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">No field force agents assigned to this branch.</p>
              )}
            </div>
          </div>
        )}

        {/* Anomaly Alert Center */}
        {activeTab === 'anomalies' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl mx-auto w-full flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-slate-200">Anomaly Alert Center</h3>
              {anomalies.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-6">Visual geofence displacement warnings from check-ins matching distance anomalies.</p>

            <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
              {anomalies.map((alert) => (
                <div 
                  key={alert._id}
                  className="p-4 bg-red-950/10 border border-red-500/20 rounded-xl flex items-start gap-3 relative hover:border-red-500/40 transition-colors"
                >
                  <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div>
                      <h4 className="text-xs font-bold text-red-400 truncate">{alert.shopName}</h4>
                      <p className="text-[10px] text-slate-300 mt-0.5">
                        Agent <span className="font-semibold text-slate-200">{alert.salespersonId?.name}</span> checked in outside boundaries.
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-slate-500 border-t border-red-950/20 pt-1.5">
                      <span className="font-bold text-red-500">+{alert.distance}m deviation</span>
                      <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Manager Accept / Reject Actions */}
                    {alert.anomalyStatus === 'Pending' || !alert.anomalyStatus ? (
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateAnomaly(alert._id, 'Accepted')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold text-white rounded transition-colors cursor-pointer"
                        >
                          Accept Anomaly
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateAnomaly(alert._id, 'Rejected')}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-[10px] font-bold text-white rounded transition-colors cursor-pointer"
                        >
                          Reject Anomaly
                        </button>
                      </div>
                    ) : (
                      <div className="pt-1 text-[10px] font-bold">
                        Decision: <span className={alert.anomalyStatus === 'Accepted' ? 'text-emerald-400' : 'text-rose-400'}>
                          {alert.anomalyStatus}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {anomalies.length === 0 && (
                <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-850 text-center py-6 text-xs text-slate-500">
                  ✓ No active GPS geofence breaches detected.
                </div>
              )}
            </div>
          </div>
        )}

        {/* APPOINT SALES FORCE SECTION */}
        {activeTab === 'appoint' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md mx-auto w-full flex flex-col relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <h3 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
              <PlusCircle size={18} className="text-blue-500" /> Appoint Sales Force
            </h3>
            <p className="text-xs text-slate-500 mb-6">Create a new Field Salesperson account under your direct branch supervision.</p>

            {formMessage && (
              <div className={`p-3 rounded-lg border text-xs mb-4 ${
                formMessage.type === 'success' 
                  ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {formMessage.text}
              </div>
            )}

            <form onSubmit={handleAppointSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Raj Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g., raj@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Branch Territory (Inherited)</label>
                <input
                  type="text"
                  disabled
                  value={user?.region || 'Global'}
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-500 outline-none cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-xs font-bold text-white rounded-lg transition-colors cursor-pointer"
              >
                {formLoading ? 'Appointing...' : 'Confirm Appointment'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* CHECK-IN DETAIL MODAL */}
      {selectedCheckIn && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in animate-duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-6 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-200 text-base">{selectedCheckIn.shopName}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Check-in by <span className="font-semibold text-slate-300">{selectedCheckIn.salespersonId?.name || 'Assigned Agent'}</span>
                </p>
              </div>
              <button 
                onClick={() => setSelectedCheckIn(null)}
                className="text-slate-500 hover:text-slate-300 font-semibold text-xs bg-slate-950 border border-slate-850 rounded px-2.5 py-1 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Check-In Image */}
            <div className="w-full h-56 bg-slate-950 rounded-xl overflow-hidden border border-slate-850">
              <img src={selectedCheckIn.imageUrl} alt={selectedCheckIn.shopName} className="w-full h-full object-cover" />
            </div>

            {/* Metrics Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-850">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Timestamp</span>
                <span className="font-semibold text-slate-300 mt-1 block">
                  {new Date(selectedCheckIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedCheckIn.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-850">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Geofence Status</span>
                <span className={`font-bold mt-1 block ${selectedCheckIn.isAnomaly ? 'text-red-400' : 'text-green-400'}`}>
                  {selectedCheckIn.isAnomaly ? `Anomaly (+${selectedCheckIn.distance}m)` : `Verified (+${selectedCheckIn.distance}m)`}
                </span>
              </div>

              <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-850 col-span-2">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">GPS Coordinates (Captured)</span>
                <span className="font-semibold text-slate-300 mt-1 block font-mono">
                  Longitude: {selectedCheckIn.location?.coordinates?.[0]?.toFixed(5) || 'N/A'}, Latitude: {selectedCheckIn.location?.coordinates?.[1]?.toFixed(5) || 'N/A'}
                </span>
              </div>
            </div>

            {/* Anomaly Decision Bar */}
            {selectedCheckIn.isAnomaly && (
              <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-850 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Anomaly Audit Status</span>
                  <span className={`font-bold mt-1 block ${
                    selectedCheckIn.anomalyStatus === 'Accepted' ? 'text-green-400' : 
                    selectedCheckIn.anomalyStatus === 'Rejected' ? 'text-red-400' : 'text-yellow-500'
                  }`}>
                    {selectedCheckIn.anomalyStatus || 'Pending'}
                  </span>
                </div>
                {(selectedCheckIn.anomalyStatus === 'Pending' || !selectedCheckIn.anomalyStatus) && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateAnomaly(selectedCheckIn._id, 'Accepted')}
                      className="px-2.5 py-1 bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold rounded transition-colors cursor-pointer"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateAnomaly(selectedCheckIn._id, 'Rejected')}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold rounded transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Journal Summary</span>
              <p className="p-3 bg-slate-950/40 border border-slate-850 rounded-lg text-xs text-slate-300 italic leading-relaxed">
                "{selectedCheckIn.summary}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
