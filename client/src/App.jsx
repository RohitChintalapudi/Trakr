import React, { useState, useEffect } from 'react';
import { getAuthUser, setAuthUser, setAuthToken } from './utils/api';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';

// Dashboards
import AdminDashboard from './pages/AdminDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import SuperOfficialDashboard from './pages/SuperOfficialDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import SalespersonDashboard from './pages/SalespersonDashboard';
import LogsPage from './pages/LogsPage';

// Define navigation tabs per role
const ROLE_TABS = {
  Admin: [
    { id: 'monitor', label: 'Tenant Monitor', icon: 'Users' },
    { id: 'onboard', label: 'Onboard Company', icon: 'PlusCircle' },
    { id: 'controls', label: 'System Controls', icon: 'Shield' }
  ],
  Owner: [
    { id: 'kpis', label: 'Macro KPIs', icon: 'TrendingUp' },
    { id: 'map', label: 'Global Activity Map', icon: 'Map' },
    { id: 'logs', label: 'Visit Logs', icon: 'ClipboardList' },
    { id: 'explorer', label: 'Org Tree Explorer', icon: 'LayoutDashboard' },
    { id: 'appoint', label: 'Appoint Regional Head', icon: 'PlusCircle' },
    { id: 'insights', label: 'Insight Engine', icon: 'Activity' }
  ],
  SuperOfficial: [
    { id: 'performance', label: 'Territory Performance', icon: 'LayoutDashboard' },
    { id: 'leaderboard', label: 'Manager Leaderboard', icon: 'Users' },
    { id: 'logs', label: 'Visit Logs', icon: 'ClipboardList' },
    { id: 'appoint', label: 'Appoint Branch Manager', icon: 'PlusCircle' },
    { id: 'insights', label: 'Insight Engine', icon: 'Activity' }
  ],
  Manager: [
    { id: 'feed', label: 'Field Feed', icon: 'Clock' },
    { id: 'attendance', label: 'Attendance Ticker', icon: 'Activity' },
    { id: 'logs', label: 'Visit Logs', icon: 'ClipboardList' },
    { id: 'anomalies', label: 'Anomaly Center', icon: 'AlertTriangle' },
    { id: 'appoint', label: 'Appoint Sales Force', icon: 'PlusCircle' }
  ],
  Salesperson: [
    { id: 'mobile', label: 'Mobile Portal', icon: 'Briefcase' }
  ]
};

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('landing');

  useEffect(() => {
    const loggedUser = getAuthUser();
    if (loggedUser) {
      setUser(loggedUser);
      // Set default active tab based on user role
      const tabs = ROLE_TABS[loggedUser.role] || [];
      if (tabs.length > 0) {
        setActiveTab(tabs[0].id);
      }
    }
    setLoading(false);
  }, []);

  // Quick switch role for testing
  const handleSwitchRole = (newRole) => {
    // Determine target mock email based on role
    const mockEmails = {
      Admin: 'admin@trakr.com',
      Owner: 'owner@nighatech.com',
      SuperOfficial: 'ramesh@nighatech.com',
      Manager: 'vikram@nighatech.com',
      Salesperson: 'raj@nighatech.com'
    };

    const email = mockEmails[newRole];
    if (email) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Auto-trigger login request via API to retrieve token for that role
      import('./utils/api').then(({ default: api, setAuthToken, setAuthUser }) => {
        api.post('/auth/login', { email, password: 'password123' }).then(({ data }) => {
          setAuthToken(data.token);
          setAuthUser({
            id: data._id,
            _id: data._id,
            name: data.name,
            email: data.email,
            role: data.role,
            parentId: data.parentId,
            path: data.path,
            region: data.region
          });
          window.location.reload();
        }).catch(err => {
          alert('Database needs seeding. Run backend server first to auto-populate default hierarchy.');
        });
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not logged in, route according to view state
  if (!user) {
    if (view === 'landing') {
      return <LandingPage onLogin={() => setView('login')} />;
    }
    return <Login onBack={() => setView('landing')} />;
  }

  const tabs = ROLE_TABS[user.role] || [];

  const renderDashboard = () => {
    switch (user.role) {
      case 'Admin':
        return <AdminDashboard activeTab={activeTab} />;
      case 'Owner':
        if (activeTab === 'logs') return <LogsPage user={user} />;
        return <OwnerDashboard user={user} activeTab={activeTab} />;
      case 'SuperOfficial':
        if (activeTab === 'logs') return <LogsPage user={user} />;
        return <SuperOfficialDashboard user={user} activeTab={activeTab} />;
      case 'Manager':
        if (activeTab === 'logs') return <LogsPage user={user} />;
        return <ManagerDashboard user={user} activeTab={activeTab} />;
      case 'Salesperson':
        return <SalespersonDashboard user={user} activeTab={activeTab} />;
      default:
        return (
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
            <h2 className="text-lg font-bold">Role Dashboard Not Found</h2>
            <p className="text-xs text-slate-400 mt-2">The logged in user role is not supported.</p>
          </div>
        );
    }
  };

  return (
    <DashboardLayout
      user={user}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tabs={tabs}
      onSwitchRole={handleSwitchRole}
    >
      {renderDashboard()}
    </DashboardLayout>
  );
}

export default App;
