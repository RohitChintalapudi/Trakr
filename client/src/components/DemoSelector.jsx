import React from 'react';
import { User, Shield, Briefcase, Activity, CheckSquare } from 'lucide-react';

const DemoSelector = ({ onSelect }) => {
  const accounts = [
    {
      role: 'Admin',
      name: 'System Admin',
      email: 'admin@trakr.com',
      desc: 'Provision tenant companies & keys',
      icon: <Shield size={16} className="text-purple-400" />
    },
    {
      role: 'Owner',
      name: 'Horlicks Corporate Owner',
      email: 'owner@horlicks.com',
      desc: 'Overall metrics & tree explorer',
      icon: <User size={16} className="text-blue-400" />
    },
    {
      role: 'SuperOfficial',
      name: 'Ramesh (North Regional Head)',
      email: 'ramesh@horlicks.com',
      desc: 'North zone metrics & managers',
      icon: <Activity size={16} className="text-green-400" />
    },
    {
      role: 'SuperOfficial',
      name: 'Suresh (South Regional Head)',
      email: 'suresh@horlicks.com',
      desc: 'South zone metrics & managers',
      icon: <Activity size={16} className="text-teal-400" />
    },
    {
      role: 'Manager',
      name: 'Vikram (Delhi Manager)',
      email: 'vikram@horlicks.com',
      desc: 'Delhi feeds & direct alerts',
      icon: <Briefcase size={16} className="text-yellow-400" />
    },
    {
      role: 'Manager',
      name: 'Karan (Bangalore Manager)',
      email: 'karan@horlicks.com',
      desc: 'Bangalore feeds & direct alerts',
      icon: <Briefcase size={16} className="text-orange-400" />
    },
    {
      role: 'Salesperson',
      name: 'Raj Sharma (North Field)',
      email: 'raj@horlicks.com',
      desc: 'North geofence check-ins',
      icon: <CheckSquare size={16} className="text-red-400" />
    },
    {
      role: 'Salesperson',
      name: 'Vijay Iyer (South Field)',
      email: 'vijay@horlicks.com',
      desc: 'South geofence check-ins',
      icon: <CheckSquare size={16} className="text-pink-400" />
    }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-[480px] overflow-y-auto">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2 sticky top-0 bg-slate-900 pb-2">
        <span>⚡</span> Developer Quick Access Logs
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Log in instantly as any user node in the multi-region corporate structure to inspect dynamic scoping rules.
      </p>
      
      <div className="space-y-2">
        {accounts.map((acc, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(acc.email, 'password123')}
            className="w-full flex items-center gap-3 p-3 bg-slate-950/50 hover:bg-slate-800/80 border border-slate-850 hover:border-slate-700 rounded-lg text-left transition-all duration-200 cursor-pointer group"
          >
            <div className="p-2 rounded-md bg-slate-900 border border-slate-800 flex-shrink-0 group-hover:bg-slate-950 transition-colors">
              {acc.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 truncate">{acc.name}</span>
                <span className="text-[8px] bg-slate-800 text-slate-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  {acc.role}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{acc.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DemoSelector;
