/**
 * Employee Dashboard — Department-Aware
 * Tabs: My Tasks | Report to Manager
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { taskAPI, deptMessagesAPI } from '../../services/api';

const DEPT_CONFIG = {
  marketplace: { label: 'Marketplace', color: 'from-[#8B7355] to-[#6F5C44]', icon: '🛒', description: 'Book listings, seller verification, catalog quality' },
  support:     { label: 'Support',     color: 'from-[#4A5D4F] to-[#3A4D3F]', icon: '💬', description: 'Customer complaints, buyer issues, dispute resolution' },
  finance:     { label: 'Finance',     color: 'from-[#C9A96E] to-[#9D7F4F]', icon: '💰', description: 'Refunds, payouts, payment failures' },
  tech:        { label: 'Tech',        color: 'from-[#4A4A4A] to-[#2C2C2C]', icon: '⚙️', description: 'Bug reports, server errors, platform issues' },
};

const STATUS_COLORS = { pending:'bg-background-secondary text-text-secondary', assigned:'bg-blue-100 text-blue-700', in_progress:'bg-yellow-100 text-yellow-700', resolved:'bg-green-100 text-green-700', escalated:'bg-red-100 text-red-700' };
const PRIORITY_COLORS = { low:'bg-slate-100 text-slate-600', medium:'bg-orange-100 text-orange-600', high:'bg-red-100 text-red-600', critical:'bg-red-200 text-red-800 font-semibold' };
const NEXT_STATUS = { assigned:{ next:'in_progress', label:'▶ Start Task' }, in_progress:{ next:'resolved', label:'✅ Mark Resolved' } };

function Badge({ text, colorClass }) {
  return <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${colorClass}`}>{text}</span>;
}

function MyTasksTab({ department }) {
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});
  const [msg, setMsg] = useState('');
  const cfg = DEPT_CONFIG[department] || {};
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await taskAPI.getTasks(statusFilter ? { status: statusFilter } : {});
      setTasks(res.data.data.tasks || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (taskId, newStatus) => {
    try {
      await taskAPI.updateStatus(taskId, newStatus, notes[taskId] || '');
      flash(newStatus === 'in_progress' ? 'Task started!' : 'Task resolved!');
      load();
    } catch (err) { flash(err.response?.data?.message || 'Update failed'); }
  };

  const active   = tasks.filter((t) => ['assigned','in_progress'].includes(t.status));
  const resolved = tasks.filter((t) => t.status === 'resolved');

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <h2 className="text-lg font-semibold text-text-primary">{cfg.icon} My {cfg.label} Tasks</h2>
        <div className="ml-auto flex flex-wrap gap-2">
          {['','assigned','in_progress','resolved'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1 rounded-full text-xs border transition ${statusFilter===s?'bg-accent-brown text-white border-accent-brown':'border-border-primary text-text-secondary hover:bg-background-secondary'}`}>
              {s ? s.replace('_',' ') : 'All'}
            </button>
          ))}
        </div>
      </div>
      {msg && <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">{msg}</div>}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[{label:'Active',value:active.length,color:'bg-blue-50 border-blue-200 text-blue-700'},{label:'Resolved',value:resolved.length,color:'bg-green-50 border-green-200 text-green-700'},{label:'Total',value:tasks.length,color:'bg-background-secondary border-border-light text-text-secondary'}].map((c) => (
          <div key={c.label} className={`border rounded-lg p-3 text-center ${c.color}`}>
            <div className="text-xl font-bold">{c.value}</div>
            <div className="text-xs mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>
      {loading ? <div className="text-center py-10 text-text-light">Loading tasks…</div> : tasks.length===0 ? <div className="text-center py-10 text-text-light">No tasks assigned yet.</div> : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const action = NEXT_STATUS[task.status];
            return (
              <div key={task._id} className="bg-white border border-border-light rounded-lg p-4 shadow-sm">
                <div className="flex flex-wrap gap-2 items-start mb-2">
                  <span className="font-medium text-text-primary flex-1">{task.title}</span>
                  <Badge text={task.status.replace('_',' ')} colorClass={STATUS_COLORS[task.status]||''} />
                  <Badge text={task.priority} colorClass={PRIORITY_COLORS[task.priority]||''} />
                </div>
                <p className="text-sm text-text-tertiary mb-2">{task.description}</p>
                <div className="text-xs text-text-light mb-3">{new Date(task.createdAt).toLocaleDateString()}{task.completedAt && ` · Completed: ${new Date(task.completedAt).toLocaleDateString()}`}</div>
                {action && (
                  <div className="flex flex-wrap items-end gap-2">
                    {task.status==='in_progress' && (
                      <textarea rows={2} value={notes[task._id]||''} onChange={(e)=>setNotes({...notes,[task._id]:e.target.value})} className="flex-1 border border-border-light rounded px-2 py-1 text-xs resize-none" placeholder="Completion notes (optional)…" />
                    )}
                    <button onClick={()=>updateStatus(task._id,action.next)} className={`px-4 py-1.5 rounded text-white text-xs font-medium ${action.next==='resolved'?'bg-green-600 hover:bg-green-700':'bg-accent-brown hover:bg-accent-brown-hover'}`}>{action.label}</button>
                  </div>
                )}
                {task.status==='escalated' && <div className="text-xs text-red-500 mt-2">⬆ Escalated — {task.escalationReason}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReportTab() {
  const [reports, setReports] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ subject:'', body:'', relatedTaskId:'' });
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');
  const flash = (m) => { setMsg(m); setTimeout(()=>setMsg(''), 3500); };

  const loadData = async () => {
    setLoading(true);
    try {
      const [rRes,tRes] = await Promise.all([deptMessagesAPI.getMyReports(), taskAPI.getTasks({status:'in_progress'})]);
      setReports(rRes.data.data.reports||[]);
      setTasks(tRes.data.data.tasks||[]);
    } catch(err){console.error(err);} finally{setLoading(false);}
  };

  useEffect(()=>{ loadData(); },[]);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await deptMessagesAPI.sendReport(form);
      flash('Report sent to your manager!');
      setForm({subject:'',body:'',relatedTaskId:''});
      loadData();
    } catch(err){ flash(err.response?.data?.message||'Failed to send'); } finally{ setSending(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">📝 Send Report to Manager</h2>
        {msg && <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">{msg}</div>}
        <form onSubmit={submit} className="bg-white border border-border-light rounded-lg p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Subject</label>
            <input type="text" value={form.subject} onChange={(e)=>setForm({...form,subject:e.target.value})} className="w-full border border-border-primary rounded px-3 py-2 text-sm" placeholder="Brief subject…" required />
          </div>
          {tasks.length>0 && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Related Task (optional)</label>
              <select value={form.relatedTaskId} onChange={(e)=>setForm({...form,relatedTaskId:e.target.value})} className="w-full border border-border-primary rounded px-3 py-2 text-sm">
                <option value="">None</option>
                {tasks.map((t)=><option key={t._id} value={t._id}>{t.title}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Details</label>
            <textarea rows={5} value={form.body} onChange={(e)=>setForm({...form,body:e.target.value})} className="w-full border border-border-primary rounded px-3 py-2 text-sm resize-none" placeholder="Describe your issue, request, or update…" required />
          </div>
          <button type="submit" disabled={sending} className="px-5 py-2 rounded bg-accent-brown text-white text-sm disabled:opacity-50 hover:bg-accent-brown-hover">{sending?'Sending…':'Send Report'}</button>
        </form>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">📋 My Previous Reports</h2>
        {loading ? <div className="text-center py-10 text-text-light">Loading…</div> : reports.length===0 ? <div className="text-center py-10 text-text-light">No reports yet.</div> : (
          <div className="space-y-3">
            {reports.map((r)=>(
              <div key={r._id} className="bg-white border border-border-light rounded-lg p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-medium text-text-primary text-sm">{r.subject}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${r.status==='resolved'?'bg-green-100 text-green-700':r.status==='acknowledged'?'bg-blue-100 text-blue-700':'bg-background-secondary text-text-secondary'}`}>{r.status}</span>
                </div>
                <p className="text-xs text-text-tertiary mb-2 line-clamp-2">{r.body}</p>
                <p className="text-xs text-text-light">{new Date(r.createdAt).toLocaleString()}</p>
                {r.managerResponse && <div className="mt-2 p-2 bg-accent-brown/10 border border-accent-brown/20 rounded text-xs text-text-primary"><strong>Manager:</strong> {r.managerResponse}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const user = useSelector((state) => state.auth.user);
  const department = user?.department || 'marketplace';
  const cfg = DEPT_CONFIG[department] || DEPT_CONFIG.marketplace;
  const TABS = [{ id:'tasks', label:`${cfg.icon} My Tasks` },{ id:'report', label:'📝 Report to Manager' }];
  const [activeTab, setActiveTab] = useState('tasks');

  return (
    <div className="min-h-screen bg-background-primary">
      <div className={`bg-gradient-to-r ${cfg.color} text-white`}>
        <div className="container-custom py-6">
          <h1 className="text-2xl font-bold mb-1">{cfg.icon} {cfg.label} Employee Dashboard</h1>
          <p className="text-sm opacity-80">{cfg.description}</p>
          <p className="text-xs opacity-60 mt-1">{user?.name || user?.email}</p>
        </div>
      </div>
      <div className="bg-background-primary border-b border-border-light sticky top-0 z-10">
        <div className="container-custom flex gap-1">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${activeTab===tab.id?'border-accent-brown text-accent-brown':'border-transparent text-text-tertiary hover:text-text-secondary'}`}>{tab.label}</button>
          ))}
        </div>
      </div>
      <div className="container-custom py-8">
        {activeTab==='tasks'  && <MyTasksTab department={department} />}
        {activeTab==='report' && <ReportTab />}
      </div>
    </div>
  );
}
