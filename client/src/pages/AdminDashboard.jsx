import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Shield, Server, RefreshCw, PlusCircle, LayoutGrid, CheckCircle } from 'lucide-react';

const AdminDashboard = ({ activeTab }) => {
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Onboarding Form State
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  
  const [formMsg, setFormMsg] = useState({ text: '', isError: false });
  const [generatedKey, setGeneratedKey] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [compRes, statsRes] = await Promise.all([
        api.get('/admin/companies'),
        api.get('/admin/system-stats')
      ]);
      setCompanies(compRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Error fetching admin details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleOnboard = async (e) => {
    e.preventDefault();
    if (!companyName || !ownerName || !ownerEmail || !ownerPassword) {
      setFormMsg({ text: 'All fields are required.', isError: true });
      return;
    }

    try {
      setSubmitLoading(true);
      setFormMsg({ text: '', isError: false });
      setGeneratedKey('');
      const { data } = await api.post('/admin/companies', {
        companyName,
        ownerName,
        ownerEmail,
        ownerPassword
      });

      setFormMsg({ text: `Tenant "${companyName}" onboarded successfully with Apex Owner "${ownerName}".`, isError: false });
      setGeneratedKey(data.company.apiKey);
      setCompanyName('');
      setOwnerName('');
      setOwnerEmail('');
      setOwnerPassword('');
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setFormMsg({ text: err.response?.data?.message || 'Failed to onboard company tenant.', isError: true });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (!window.confirm("Are you sure you want to delete this company tenant? This will revoke their License Key and permanently delete all their regional data, dashboards, and employee nodes.")) {
      return;
    }

    try {
      await api.delete(`/admin/companies/${companyId}`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete company tenant.');
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overview Cards (rendered on Tenant Monitor dashboard) */}
      {activeTab === 'monitor' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
              <LayoutGrid size={24} />
            </div>
            <div>
              <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Tenants</h4>
              <p className="text-2xl font-black text-slate-100 mt-1">{companies.length}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg animate-pulse-soft">
              <Server size={24} />
            </div>
            <div>
              <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider">CPU / Memory Health</h4>
              <p className="text-xl font-bold text-slate-100 mt-1">
                {stats?.cpuUsage}% CPU | {stats?.memoryUsage}% RAM
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 text-green-400 rounded-lg">
              <CheckCircle size={24} />
            </div>
            <div>
              <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Gateway State</h4>
              <p className="text-lg font-bold text-green-400 mt-1">
                {stats?.apiThresholds?.currentCalls} / {stats?.apiThresholds?.maxLimit} calls
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main panels filtered by activeTab */}
      <div className="grid grid-cols-1 gap-8">
        {/* Onboarding Form */}
        {activeTab === 'onboard' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl mx-auto w-full">
            <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
              <PlusCircle className="text-blue-500" size={18} /> Company Onboarding Console
            </h3>
            <p className="text-xs text-slate-500 mb-6">Provision new corporate tenants on the SaaS ecosystem and configure their Apex Owner accounts.</p>

            <form onSubmit={handleOnboard} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Company/Tenant Name</label>
                <input
                  type="text"
                  placeholder="e.g. Horlicks"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Apex Owner Name</label>
                  <input
                    type="text"
                    placeholder="Owner full name"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Owner Email Address</label>
                  <input
                    type="email"
                    placeholder="owner@company.com"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Owner Security Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {formMsg.text && (
                <div className={`p-3.5 rounded-lg text-xs font-semibold border ${
                  formMsg.isError 
                    ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                    : 'bg-green-500/10 border-green-500/20 text-green-400'
                }`}>
                  {formMsg.text}
                </div>
              )}

              {generatedKey && (
                <div className="bg-blue-950/40 border border-blue-500/20 text-slate-100 p-4 rounded-xl text-xs space-y-2 mt-4 font-mono">
                  <div className="font-bold text-blue-400">🔑 TENANT LICENSE KEY GENERATED</div>
                  <p className="text-[10px] text-slate-400">Provide this API key to the client tenant owner to authorize their enterprise dashboard integration:</p>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-850 text-xs text-green-400 font-bold select-all break-all">
                    {generatedKey}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-sm cursor-pointer disabled:opacity-50 transition-colors"
              >
                {submitLoading ? 'Registering...' : 'Provision Tenant Account'}
              </button>
            </form>
          </div>
        )}

        {/* Global Tenant Monitor */}
        {activeTab === 'monitor' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-200 flex items-center gap-2">
                <Shield className="text-purple-500" size={18} /> Global Tenant Monitor
              </h3>
              <button onClick={fetchAdminData} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer">
                <RefreshCw size={14} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-6">Complete telemetry and license access keys of all active registered clients on the enterprise field network.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Company Name</th>
                    <th className="pb-3">License API Key</th>
                    <th className="pb-3">Subscription</th>
                    <th className="pb-3 text-center">Employees</th>
                    <th className="pb-3">DB Health</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {companies.map((company) => (
                    <tr key={company._id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 font-bold text-slate-200">{company.name}</td>
                      <td className="py-3.5 font-mono text-[10px] text-blue-400">{company.apiKey || 'N/A'}</td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                          {company.subscription}
                        </span>
                      </td>
                      <td className="py-3.5 text-center font-semibold text-slate-300">{company.employeeCount}</td>
                      <td className="py-3.5">
                        <span className="text-green-400 font-bold">● Healthy</span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteCompany(company._id)}
                          className="px-2.5 py-1 bg-red-950/40 border border-red-500/20 hover:bg-red-900/40 text-[10px] font-bold text-red-400 rounded-md transition-all duration-200 cursor-pointer"
                        >
                          Delete Key
                        </button>
                      </td>
                    </tr>
                  ))}
                  {companies.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-6 text-slate-500">No active companies onboarded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Master System Controls & Access Logs */}
      {activeTab === 'controls' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-fade-in">
          <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Server className="text-blue-500" size={18} /> Master System Audit Logs
          </h3>
          <p className="text-xs text-slate-500 mb-6">Real-time system request gateway tracking and security checkpoints.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Client IP</th>
                  <th className="pb-3">API Endpoint Called</th>
                  <th className="pb-3 text-right">Status Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 font-mono text-slate-400">
                {stats?.accessLogs?.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 font-semibold text-slate-300">{log.ip}</td>
                    <td className="py-3 text-blue-400">{log.endpoint}</td>
                    <td className="py-3 text-right">
                      <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 font-bold">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
