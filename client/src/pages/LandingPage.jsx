import React, { useState, useEffect } from 'react';
import { getAuthUser } from '../utils/api';
import { 
  ArrowRight, MapPin, Users, ShieldAlert, Network, Activity, 
  CheckSquare, TrendingUp, Lock, ShieldCheck, Mail, Phone, Map, Globe
} from 'lucide-react';

const LandingPage = ({ onLogin }) => {
  const [currentUser, setCurrentUser] = useState(null);
  
  // Stats counters for micro-animation showcase
  const [mockStats, setMockStats] = useState({
    activeAgents: 1420,
    checkInsToday: 3845,
    complianceRate: 98.4
  });

  useEffect(() => {
    const user = getAuthUser();
    if (user) {
      setCurrentUser(user);
    }

    // Micro-fluctuations in numbers to look alive
    const interval = setInterval(() => {
      setMockStats(prev => ({
        activeAgents: prev.activeAgents + (Math.random() > 0.5 ? 1 : -1),
        checkInsToday: prev.checkInsToday + Math.floor(Math.random() * 3),
        complianceRate: parseFloat((98.2 + Math.random() * 0.4).toFixed(1))
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600/30 overflow-x-hidden">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white tracking-wider">
              T
            </div>
            <div>
              <span className="text-lg font-bold text-slate-100 tracking-tight leading-none block">TRAKR</span>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Field Dynamics</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
            <a href="#features" className="hover:text-slate-100 transition-colors">Key Features</a>
            <a href="#hierarchy" className="hover:text-slate-100 transition-colors">Org Scoping</a>
            <a href="#pricing" className="hover:text-slate-100 transition-colors">Pricing Tiers</a>
            <a href="#contact" className="hover:text-slate-100 transition-colors">Get In Touch</a>
          </nav>

          <div>
            {currentUser ? (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                Go to Dashboard <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={onLogin}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-200 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 max-w-7xl mx-auto text-center">
        {/* Glow backdrop meshes */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="absolute top-20 left-1/3 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

        <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
            <Activity size={12} className="animate-pulse" /> Next-Gen Enterprise Operations
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-100 tracking-tight leading-tight">
            Dynamic Field Force Tracking, <br />
            <span className="bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
              Scoped & Geofenced
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Trakr dynamically segments metrics, geofence validations, and check-in timelines across complex enterprise layers. Secure regional head visibility, branch managers, and field salespeople in real-time.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            {currentUser ? (
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white rounded-xl shadow-lg shadow-blue-500/10 transition-all cursor-pointer flex items-center gap-2"
              >
                Access Dashboard <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button
                  onClick={onLogin}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white rounded-xl shadow-lg shadow-blue-500/10 transition-all cursor-pointer flex items-center gap-2"
                >
                  Get Started <ArrowRight size={16} />
                </button>
                <a
                  href="#features"
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-sm font-bold text-slate-300 hover:text-white rounded-xl transition-all"
                >
                  Explore Capabilities
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Live Preview Metrics Section */}
      <section className="px-6 pb-20 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-slate-900/50 border border-slate-900 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Field Force</span>
              <Users size={16} />
            </div>
            <p className="text-3xl font-black text-slate-100 mt-4 font-mono">{mockStats.activeAgents}</p>
            <span className="text-[10px] text-green-400 font-bold mt-2">● Dynamic sync live</span>
          </div>

          <div className="bg-slate-900/50 border border-slate-900 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Check-Ins Completed</span>
              <CheckSquare size={16} />
            </div>
            <p className="text-3xl font-black text-slate-100 mt-4 font-mono">{mockStats.checkInsToday}</p>
            <span className="text-[10px] text-slate-500 font-bold mt-2">Unique verification logs today</span>
          </div>

          <div className="bg-slate-900/50 border border-slate-900 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">GPS Compliance</span>
              <TrendingUp size={16} />
            </div>
            <p className="text-3xl font-black text-slate-100 mt-4 font-mono">{mockStats.complianceRate}%</p>
            <span className="text-[10px] text-green-400 font-bold mt-2">Within geofenced boundary</span>
          </div>
        </div>
      </section>

      {/* Key Features Grid */}
      <section id="features" className="py-24 px-6 border-t border-slate-900/80 bg-slate-900/20">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">Supercharged Feature Set</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">Built strictly to enforce compliance, geofence tracking, and tenant data privacy.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 bg-slate-900/30 border border-slate-850 hover:border-slate-700/60 rounded-2xl space-y-4 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Globe size={20} />
              </div>
              <h3 className="font-bold text-slate-200 text-sm">Dynamic Scoping</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Backend scoping queries filter resources to isolate regional heads, branch managers, and field agents.
              </p>
            </div>

            <div className="p-6 bg-slate-900/30 border border-slate-850 hover:border-slate-700/60 rounded-2xl space-y-4 transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <MapPin size={20} />
              </div>
              <h3 className="font-bold text-slate-200 text-sm">Geofence Verifier</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Captures device GPS coordinates. Computes deviations from scheduled target points and triggers warning flags automatically.
              </p>
            </div>

            <div className="p-6 bg-slate-900/30 border border-slate-850 hover:border-slate-700/60 rounded-2xl space-y-4 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Network size={20} />
              </div>
              <h3 className="font-bold text-slate-200 text-sm">Collapsible Org Tree</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Interact with the collapsible org-chart mapping entire corporate hierarchies. Appoint regional heads, managers, and salespeople seamlessly.
              </p>
            </div>

            <div className="p-6 bg-slate-900/30 border border-slate-850 hover:border-slate-700/60 rounded-2xl space-y-4 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Activity size={20} />
              </div>
              <h3 className="font-bold text-slate-200 text-sm">Live Activity Feed</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Real-time check-in updates track outlet visits, salesperson logs, and field reports immediately as they happen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Scoping and Hierarchy Showcase */}
      <section id="hierarchy" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              Strict Multi-Tenant Scoping
            </span>
            <h2 className="text-3xl font-bold text-slate-100 tracking-tight leading-tight">
              A Scoping Hierarchy <br />
              That Enforces Compliance
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Every level in the hierarchical node tree inherits specific scoping constraints. Corporate owners view regional performance, regional heads supervise zones, managers review check-ins, and agents report details safely.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0 text-xs">✓</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Owner Scoping</h4>
                  <p className="text-[11px] text-slate-500">Aggregates regional trends side-by-side inside comparative charts.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0 text-xs">✓</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Regional Isolations</h4>
                  <p className="text-[11px] text-slate-500">Super Officials filter out data belonging to other territories.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Scoping Model */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Scope Hierarchy Visualization</h3>

            <div className="space-y-3">
              <div className="p-3 bg-slate-950/70 border border-slate-850 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400">👑 Company Owner (Apex)</span>
                <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-bold">Global View</span>
              </div>
              
              <div className="pl-6 border-l border-slate-850 space-y-3">
                <div className="p-3 bg-slate-950/50 border border-slate-850 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">📍 Regional Head</span>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">Region Scope</span>
                </div>

                <div className="pl-6 border-l border-slate-850 space-y-3">
                  <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-yellow-500">🏢 Branch Manager</span>
                    <span className="text-[9px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 rounded font-mono font-bold">Direct Reports</span>
                  </div>

                  <div className="pl-6 border-l border-slate-850">
                    <div className="p-3 bg-slate-950/30 border border-slate-850 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">👤 Salesperson</span>
                      <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-bold">Personal Scope</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 border-t border-slate-900 bg-slate-900/10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">Simple, Transparent Pricing</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">Scale your field operations tracking safely with clear cost metrics.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Standard Tier */}
            <div className="p-8 bg-slate-900/40 border border-slate-900 hover:border-slate-850 rounded-3xl flex flex-col justify-between transition-colors relative">
              <div className="space-y-4">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Startup Group</span>
                <p className="text-3xl font-black text-slate-100">$49<span className="text-xs text-slate-500 font-semibold">/month</span></p>
                <p className="text-xs text-slate-400">Perfect for growing startups needing simple field activity logs.</p>
                
                <ul className="text-xs text-slate-400 space-y-2.5 pt-4">
                  <li className="flex items-center gap-2">✓ Up to 10 active agents</li>
                  <li className="flex items-center gap-2">✓ Basic Geofencing Alerts</li>
                  <li className="flex items-center gap-2">✓ Simple Org Tree View</li>
                  <li className="flex items-center gap-2">✓ Email support</li>
                </ul>
              </div>
              <button 
                onClick={onLogin}
                className="w-full mt-8 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Start Trial
              </button>
            </div>

            {/* Enterprise Tier */}
            <div className="p-8 bg-slate-900/60 border border-blue-500/30 rounded-3xl flex flex-col justify-between relative shadow-2xl">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-[9px] font-bold text-white uppercase tracking-wider">
                Most Popular
              </div>
              
              <div className="space-y-4">
                <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400">Enterprise Suite</span>
                <p className="text-3xl font-black text-slate-100">$199<span className="text-xs text-slate-500 font-semibold">/month</span></p>
                <p className="text-xs text-slate-400">Designed for regional multi-branch organizations requiring isolation.</p>
                
                <ul className="text-xs text-slate-400 space-y-2.5 pt-4">
                  <li className="flex items-center gap-2 text-slate-300">✓ Unlimited active agents</li>
                  <li className="flex items-center gap-2 text-slate-300">✓ Multi-Region Data Isolation</li>
                  <li className="flex items-center gap-2 text-slate-300">✓ GPS Deviation / Geofencing</li>
                  <li className="flex items-center gap-2 text-slate-300">✓ Real-time Activity Feed</li>
                  <li className="flex items-center gap-2 text-slate-300">✓ API integration credentials</li>
                </ul>
              </div>
              <button 
                onClick={onLogin}
                className="w-full mt-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded-lg transition-colors cursor-pointer"
              >
                Upgrade to Enterprise
              </button>
            </div>

            {/* Apex Custom Tier */}
            <div className="p-8 bg-slate-900/40 border border-slate-900 hover:border-slate-850 rounded-3xl flex flex-col justify-between transition-colors">
              <div className="space-y-4">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Custom Apex</span>
                <p className="text-3xl font-black text-slate-100">Custom<span className="text-xs text-slate-500 font-semibold"></span></p>
                <p className="text-xs text-slate-400">Tailored custom deployments for global multinatonal systems.</p>
                
                <ul className="text-xs text-slate-400 space-y-2.5 pt-4">
                  <li className="flex items-center gap-2">✓ Multi-tenant custom environments</li>
                  <li className="flex items-center gap-2">✓ Custom aggregate BI metrics</li>
                  <li className="flex items-center gap-2">✓ Dedicated SLA support channels</li>
                  <li className="flex items-center gap-2">✓ Single-Sign-On integrations</li>
                </ul>
              </div>
              <button 
                onClick={onLogin}
                className="w-full mt-8 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer id="contact" className="border-t border-slate-900 bg-slate-950 px-6 py-12 text-slate-500">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                T
              </div>
              <span className="font-bold text-slate-300 text-sm">TRAKR</span>
            </div>
            <p className="text-[11px] leading-relaxed max-w-xs">
              Dynamically scoped, real-time geofenced management ecosystem for modern field force organizations.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Connect</h4>
            <div className="text-[11px] space-y-2">
              <p className="flex items-center gap-2"><Mail size={12} /> info@trakr.com</p>
              <p className="flex items-center gap-2"><Phone size={12} /> +1 (555) 019-2834</p>
            </div>
          </div>

          <div className="space-y-3 text-[11px]">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Security & Compliance</h4>
            <p className="leading-relaxed">
              Trakr uses industry-standard 256-bit encryption for geo logs and ensures complete database isolation between SaaS tenant company profiles.
            </p>
            <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
              <ShieldCheck size={14} /> SOC2 Type II Certified
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-900/60 mt-8 pt-6 flex flex-col sm:flex-row justify-between text-[10px]">
          <p>© {new Date().getFullYear()} Trakr Technologies Inc. All rights reserved.</p>
          <div className="flex gap-4 mt-2 sm:mt-0">
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
