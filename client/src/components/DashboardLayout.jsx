import React from 'react';
import { 
  Users, PlusCircle, Shield, TrendingUp, Map, Activity, 
  LayoutDashboard, Clock, AlertTriangle, Briefcase, LogOut, ClipboardList 
} from 'lucide-react';
import { logoutUser } from '../utils/api';

const DashboardLayout = ({ user, activeTab, setActiveTab, tabs, children, onSwitchRole }) => {
  const handleLogout = () => {
    logoutUser();
    window.location.reload();
  };

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'Users': return <Users size={20} />;
      case 'PlusCircle': return <PlusCircle size={20} />;
      case 'Shield': return <Shield size={20} />;
      case 'TrendingUp': return <TrendingUp size={20} />;
      case 'Map': return <Map size={20} />;
      case 'Activity': return <Activity size={20} />;
      case 'LayoutDashboard': return <LayoutDashboard size={20} />;
      case 'Clock': return <Clock size={20} />;
      case 'AlertTriangle': return <AlertTriangle size={20} />;
      case 'Briefcase': return <Briefcase size={20} />;
      case 'ClipboardList': return <ClipboardList size={20} />;
      default: return <Activity size={20} />;
    }
  };

  const roleLabels = {
    Admin: 'Super Admin',
    Owner: 'Corporate Owner',
    SuperOfficial: 'Regional Head',
    Manager: 'Branch Manager',
    Salesperson: 'Field Sales'
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Sticky Left Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-screen z-20">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white tracking-wider">
              T
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 tracking-tight leading-none">TRAKR</h1>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Enterprise Hub</span>
            </div>
          </div>
        </div>

        {/* Navigation Panel */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              {getIcon(tab.icon)}
              {tab.label}
            </button>
          ))}
        </nav>



        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900/60 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-200">
              {tabs.find((t) => t.id === activeTab)?.label || 'Dashboard'}
            </h2>
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {roleLabels[user?.role] || user?.role}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block font-medium">Logged in as</span>
              <span className="text-xs font-bold text-slate-300">{user?.name}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-blue-400 uppercase">
              {user?.name?.slice(0, 2)}
            </div>
          </div>
        </header>

        {/* Dashboard Panels */}
        <main className="flex-1 p-8 bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
