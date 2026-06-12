import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import {
  Search, Filter, ChevronDown, ChevronUp, Image as ImageIcon,
  MapPin, AlertTriangle, CheckCircle, Clock, User, X,
  ArrowUpDown, Download, RefreshCw
} from 'lucide-react';

const LogsPage = ({ user }) => {
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [photoModal, setPhotoModal] = useState(null);

  const [search, setSearch] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterAnomaly, setFilterAnomaly] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [sortField, setSortField] = useState('timestamp');
  const [sortDir, setSortDir] = useState('desc');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, teamRes] = await Promise.all([
        api.get('/checkin/team'),
        api.get('/attendance/team'),
      ]);
      setLogs(logsRes.data || []);
      setEmployees((teamRes.data || []).filter(m => m.role === 'Salesperson'));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const derivedEmployees = useMemo(() => {
    if (employees.length > 0) return employees;
    return [...new Map(
      logs.filter(l => l.salespersonId?._id)
          .map(l => [l.salespersonId._id, l.salespersonId])
    ).values()];
  }, [employees, logs]);

  const processed = useMemo(() => {
    let data = [...logs];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(l =>
        (l.shopName||'').toLowerCase().includes(q) ||
        (l.address||'').toLowerCase().includes(q) ||
        (l.salespersonId?.name||'').toLowerCase().includes(q)
      );
    }
    if (filterEmployee !== 'all')
      data = data.filter(l => l.salespersonId?._id === filterEmployee || l.salespersonId === filterEmployee);
    if (filterAnomaly === 'anomaly') data = data.filter(l => l.isAnomaly);
    if (filterAnomaly === 'clean') data = data.filter(l => !l.isAnomaly);
    if (filterDate) {
      const d = new Date(filterDate);
      data = data.filter(l => new Date(l.timestamp).toDateString() === d.toDateString());
    }
    data.sort((a, b) => {
      let av = a[sortField], bv = b[sortField];
      if (sortField === 'timestamp') { av = new Date(av); bv = new Date(bv); }
      if (sortField === 'salesperson') { av = a.salespersonId?.name||''; bv = b.salespersonId?.name||''; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [logs, search, filterEmployee, filterAnomaly, filterDate, sortField, sortDir]);

  const SortIcon = ({ field }) => sortField !== field
    ? <ArrowUpDown size={10} className="text-slate-600 ml-1" />
    : sortDir === 'asc' ? <ChevronUp size={10} className="text-blue-400 ml-1" /> : <ChevronDown size={10} className="text-blue-400 ml-1" />;

  const photoSrc = (log) => log.imageBase64 ? `data:image/png;base64,${log.imageBase64}` : log.imageUrl || null;

  const handleExport = () => {
    const rows = [
      ['Timestamp','Salesperson','Shop','Address','Region','Outcome','Anomaly','Distance(m)','Summary'],
      ...processed.map(l => [
        new Date(l.timestamp).toLocaleString(),
        l.salespersonId?.name||'', l.shopName||'', l.address||'',
        l.region||'', l.outcome||'', l.isAnomaly?'Yes':'No',
        l.distance||'', (l.summary||l.notes||'').replace(/,/g,' ')
      ])
    ];
    const blob = new Blob([rows.map(r=>r.join(',')).join('\n')], {type:'text/csv'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='visit_logs.csv'; a.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Visit Logs</h2>
          <p className="text-xs text-slate-400 mt-0.5">{processed.length} of {logs.length} records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg px-3 py-2 transition-colors hover:border-slate-600">
            <RefreshCw size={12} /> Refresh
          </button>
          <button onClick={handleExport} className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 border border-blue-900 rounded-lg px-3 py-2 transition-colors hover:border-blue-700 hover:bg-blue-950/40">
            <Download size={12} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search shop, employee..." value={search} onChange={e=>setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-700" />
          {search && <button onClick={()=>setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"><X size={11}/></button>}
        </div>
        <div className="relative">
          <User size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
          <select value={filterEmployee} onChange={e=>setFilterEmployee(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-7 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-700 appearance-none cursor-pointer min-w-[160px]">
            <option value="all">All Employees</option>
            {derivedEmployees.map(emp=><option key={emp._id} value={emp._id}>{emp.name}</option>)}
          </select>
          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
        </div>
        <div className="relative">
          <Filter size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
          <select value={filterAnomaly} onChange={e=>setFilterAnomaly(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-7 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-700 appearance-none cursor-pointer">
            <option value="all">All Status</option>
            <option value="clean">Verified Only</option>
            <option value="anomaly">Anomalies Only</option>
          </select>
          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
        </div>
        <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-700" />
        {(search||filterEmployee!=='all'||filterAnomaly!=='all'||filterDate) && (
          <button onClick={()=>{setSearch('');setFilterEmployee('all');setFilterAnomaly('all');setFilterDate('');}}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><X size={11}/> Clear</button>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>
        ) : processed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Clock size={32} className="mb-3 opacity-30"/><p className="text-sm">No logs match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60">
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold uppercase tracking-wider w-14">Photo</th>
                  {[['timestamp','Time'],['salesperson','Employee'],['shopName','Shop']].map(([f,l])=>(
                    <th key={f} className="text-left px-4 py-3 text-slate-500 font-semibold uppercase tracking-wider cursor-pointer hover:text-slate-300 select-none" onClick={()=>handleSort(f)}>
                      <span className="flex items-center">{l}<SortIcon field={f}/></span>
                    </th>
                  ))}
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold uppercase tracking-wider">Region</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold uppercase tracking-wider">Outcome</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {processed.map((log,idx)=>{
                  const src=photoSrc(log);
                  const name=typeof log.salespersonId==='object'?log.salespersonId?.name:log.salespersonId||'—';
                  const isSelected=selectedLog?._id===log._id;
                  return (
                    <React.Fragment key={log._id||idx}>
                      <tr className={`border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors cursor-pointer ${isSelected?'bg-slate-800/50':''}`}
                        onClick={()=>setSelectedLog(isSelected?null:log)}>
                        <td className="px-4 py-3">
                          {src?(
                            <button onClick={e=>{e.stopPropagation();setPhotoModal(src);}}
                              className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 hover:border-blue-500 transition-colors block">
                              <img src={src} alt="visit" className="w-full h-full object-cover"/>
                            </button>
                          ):(
                            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-600"><ImageIcon size={14}/></div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                          <div className="font-medium text-slate-300">{new Date(log.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                          <div className="text-[10px] text-slate-600">{new Date(log.timestamp).toLocaleDateString([],{month:'short',day:'numeric'})}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-blue-900/50 border border-blue-800 flex items-center justify-center text-[9px] font-bold text-blue-400 flex-shrink-0">{(name||'?')[0].toUpperCase()}</span>
                            <span className="text-slate-300 font-medium">{name}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-200 font-medium">{log.shopName||'—'}</div>
                          <div className="text-[10px] text-slate-600 truncate max-w-[160px]">{log.address||''}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{log.region||'—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${log.outcome==='Sale'?'bg-emerald-950/50 text-emerald-400 border-emerald-900':log.outcome==='Follow-up'?'bg-blue-950/50 text-blue-400 border-blue-900':'bg-slate-800 text-slate-500 border-slate-700'}`}>
                            {log.outcome||'Visit'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {log.isAnomaly?(
                            <span className="flex items-center gap-1 text-red-400 text-[10px] font-semibold"><AlertTriangle size={10}/>Anomaly{log.distance?<span className="text-red-600">+{log.distance}m</span>:null}</span>
                          ):(
                            <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-semibold"><CheckCircle size={10}/>Verified</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={e=>{e.stopPropagation();setSelectedLog(isSelected?null:log);}} className="text-slate-500 hover:text-blue-400 transition-colors">
                            {isSelected?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
                          </button>
                        </td>
                      </tr>
                      {isSelected&&(
                        <tr className="bg-slate-800/20 border-b border-slate-800">
                          <td colSpan={8} className="px-5 py-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div className="w-full h-52 bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                                {photoSrc(log)?(
                                  <img src={photoSrc(log)} alt={log.shopName} className="w-full h-full object-cover cursor-zoom-in" onClick={()=>setPhotoModal(photoSrc(log))}/>
                                ):(
                                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-600"><ImageIcon size={28} className="mb-2"/><span className="text-xs">No photo</span></div>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs content-start">
                                {[
                                  ['Contact',log.contactName],['Products',Array.isArray(log.products)?log.products.join(', '):log.products],
                                  ['Alert Status',log.anomalyStatus],['Distance Deviation',log.distance?`${log.distance}m`:null],
                                  ['Lat',log.location?.coordinates?.[1]?.toFixed(6)],['Lng',log.location?.coordinates?.[0]?.toFixed(6)],
                                ].map(([k,v])=>(
                                  <div key={k} className="bg-slate-950/50 rounded-lg p-2.5 border border-slate-800">
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">{k}</span>
                                    <span className="font-semibold text-slate-300 mt-0.5 block">{v||'—'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {(log.summary||log.notes)&&(
                              <div className="mt-3 bg-slate-950/50 rounded-lg p-3 border border-slate-800">
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Summary</span>
                                <p className="text-slate-300 text-xs leading-relaxed">"{log.summary||log.notes}"</p>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {photoModal&&(
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4" onClick={()=>setPhotoModal(null)}>
          <div className="relative max-w-3xl max-h-[90vh] w-full">
            <button className="absolute top-3 right-3 bg-black/60 text-white rounded-full p-1.5 hover:bg-black z-10" onClick={()=>setPhotoModal(null)}><X size={18}/></button>
            <img src={photoModal} alt="Full photo" className="w-full h-full object-contain rounded-xl max-h-[90vh]" onClick={e=>e.stopPropagation()}/>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogsPage;
