import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import LiveMap from '../components/LiveMap';
import InsightCard from '../components/InsightCard';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Filler, Title, Tooltip, Legend 
} from 'chart.js';
import { 
  Award, ShieldAlert, RefreshCw, BarChart3, Users, 
  Store, CheckSquare, Clock, MapPin, Mail, Activity,
  PlusCircle, Sparkles, MessageSquare
} from 'lucide-react';

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Filler, Title, Tooltip, Legend
);

const SuperOfficialDashboard = ({ user, activeTab }) => {
  const [kpis, setKpis] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [subordinates, setSubordinates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Appoint Branch Manager Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState(null);

  const [sendingRegionalInsight, setSendingRegionalInsight] = useState(false);
  const [sendingInsightMessage, setSendingInsightMessage] = useState(null);

  const handleAppointSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormMessage(null);
    try {
      const response = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'Manager',
        parentId: user?._id || user?.id,
        region: user?.region
      });
      setFormMessage({
        type: 'success',
        text: `Branch Manager ${response.data.name} appointed successfully for ${user?.region}!`
      });
      setFormData({
        name: '',
        email: '',
        password: ''
      });
      fetchRegionalData();
    } catch (err) {
      console.error(err);
      setFormMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to appoint Branch Manager. Please check inputs.'
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Standalone Detail Modal State
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberCheckIns, setMemberCheckIns] = useState([]);

  const [insights, setInsights] = useState([]);

  // Extract actual managers and compute compliance metrics dynamically
  const actualManagers = subordinates.filter(sub => sub.role === 'Manager');
  const leaderboardList = actualManagers.length > 0 ? actualManagers.map((mgr) => {
    // Find direct reports (salespeople reporting to this manager)
    const reportSalespeople = subordinates.filter(sub => 
      sub.role === 'Salesperson' && 
      (sub.parentId?.toString() === mgr._id?.toString())
    );
    const reportIds = reportSalespeople.map(s => s._id?.toString());
    
    // Count checkins today
    const completed = checkIns.filter(ci => {
      const spId = ci.salespersonId?._id?.toString() || ci.salespersonId?.toString();
      return reportIds.includes(spId);
    }).length;
    
    const target = reportSalespeople.length * 5 || 15; // Quota: 5 per salesperson, or 15 default
    const score = target > 0 ? Math.round((completed / target) * 100) : 0;
    
    return {
      name: mgr.name,
      branch: mgr.region || 'Local Branch',
      visits: completed,
      target: target,
      score: Math.min(score, 100),
      status: score >= 80 ? 'Compliant' : score >= 50 ? 'Neutral' : 'Under Reporting'
    };
  }) : [
    { name: 'Vikram Singh', branch: 'Delhi', visits: 41, target: 45, score: 91, status: 'Compliant' },
    { name: 'Sanjay Sharma', branch: 'Noida', visits: 32, target: 40, score: 80, status: 'Compliant' },
    { name: 'Amit Verma', branch: 'Gurgaon', visits: 18, target: 35, score: 51, status: 'Under Reporting' }
  ];

  // Dynamic metrics calculations for Regional Insights Pie/Doughnut charts
  const regionalSalesforce = subordinates.filter(sub => sub.role === 'Salesperson');
  const spActive = regionalSalesforce.length > 0 ? regionalSalesforce.filter(sp => sp.status === 'Active').length : 8;
  const spBreak = regionalSalesforce.length > 0 ? regionalSalesforce.filter(sp => sp.status === 'Break').length : 2;
  const spOffline = regionalSalesforce.length > 0 ? regionalSalesforce.filter(sp => sp.status === 'Offline').length : 3;

  const verifiedCheckins = checkIns.length > 0 ? checkIns.filter(ci => !ci.isAnomaly).length : 35;
  const anomalyCheckins = checkIns.length > 0 ? checkIns.filter(ci => ci.isAnomaly).length : 5;

  const statusPieData = {
    labels: ['Active', 'On Break', 'Offline'],
    datasets: [{
      data: [spActive, spBreak, spOffline],
      backgroundColor: ['#10b981', '#f59e0b', '#64748b'],
      borderWidth: 1,
      borderColor: '#0f172a'
    }]
  };

  const anomalyPieData = {
    labels: ['Verified', 'Anomalies'],
    datasets: [{
      data: [verifiedCheckins, anomalyCheckins],
      backgroundColor: ['#10b981', '#ef4444'],
      borderWidth: 1,
      borderColor: '#0f172a'
    }]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#cbd5e1',
          boxWidth: 8,
          padding: 8,
          font: { size: 9 }
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#94a3b8',
        bodyColor: '#f1f5f9',
        borderColor: '#334155',
        borderWidth: 1
      }
    }
  };

  const fetchRegionalData = async () => {
    try {
      setLoading(true);
      const [kpiRes, chartRes, checkinRes, teamRes, insightRes] = await Promise.all([
        api.get('/analytics/kpis'),
        api.get('/analytics/chart-data'),
        api.get('/checkin/team'),
        api.get('/attendance/team'),
        api.get('/analytics/insights')
      ]);
      setKpis(kpiRes.data);
      setChartData(chartRes.data);
      setCheckIns(checkinRes.data);
      setSubordinates(teamRes.data);
      setInsights(insightRes.data.list || []);
    } catch (err) {
      console.error('Error fetching Regional head datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegionalData();

    // Auto-poll every 30s — only while token exists
    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (!token) return;
      Promise.all([
        api.get('/analytics/kpis'),
        api.get('/analytics/chart-data'),
        api.get('/checkin/team'),
        api.get('/attendance/team'),
        api.get('/analytics/insights')
      ]).then(([kpiRes, chartRes, checkinRes, teamRes, insightRes]) => {
        setKpis(kpiRes.data);
        setChartData(chartRes.data);
        setCheckIns(checkinRes.data);
        setSubordinates(teamRes.data);
        setInsights(insightRes.data.list || []);
      }).catch(() => {}); // silently ignore — 401s expected on session expiry
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleViewMemberDetails = (member) => {
    setSelectedMember(member);
    const filtered = checkIns.filter(ci => ci.salespersonId?._id === member._id);
    setMemberCheckIns(filtered);
  };

  const handleSendRegionalInsights = async () => {
    setSendingRegionalInsight(true);
    setSendingInsightMessage(null);
    try {
      const salespersonCount = subordinates.filter(s => s.role === 'Salesperson').length;
      const managerCount = subordinates.filter(s => s.role === 'Manager').length;
      const anomalyCount = checkIns.filter(ci => ci.isAnomaly).length;
      
      const content = `Regional Report for ${user?.region || 'Assigned Zone'}: ${checkIns.length} total check-ins, ${salespersonCount} active salespeople, and ${managerCount} branch managers reporting in our territory today.`;
      
      await api.post('/analytics/insights', {
        content,
        metrics: {
          totalCheckIns: checkIns.length,
          activeSalespeople: salespersonCount,
          anomaliesCount: anomalyCount
        }
      });
      setSendingInsightMessage({
        type: 'success',
        text: 'Regional operational metrics processed and sent to Owner successfully!'
      });
    } catch (err) {
      console.error(err);
      setSendingInsightMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to process and send regional insight report.'
      });
    } finally {
      setSendingRegionalInsight(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Regional Line Chart configuration
  const lineChartData = {
    labels: chartData?.lineChart?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Regional Check-Ins Completed',
        data: chartData?.lineChart?.data || [5, 8, 4, 10, 7, 12, 9],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        fill: 'origin'
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1
      }
    },
    scales: {
      x: { grid: { color: 'rgba(51, 65, 85, 0.1)' }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(51, 65, 85, 0.1)' }, ticks: { color: '#94a3b8' } }
    }
  };

  const managerInsights = selectedMember?.role === 'Manager'
    ? insights.filter(
        (insight) => (insight.senderId?._id?.toString() || insight.senderId?.toString()) === selectedMember._id?.toString()
      )
    : [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Regional Operations Hub</h2>
          <p className="text-xs text-slate-400">Territory compliance metrics, local map pins, and manager leaderboards.</p>
        </div>
        <button 
          onClick={fetchRegionalData} 
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* MY REGION SECTION */}
      {activeTab === 'performance' && (
        <>
          {/* Regional KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between text-emerald-500">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Regional Force</span>
                <Users size={18} />
              </div>
              <p className="text-3xl font-black text-slate-100 mt-2">{kpis?.activeWorkers}</p>
              <span className="text-[10px] text-green-400 font-semibold block mt-1">● Active workers in region</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between text-yellow-500">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Local Outlets</span>
                <Store size={18} />
              </div>
              <p className="text-3xl font-black text-slate-100 mt-2">{kpis?.totalShops}</p>
              <span className="text-[10px] text-slate-500 font-semibold block mt-1">Regionally assigned outlets</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between text-green-500">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Visits Completed</span>
                <CheckSquare size={18} />
              </div>
              <p className="text-3xl font-black text-slate-100 mt-2">{kpis?.dailyCheckIns}</p>
              <span className="text-[10px] text-green-400 font-semibold block mt-1">✓ Completed check-ins today</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Map isolated strictly to this Super Official's region */}
            <div className="lg:col-span-2">
              <LiveMap checkIns={checkIns} />
            </div>

            {/* Regional Line Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
                  <BarChart3 size={16} className="text-emerald-500" /> Daily Check-In Timeline
                </h3>
                <p className="text-xs text-slate-500 mb-6">Daily visit counts happening strictly inside your assigned zone.</p>
              </div>

              <div className="h-64 relative flex-1">
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
            </div>
          </div>

        </>
      )}

      {/* APPOINT BRANCH MANAGER SECTION */}
      {activeTab === 'appoint' && (
        <div className="max-w-md mx-auto w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <h3 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
            <PlusCircle size={18} className="text-emerald-500" /> Appoint Branch Manager
          </h3>
          <p className="text-xs text-slate-500 mb-6">Create a new Branch Manager account to supervise direct salespeople inside your region.</p>

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
                placeholder="e.g., Vikram Singh"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="e.g., vikram@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors"
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
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Assigned Territory (Inherited)</label>
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
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-xs font-bold text-white rounded-lg transition-colors cursor-pointer"
            >
              {formLoading ? 'Appointing...' : 'Confirm Appointment'}
            </button>
          </form>
        </div>
      )}

      {/* SUBORDINATE SECTION */}
      {activeTab === 'leaderboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Subordinate directory */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
              <Users size={16} className="text-blue-500" /> Regional Personnel Directory
            </h3>
            <p className="text-xs text-slate-500 mb-6">Listing of Managers and Salespersons reporting under your direct command.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {subordinates.filter(sub => sub.role !== 'SuperOfficial').map((sub) => (
                    <tr key={sub._id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 font-bold text-slate-200">{sub.name}</td>
                      <td className="py-3 text-slate-400 font-mono">{sub.email}</td>
                      <td className="py-3 text-slate-400 font-semibold">{sub.role}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          sub.status === 'Active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          sub.status === 'Break' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                          sub.status === 'Offline' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' :
                          'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleViewMemberDetails(sub)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 hover:text-white rounded transition-colors cursor-pointer"
                        >
                          View Stats
                        </button>
                      </td>
                    </tr>
                  ))}
                  {subordinates.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-6 text-slate-500">No regional personnel registered.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Regional Leaderboard */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col">
              <h3 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
                <Award size={16} className="text-yellow-500" /> Manager Compliance Rankings
              </h3>
              <p className="text-xs text-slate-500 mb-6">Manager audit rates based on team checks compliance.</p>

              <div className="space-y-4">
                {leaderboardList.map((mgr, idx) => (
                  <div 
                    key={idx}
                    className="p-3 bg-slate-950/50 rounded-lg border border-slate-850 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{mgr.name}</h4>
                      <span className="text-[10px] text-slate-500">{mgr.visits}/{mgr.target} completed</span>
                    </div>
                    <span className="text-xs font-bold text-yellow-500">{mgr.score}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-start gap-4">
              <div className="p-3 bg-red-500/10 text-red-400 rounded-lg">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-200 text-sm">Regional Compliance Alerts</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Only alerts mapped strictly inside your assigned zone (e.g. North Zone) are visible here. South Zone geofence warnings are isolated to other Regional Heads.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REGIONAL INSIGHT ENGINE */}
      {activeTab === 'insights' && (
        <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto w-full">
          <div className="w-full">
            <InsightCard />
          </div>

          {/* Regional Pie Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between h-[300px]">
              <div>
                <h4 className="font-bold text-slate-200 text-xs">Regional Field Force Activity</h4>
                <p className="text-[10px] text-slate-500 mb-4">Proportion of regional salespeople active, on break, or offline today.</p>
              </div>
              <div className="h-44 relative flex-1">
                <Pie key={`status-${spActive}-${spBreak}-${spOffline}`} data={statusPieData} options={pieOptions} />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between h-[300px]">
              <div>
                <h4 className="font-bold text-slate-200 text-xs">Regional Alert Verification Share</h4>
                <p className="text-[10px] text-slate-500 mb-4">Verified field check-ins vs out-of-bounds anomalies inside your region.</p>
              </div>
              <div className="h-44 relative flex-1">
                <Pie key={`anomaly-${verifiedCheckins}-${anomalyCheckins}`} data={anomalyPieData} options={pieOptions} />
              </div>
            </div>
          </div>

          {/* Processed branch insights section with dynamic graphs & list */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Received Insights from Branch Managers (2/3 width) */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col h-[400px]">
              <h3 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
                <Sparkles size={16} className="text-yellow-500" /> Received Insights from Branch Managers
              </h3>
              <p className="text-xs text-slate-500 mb-6">List of operational insights and branch performance summaries sent by managers reporting in your region.</p>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {insights.map((insight) => (
                  <div key={insight._id} className="p-4 bg-slate-950 border border-slate-850 rounded-xl hover:border-slate-700 transition-colors flex justify-between items-start gap-4">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">{insight.senderId?.name}</span>
                        <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 font-bold px-1.5 py-0.5 rounded">
                          Manager
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {new Date(insight.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">"{insight.content}"</p>
                    </div>
                    
                    <div className="flex gap-2 text-center text-[10px]">
                      <div className="px-2 py-1 bg-slate-900 border border-slate-850 rounded">
                        <span className="text-slate-500 block text-[8px]">Visits</span>
                        <span className="font-bold text-slate-300">{insight.metrics?.totalCheckIns || 0}</span>
                      </div>
                      <div className="px-2 py-1 bg-slate-900 border border-slate-850 rounded">
                        <span className="text-slate-500 block text-[8px]">Active</span>
                        <span className="font-bold text-slate-300">{insight.metrics?.activeSalespeople || 0}</span>
                      </div>
                      <div className="px-2 py-1 bg-slate-900 border border-slate-850 rounded">
                        <span className="text-slate-500 block text-[8px]">Anomalies</span>
                        <span className={`font-bold ${insight.metrics?.anomaliesCount > 0 ? 'text-red-400' : 'text-slate-300'}`}>
                          {insight.metrics?.anomaliesCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {insights.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-12 italic">No insights submitted by branch managers in your region yet.</p>
                )}
              </div>
            </div>

            {/* Regional Insight Processor (1/3 width) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between h-[400px]">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-yellow-500/10 text-yellow-500 rounded">
                    <Sparkles size={16} />
                  </div>
                  <h3 className="font-bold text-slate-200 text-sm">Regional Insight Processor</h3>
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Compile and submit compiled regional territory metrics directly to the Corporate Owner as high-level operational insights.
                </p>

                <div className="space-y-4">
                  <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-lg space-y-2.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Region Aggregated Metrics</span>
                    
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-slate-900/40 rounded border border-slate-850">
                        <span className="text-[9px] text-slate-500 block">Check-Ins</span>
                        <span className="font-black text-slate-200">{checkIns.length}</span>
                      </div>
                      <div className="p-2 bg-slate-900/40 rounded border border-slate-850">
                        <span className="text-[9px] text-slate-500 block">Sales Force</span>
                        <span className="font-black text-slate-200">{subordinates.filter(s => s.role === 'Salesperson').length}</span>
                      </div>
                      <div className="p-2 bg-slate-900/40 rounded border border-slate-850">
                        <span className="text-[9px] text-slate-500 block">Managers</span>
                        <span className="font-black text-slate-200">{subordinates.filter(s => s.role === 'Manager').length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Generated Report Preview</label>
                    <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-lg text-[11px] text-slate-400 italic leading-relaxed">
                      "Regional Report for {user?.region || 'Assigned Zone'}: {checkIns.length} total check-ins, {subordinates.filter(s => s.role === 'Salesperson').length} active salespeople, and {subordinates.filter(s => s.role === 'Manager').length} branch managers reporting in our territory today."
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {sendingInsightMessage && (
                  <div className={`p-2.5 rounded text-[10px] font-bold border text-center ${
                    sendingInsightMessage.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    {sendingInsightMessage.text}
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={handleSendRegionalInsights}
                  disabled={sendingRegionalInsight}
                  className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  {sendingRegionalInsight ? 'Processing...' : 'Process & Send Insight to Owner'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STANDALONE MEMBER DETAILS MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-6 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  {selectedMember.name.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                    {selectedMember.name}
                    <span className="text-[9px] bg-slate-800 text-slate-400 font-bold px-1.5 py-0.5 rounded">
                      {selectedMember.role}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Mail size={10} /> {selectedMember.email}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedMember(null)}
                className="text-slate-500 hover:text-slate-300 font-semibold text-xs bg-slate-950 border border-slate-850 rounded px-2.5 py-1 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-850">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Territory Region</span>
                <p className="text-xs font-bold text-slate-300 mt-1 flex items-center gap-1">
                  <MapPin size={10} className="text-green-500" /> {selectedMember.region || 'Global'}
                </p>
              </div>

              <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-850">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Attendance Status</span>
                <p className="text-xs font-bold text-slate-300 mt-1 flex items-center gap-1">
                  <Activity size={10} className="text-blue-400" /> {selectedMember.status}
                </p>
              </div>
            </div>

            {/* Conditional Content: Manager vs Salesperson */}
            {selectedMember.role === 'Manager' ? (
              <div className="space-y-6">
                {/* Insights Graph */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                    <BarChart3 size={12} className="text-blue-400" /> Branch Metrics Trend
                  </h4>
                  {managerInsights.length > 0 ? (
                    <div className="h-44 relative bg-slate-950/40 p-2 border border-slate-850 rounded-xl">
                      <Bar 
                        data={{
                          labels: [...managerInsights].reverse().slice(-5).map(ins => 
                            new Date(ins.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          ),
                          datasets: [
                            {
                              label: 'Visits',
                              data: [...managerInsights].reverse().slice(-5).map(ins => ins.metrics?.totalCheckIns || 0),
                              backgroundColor: '#10b981',
                              borderRadius: 3
                            },
                            {
                              label: 'Active Staff',
                              data: [...managerInsights].reverse().slice(-5).map(ins => ins.metrics?.activeSalespeople || 0),
                              backgroundColor: '#3b82f6',
                              borderRadius: 3
                            },
                            {
                              label: 'Anomalies',
                              data: [...managerInsights].reverse().slice(-5).map(ins => ins.metrics?.anomaliesCount || 0),
                              backgroundColor: '#ef4444',
                              borderRadius: 3
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top',
                              labels: {
                                color: '#94a3b8',
                                font: { size: 9 },
                                boxWidth: 10,
                                boxHeight: 10,
                                padding: 8
                              }
                            },
                            tooltip: {
                              backgroundColor: '#0f172a',
                              borderColor: '#334155',
                              borderWidth: 1
                            }
                          },
                          scales: {
                            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 8 } } },
                            y: { grid: { color: 'rgba(51, 65, 85, 0.1)' }, ticks: { color: '#94a3b8', font: { size: 8 }, precision: 0 } }
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <p className="text-center py-6 bg-slate-950/20 border border-slate-850 rounded-xl text-slate-500 italic text-[11px]">
                      No insights processed by this branch manager to plot trends.
                    </p>
                  )}
                </div>

                {/* Insights Text Logs */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                    <MessageSquare size={12} className="text-yellow-500" /> Submitted Insight Messages
                  </h4>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 text-[11px]">
                    {managerInsights.map((ins) => (
                      <div key={ins._id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl hover:border-slate-700 transition-colors space-y-2">
                        <div className="flex justify-between items-center text-[9px] text-slate-500">
                          <span className="font-mono">{new Date(ins.timestamp).toLocaleString()}</span>
                          <div className="flex gap-2">
                            <span className="text-slate-400">Visits: <strong className="text-slate-300">{ins.metrics?.totalCheckIns || 0}</strong></span>
                            <span className="text-slate-400">Active: <strong className="text-slate-300">{ins.metrics?.activeSalespeople || 0}</strong></span>
                            <span className="text-slate-400">Anomalies: <strong className="text-slate-300">{ins.metrics?.anomaliesCount || 0}</strong></span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 italic font-medium leading-relaxed">
                          "{ins.content}"
                        </p>
                      </div>
                    ))}
                    {managerInsights.length === 0 && (
                      <p className="text-center py-6 text-slate-500 italic text-[11px]">
                        No insights submitted by this manager yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Salesperson Check-In History */
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1.5">Check-In Activity Timeline</h4>
                
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 text-[11px]">
                  {memberCheckIns.map((ci) => (
                    <div key={ci._id} className="p-2.5 bg-slate-950 border border-slate-850 rounded-lg flex justify-between items-center hover:border-slate-700 transition-colors">
                      <div>
                        <span className="font-bold text-slate-300 block">{ci.shopName}</span>
                        <span className="text-[10px] text-slate-500">"{ci.summary}"</span>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <span className="text-[9px] text-slate-500">
                          {new Date(ci.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {ci.isAnomaly ? (
                          <span className="text-[9px] text-red-500 font-bold block">Anomaly (+{ci.distance}m)</span>
                        ) : (
                          <span className="text-[9px] text-green-400 font-bold block">Verified</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {memberCheckIns.length === 0 && (
                    <p className="text-center py-6 text-slate-500 italic text-[11px]">No check-in entries submitted by this employee.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperOfficialDashboard;
