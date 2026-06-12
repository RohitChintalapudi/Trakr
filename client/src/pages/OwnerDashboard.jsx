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
  Users, Store, CheckSquare, Clock, TrendingUp, RefreshCw, 
  ChevronRight, ChevronDown, User, Network, Mail, MapPin, Activity,
  PlusCircle, Sparkles, MessageSquare, BarChart3
} from 'lucide-react';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, 
  LineElement, BarElement, ArcElement, Filler, Title, Tooltip, Legend
);

const OwnerDashboard = ({ user, activeTab }) => {
  const [kpis, setKpis] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tree View Expand State
  const [expandedNodes, setExpandedNodes] = useState({});

  // Appoint Regional Head Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    region: 'North Zone'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState(null);

  const fetchOwnerData = async () => {
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
      setTeamMembers(teamRes.data);
      setInsights(insightRes.data.list || []);
    } catch (err) {
      console.error('Error fetching Owner analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAppointSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormMessage(null);
    try {
      const response = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'SuperOfficial',
        parentId: user?._id || user?.id,
        region: formData.region
      });
      setFormMessage({
        type: 'success',
        text: `Regional Head ${response.data.name} appointed successfully for ${formData.region}!`
      });
      setFormData({
        name: '',
        email: '',
        password: '',
        region: 'North Zone'
      });
      fetchOwnerData();
    } catch (err) {
      console.error(err);
      setFormMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to appoint Regional Head. Please check inputs.'
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Standalone Detail Modal State
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberCheckIns, setMemberCheckIns] = useState([]);



  useEffect(() => {
    fetchOwnerData();

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
        setTeamMembers(teamRes.data);
        setInsights(insightRes.data.list || []);
      }).catch(() => {}); // silently ignore — 401s expected on session expiry
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleNode = (id) => {
    setExpandedNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleViewMemberDetails = (member) => {
    setSelectedMember(member);
    // Filter check-ins submitted by this specific salesperson
    const filtered = checkIns.filter(ci => ci.salespersonId?._id === member._id);
    setMemberCheckIns(filtered);
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Chart configuration
  const lineChartData = {
    labels: chartData?.lineChart?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Field Check-Ins Completed',
        data: chartData?.lineChart?.data || [10, 15, 12, 20, 18, 25, 22],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
        titleColor: '#94a3b8',
        bodyColor: '#f1f5f9',
        borderColor: '#334155',
        borderWidth: 1
      }
    },
    scales: {
      x: { grid: { color: 'rgba(51, 65, 85, 0.15)' }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(51, 65, 85, 0.15)' }, ticks: { color: '#94a3b8', stepSize: 5 } }
    }
  };

  // Comparative Multi-Bar Chart Data (North vs South vs East)
  const barChartData = {
    labels: chartData?.barChart?.labels || ['North Zone', 'South Zone', 'East Zone'],
    datasets: [
      {
        label: 'Total Check-Ins By Region',
        data: chartData?.barChart?.data || [42, 28, 15],
        backgroundColor: ['#2563eb', '#0d9488', '#8b5cf6'],
        hoverBackgroundColor: ['#3b82f6', '#14b8a6', '#a78bfa'],
        borderRadius: 8
      }
    ]
  };

  const barChartOptions = {
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

  // Collapsible Organigram Tree constructor
  const superOfficials = teamMembers.filter(m => m.role === 'SuperOfficial');
  const managers = teamMembers.filter(m => m.role === 'Manager');
  const salespeople = teamMembers.filter(m => m.role === 'Salesperson');

  // Dynamic metrics calculations for Insights Pie/Doughnut charts
  const spActive = salespeople.length > 0 ? salespeople.filter(sp => sp.status === 'Active').length : 12;
  const spBreak = salespeople.length > 0 ? salespeople.filter(sp => sp.status === 'Break').length : 3;
  const spOffline = salespeople.length > 0 ? salespeople.filter(sp => sp.status === 'Offline').length : 5;

  const verifiedCheckins = checkIns.length > 0 ? checkIns.filter(ci => !ci.isAnomaly).length : 85;
  const anomalyCheckins = checkIns.length > 0 ? checkIns.filter(ci => ci.isAnomaly).length : 15;

  const northCheckins = checkIns.length > 0 ? checkIns.filter(ci => ci.region === 'North Zone').length : 42;
  const southCheckins = checkIns.length > 0 ? checkIns.filter(ci => ci.region === 'South Zone').length : 28;
  const eastCheckins = checkIns.length > 0 ? checkIns.filter(ci => ci.region === 'East Zone').length : 15;
  const westCheckins = checkIns.length > 0 ? checkIns.filter(ci => ci.region === 'West Zone').length : 10;

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
      backgroundColor: ['#3b82f6', '#ef4444'],
      borderWidth: 1,
      borderColor: '#0f172a'
    }]
  };

  const regionalDoughnutData = {
    labels: ['North Zone', 'South Zone', 'East Zone', 'West Zone'],
    datasets: [{
      data: [northCheckins, southCheckins, eastCheckins, westCheckins],
      backgroundColor: ['#2563eb', '#0d9488', '#8b5cf6', '#f43f5e'],
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

  const memberInsights = (selectedMember?.role === 'Manager' || selectedMember?.role === 'SuperOfficial')
    ? insights.filter(
        (insight) => (insight.senderId?._id?.toString() || insight.senderId?.toString()) === selectedMember._id?.toString()
      )
    : [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Enterprise apex Control Panel</h2>
          <p className="text-xs text-slate-400">Company-wide macro analytics and hierarchical organizational scoping.</p>
        </div>
        <button 
          onClick={fetchOwnerData} 
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
        >
          <RefreshCw size={14} /> Force Synchronize
        </button>
      </div>

      {/* OVERALL COMPANY SECTION */}
      {activeTab === 'kpis' && (
        <>
          {/* Macro KPI Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between text-blue-500">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Field Force</span>
                <Users size={18} />
              </div>
              <p className="text-3xl font-black text-slate-100 mt-2">{kpis?.activeWorkers}</p>
              <span className="text-[10px] text-green-400 font-semibold block mt-1">● Active workers today</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between text-yellow-500">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Shops Visited</span>
                <Store size={18} />
              </div>
              <p className="text-3xl font-black text-slate-100 mt-2">{kpis?.totalShops}</p>
              <span className="text-[10px] text-slate-500 font-semibold block mt-1">Unique outlet touchpoints</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between text-green-500">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Daily Visops</span>
                <CheckSquare size={18} />
              </div>
              <p className="text-3xl font-black text-slate-100 mt-2">{kpis?.dailyCheckIns}</p>
              <span className="text-[10px] text-green-400 font-semibold block mt-1">✓ Completed check-ins today</span>
            </div>
          </div>

          {/* Regional vs Company Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-bold text-slate-200 mb-2">Regional Visit Breakdown</h3>
              <p className="text-xs text-slate-500 mb-6">Side-by-side comparative shop visit rates grouped by regional boundaries.</p>
              <div className="h-64 relative">
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-bold text-slate-200 mb-2">Company Growth Curve</h3>
              <p className="text-xs text-slate-500 mb-6">Temporal field check-ins tracked over weekly timeline loops.</p>
              <div className="h-64 relative">
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* MAP SECTION */}
      {activeTab === 'map' && (
        <div className="w-full">
          <LiveMap checkIns={checkIns} />
        </div>
      )}

      {/* APPOINT REGIONAL HEAD SECTION */}
      {activeTab === 'appoint' && (
        <div className="max-w-md mx-auto w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <h3 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
            <PlusCircle size={18} className="text-blue-500" /> Appoint Regional Head
          </h3>
          <p className="text-xs text-slate-500 mb-6">Create a new Super Official account to manage regional branches and managers.</p>

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
                placeholder="e.g., Ramesh Kumar"
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
                placeholder="e.g., ramesh@company.com"
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
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Territory Region</label>
              <select
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors"
              >
                <option value="North Zone">North Zone</option>
                <option value="South Zone">South Zone</option>
                <option value="East Zone">East Zone</option>
                <option value="West Zone">West Zone</option>
              </select>
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

      {/* HIERARCHICAL EXPLORER SECTION */}
      {activeTab === 'explorer' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-4xl mx-auto w-full">
          <h3 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
            <Network size={18} className="text-blue-500" /> Hierarchical Tree Explorer
          </h3>
          <p className="text-xs text-slate-500 mb-6">Collapsible org-chart maps showing Super Officials, Branch Managers, and field salespeople.</p>

          <div className="space-y-4 border-l border-slate-850 pl-4 mt-6">
            {/* Top Node: Owner */}
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center gap-3 w-fit mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">👑</div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">{user?.name || 'Corporate Owner'} (Apex)</h4>
                <p className="text-[10px] text-slate-500">{user?.name ? `${user.name} Group` : 'Corporate Global Administrator'}</p>
              </div>
            </div>

            {/* Sub-tier tree recursive expansion */}
            {superOfficials.map((so) => {
              const soExpanded = expandedNodes[so._id];
              const soManagers = managers.filter(m => m.parentId === so._id);
              
              return (
                <div key={so._id} className="space-y-3 pl-4 relative">
                  <div className="absolute -left-4 top-4 w-4 h-0.5 bg-slate-800"></div>
                  
                  {/* Super Official Card */}
                  <div className="flex items-center gap-2.5">
                    <button 
                      onClick={() => handleToggleNode(so._id)}
                      className="p-1 text-slate-500 hover:text-slate-200 transition-colors"
                    >
                      {soExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3 min-w-[280px]">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-200 truncate">{so.name}</h4>
                        <span className="text-[9px] bg-slate-800 text-slate-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                          Regional Head ({so.region})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expand Managers */}
                  {soExpanded && soManagers.map((mgr) => {
                    const mgrExpanded = expandedNodes[mgr._id];
                    const mgrSales = salespeople.filter(s => s.parentId === mgr._id);

                    return (
                      <div key={mgr._id} className="pl-12 space-y-3 relative">
                        <div className="absolute -left-8 top-4 w-8 h-0.5 bg-slate-800"></div>
                        <div className="absolute -left-8 top-4 bottom-4 w-0.5 bg-slate-800"></div>

                        {/* Manager Card */}
                        <div className="flex items-center gap-2.5">
                          <button 
                            onClick={() => handleToggleNode(mgr._id)}
                            className="p-1 text-slate-500 hover:text-slate-200 transition-colors"
                          >
                            {mgrExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                          
                          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3 min-w-[280px]">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-200 truncate">{mgr.name}</h4>
                              <span className="text-[9px] text-slate-500 font-semibold block">Branch Manager</span>
                            </div>
                          </div>
                        </div>

                        {/* Expand Salespeople */}
                        {mgrExpanded && mgrSales.map((sp) => (
                          <div key={sp._id} className="pl-12 relative">
                            <div className="absolute -left-8 top-4.5 w-8 h-0.5 bg-slate-800"></div>
                            <div className="absolute -left-8 top-0 bottom-4 w-0.5 bg-slate-800"></div>

                            {/* Salesperson click trigger standalone metrics details */}
                            <button
                              onClick={() => handleViewMemberDetails(sp)}
                              className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-left rounded-xl flex items-center gap-3 min-w-[280px] transition-colors cursor-pointer group"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 group-hover:scale-125 transition-transform"></div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-300 group-hover:text-blue-400 transition-colors truncate">{sp.name}</h4>
                                <p className="text-[9px] text-slate-500">Sales Field Force ({sp.status})</p>
                              </div>
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ALL MEMBERS DIRECTORY & INSIGHTS */}
      {activeTab === 'insights' && (
        <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto w-full">
          <div className="w-full">
            <InsightCard />
          </div>

          {/* Real-time Insight Analytics Pie & Doughnut charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between h-[320px]">
              <div>
                <h4 className="font-bold text-slate-200 text-xs">Field Force Activity</h4>
                <p className="text-[10px] text-slate-500 mb-4">Proportion of salespeople active, on break, or offline today.</p>
              </div>
              <div className="h-44 relative flex-1">
                <Pie key={`status-${spActive}-${spBreak}-${spOffline}`} data={statusPieData} options={pieOptions} />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between h-[320px]">
              <div>
                <h4 className="font-bold text-slate-200 text-xs">Alert Verification Share</h4>
                <p className="text-[10px] text-slate-500 mb-4">Verified field check-ins vs out-of-bounds anomaly alerts.</p>
              </div>
              <div className="h-44 relative flex-1">
                <Pie key={`anomaly-${verifiedCheckins}-${anomalyCheckins}`} data={anomalyPieData} options={pieOptions} />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between h-[320px]">
              <div>
                <h4 className="font-bold text-slate-200 text-xs">Regional Visit Share</h4>
                <p className="text-[10px] text-slate-500 mb-4">Percentage breakdown of completed check-ins by geographic territory.</p>
              </div>
              <div className="h-44 relative flex-1">
                <Doughnut key={`regional-${northCheckins}-${southCheckins}-${eastCheckins}`} data={regionalDoughnutData} options={pieOptions} />
              </div>
            </div>
          </div>

          {/* Processed branch insights section with dynamic graphs & list */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Insights feed */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col h-[400px]">
              <h3 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
                <Sparkles size={16} className="text-yellow-500" /> Processed Branch Insights
              </h3>
              <p className="text-xs text-slate-500 mb-6">Real-time operational insight reports submitted by Branch Managers across all regions.</p>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {insights.map((insight) => (
                  <div key={insight._id} className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl hover:border-slate-700 transition-colors flex justify-between items-start gap-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-200">{insight.senderId?.name}</span>
                        {insight.senderId?.role && (
                          <span className="text-[9px] bg-slate-800 border border-slate-700 text-slate-300 font-bold px-1.5 py-0.5 rounded">
                            {insight.senderId.role === 'SuperOfficial' ? 'Regional Head' : 'Manager'}
                          </span>
                        )}
                        <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 font-bold px-1.5 py-0.5 rounded">
                          {insight.region}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {new Date(insight.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-normal">"{insight.content}"</p>
                    </div>

                    <div className="flex gap-1.5 text-center text-[9px] flex-shrink-0">
                      <div className="px-2 py-0.5 bg-slate-900 border border-slate-850 rounded">
                        <span className="text-slate-500 block text-[8px]">Visits</span>
                        <span className="font-bold text-slate-300">{insight.metrics?.totalCheckIns || 0}</span>
                      </div>
                      <div className="px-2 py-0.5 bg-slate-900 border border-slate-850 rounded">
                        <span className="text-slate-500 block text-[8px]">Active</span>
                        <span className="font-bold text-slate-300">{insight.metrics?.activeSalespeople || 0}</span>
                      </div>
                      <div className="px-2 py-0.5 bg-slate-900 border border-slate-850 rounded">
                        <span className="text-slate-500 block text-[8px]">Anom</span>
                        <span className={`font-bold ${insight.metrics?.anomaliesCount > 0 ? 'text-red-400' : 'text-slate-300'}`}>
                          {insight.metrics?.anomaliesCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {insights.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-12 italic">No branch insights processed and submitted by Managers yet.</p>
                )}
              </div>
            </div>

            {/* Performance Analytics Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between h-[400px]">
              <div>
                <h3 className="font-bold text-slate-200 mb-2">Branch Metrics Comparison</h3>
                <p className="text-xs text-slate-500 mb-6">Comparative analysis of total check-ins vs anomalies across active branches.</p>
              </div>

              <div className="h-64 relative flex-1">
                <Bar 
                  data={{
                    labels: insights.length > 0 ? insights.map(i => i.senderId?.name?.split(' ')[0] || 'Manager') : ['Vikram', 'Suresh', 'Vijay'],
                    datasets: [
                      {
                        label: 'Check-Ins',
                        data: insights.length > 0 ? insights.map(i => i.metrics?.totalCheckIns || 0) : [15, 8, 22],
                        backgroundColor: '#3b82f6',
                        borderRadius: 6
                      },
                      {
                        label: 'Anomalies',
                        data: insights.length > 0 ? insights.map(i => i.metrics?.anomaliesCount || 0) : [1, 2, 0],
                        backgroundColor: '#ef4444',
                        borderRadius: 6
                      }
                    ]
                  }} 
                  options={{
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
                      x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                      y: { grid: { color: 'rgba(51, 65, 85, 0.1)' }, ticks: { color: '#94a3b8' } }
                    }
                  }} 
                />
              </div>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-4xl mx-auto w-full">
            <h3 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
              <Users size={16} className="text-blue-500" /> All Members Directory
            </h3>
            <p className="text-xs text-slate-500 mb-6">List of all active personnel under scoping. Click "View Stats" to open standalone metric panels.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Region</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {teamMembers.map((member) => (
                    <tr key={member._id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 font-bold text-slate-200">{member.name}</td>
                      <td className="py-3 text-slate-400 font-mono">{member.email}</td>
                      <td className="py-3 text-slate-400 font-semibold">{member.role}</td>
                      <td className="py-3 text-slate-400">{member.region || 'Global'}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          member.status === 'Active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          member.status === 'Break' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                          member.status === 'Offline' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' :
                          'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleViewMemberDetails(member)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 hover:text-white rounded transition-colors cursor-pointer"
                        >
                          View Stats
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STANDALONE MEMBER METRIC MODAL / SIDE CARD */}
      {selectedMember && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-6 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
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

            {/* Conditional Content: Manager/SuperOfficial Insights vs Salesperson Check-Ins */}
            {selectedMember.role === 'Manager' || selectedMember.role === 'SuperOfficial' ? (
              <div className="space-y-6">
                {/* Insights Graph */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                    <BarChart3 size={12} className="text-blue-400" /> Operational Metrics Trend
                  </h4>
                  {memberInsights.length > 0 ? (
                    <div className="h-44 relative bg-slate-950/40 p-2 border border-slate-850 rounded-xl">
                      <Bar 
                        data={{
                          labels: [...memberInsights].reverse().slice(-5).map(ins => 
                            new Date(ins.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          ),
                          datasets: [
                            {
                              label: 'Visits',
                              data: [...memberInsights].reverse().slice(-5).map(ins => ins.metrics?.totalCheckIns || 0),
                              backgroundColor: '#10b981',
                              borderRadius: 3
                            },
                            {
                              label: 'Active Staff',
                              data: [...memberInsights].reverse().slice(-5).map(ins => ins.metrics?.activeSalespeople || 0),
                              backgroundColor: '#3b82f6',
                              borderRadius: 3
                            },
                            {
                              label: 'Anomalies',
                              data: [...memberInsights].reverse().slice(-5).map(ins => ins.metrics?.anomaliesCount || 0),
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
                      No insights processed by this official to plot trends.
                    </p>
                  )}
                </div>

                {/* Insights Text Logs */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                    <MessageSquare size={12} className="text-yellow-500" /> Submitted Insight Messages
                  </h4>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 text-[11px]">
                    {memberInsights.map((ins) => (
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
                    {memberInsights.length === 0 && (
                      <p className="text-center py-6 text-slate-500 italic text-[11px]">
                        No insights submitted by this official yet.
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

export default OwnerDashboard;
