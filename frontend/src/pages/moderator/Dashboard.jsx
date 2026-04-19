/**
 * Manager Dashboard — Department-Aware
 * Tabs: Tasks | Manager Chat | Employee Reports | Analytics
 * Reads user.department from Redux to show relevant UI.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { taskAPI, deptMessagesAPI } from '../../services/api';

// ─── Per-department configuration ─────────────────────────────────────────
const DEPT_CONFIG = {
  marketplace: {
    label: 'Marketplace',
    color: 'from-[#8B7355] to-[#6F5C44]',
    icon: '🛒',
    description: 'Book listings, seller verification, and catalog quality',
    taskTypeLabels: {
      book_upload: 'Book Upload Review',
      seller_verification: 'Seller Verification',
      manual: 'Manual Task',
    },
  },
  support: {
    label: 'Support',
    color: 'from-[#4A5D4F] to-[#3A4D3F]',
    icon: '💬',
    description: 'Customer complaints, buyer issues, and dispute resolution',
    taskTypeLabels: {
      complaint: 'Customer Complaint',
      manual: 'Manual Task',
    },
  },
  finance: {
    label: 'Finance',
    color: 'from-[#C9A96E] to-[#9D7F4F]',
    icon: '💰',
    description: 'Refunds, payouts, payment failures, and financial audits',
    taskTypeLabels: {
      refund_request: 'Refund Request',
      payout_request: 'Payout Request',
      payment_failure: 'Payment Failure',
      manual: 'Manual Task',
    },
  },
  tech: {
    label: 'Tech',
    color: 'from-[#4A4A4A] to-[#2C2C2C]',
    icon: '⚙️',
    description: 'Bug reports, server errors, payment gateway issues',
    taskTypeLabels: {
      bug_report: 'Bug Report',
      server_error: 'Server Error',
      payment_failure: 'Payment Failure',
      manual: 'Manual Task',
    },
  },
};
const STATUS_COLORS = {
  pending: 'bg-background-secondary text-text-secondary',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  escalated: 'bg-red-100 text-red-700',
};

const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-orange-100 text-orange-600',
  high: 'bg-red-100 text-red-600',
  critical: 'bg-red-200 text-red-800 font-semibold',
};

const ALL_DEPARTMENTS = ['marketplace', 'support', 'finance', 'tech'];

function Badge({ text, colorClass }) {
  return <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${colorClass}`}>{text}</span>;
}

// ══════════════════════════════════════════════════════════════════
// TAB: TASKS
// ══════════════════════════════════════════════════════════════════
function TasksTab({ department }) {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [escalateModal, setEscalateModal] = useState(null);
  const [escalateTarget, setEscalateTarget] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [msg, setMsg] = useState('');
  const cfg = DEPT_CONFIG[department] || {};

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, eRes] = await Promise.all([
        taskAPI.getTasks(statusFilter ? { status: statusFilter } : {}),
        taskAPI.getEmployees(),
      ]);
      setTasks(tRes.data.data.tasks || []);
      setEmployees(eRes.data.data.employees || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const autoAssign = async (id) => {
    try { await taskAPI.autoAssignTask(id); flash('Auto-assigned to least-busy employee.'); load(); }
    catch (err) { flash(err.response?.data?.message || 'Assignment failed'); }
  };

  const manualAssign = async (id, empId) => {
    try { await taskAPI.assignTask(id, empId); flash('Task assigned.'); load(); }
    catch (err) { flash(err.response?.data?.message || 'Assignment failed'); }
  };

  const doEscalate = async () => {
    if (!escalateTarget || !escalateReason) return;
    try {
      await taskAPI.escalateTask(escalateModal._id, escalateTarget, escalateReason);
      flash(`Escalated to ${DEPT_CONFIG[escalateTarget]?.label || escalateTarget} department.`);
      setEscalateModal(null); setEscalateTarget(''); setEscalateReason('');
      load();
    } catch (err) { flash(err.response?.data?.message || 'Escalation failed'); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-text-primary">{cfg.icon} {cfg.label} Tasks</h2>
        <div className="ml-auto flex flex-wrap gap-2">
          {['', 'pending', 'assigned', 'in_progress', 'resolved', 'escalated'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs border transition ${
                statusFilter === s ? 'bg-accent-brown text-white border-accent-brown' : 'border-border-primary text-text-secondary hover:bg-background-secondary'
              }`}>
              {s ? s.replace('_', ' ') : 'All'}
            </button>
          ))}
        </div>
      </div>
      {msg && <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">{msg}</div>}
      {loading ? (
        <div className="text-center py-10 text-text-light">Loading tasks…</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-10 text-text-light">No tasks found.</div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task._id} className="bg-white border border-border-light rounded-lg p-4 shadow-sm">
              <div className="flex flex-wrap gap-2 items-start mb-2">
                <span className="font-medium text-text-primary flex-1">{task.title}</span>
                <Badge text={task.status.replace('_',' ')} colorClass={STATUS_COLORS[task.status] || ''} />
                <Badge text={task.priority} colorClass={PRIORITY_COLORS[task.priority] || ''} />
              </div>
              <p className="text-sm text-text-tertiary mb-2">{task.description}</p>
              <div className="flex flex-wrap gap-x-4 text-xs text-text-light mb-3">
                <span>Type: {cfg.taskTypeLabels?.[task.eventType] || task.eventType}</span>
                {task.assignedTo && <span>Assigned: <strong>{task.assignedTo.name || task.assignedTo.email}</strong></span>}
                <span>{new Date(task.createdAt).toLocaleDateString()}</span>
              </div>
              {task.status === 'pending' && (
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => autoAssign(task._id)}
                    className="px-3 py-1 rounded bg-accent-brown text-white text-xs hover:bg-accent-brown-hover">
                    Auto-Assign (Least Workload)
                  </button>
                  <select className="border border-border-primary rounded px-2 py-1 text-xs"
                    defaultValue=""
                    onChange={(e) => e.target.value && manualAssign(task._id, e.target.value)}>
                    <option value="">Manual assign…</option>
                    {employees.map((e) => (
                      <option key={e._id} value={e._id}>{e.name} ({e.activeTasks} active)</option>
                    ))}
                  </select>
                </div>
              )}
              {['assigned','in_progress'].includes(task.status) && (
                <button onClick={() => { setEscalateModal(task); setEscalateTarget(''); setEscalateReason(''); }}
                  className="mt-2 px-3 py-1 rounded border border-red-300 text-red-600 text-xs hover:bg-red-50">
                  Escalate to Another Department
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {escalateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-text-primary mb-4">Escalate: {escalateModal.title}</h3>
            <label className="block text-sm font-medium text-text-secondary mb-1">Target Department</label>
            <select value={escalateTarget} onChange={(e) => setEscalateTarget(e.target.value)}
              className="w-full border border-border-primary rounded px-3 py-2 mb-3 text-sm">
              <option value="">Select department…</option>
              {ALL_DEPARTMENTS.filter((d) => d !== department).map((d) => (
                <option key={d} value={d}>{DEPT_CONFIG[d]?.label || d}</option>
              ))}
            </select>
            <label className="block text-sm font-medium text-text-secondary mb-1">Reason</label>
            <textarea value={escalateReason} onChange={(e) => setEscalateReason(e.target.value)}
              rows={3} className="w-full border border-border-primary rounded px-3 py-2 text-sm mb-4 resize-none"
              placeholder="Why does this need escalation?" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEscalateModal(null)} className="px-4 py-2 rounded border text-sm">Cancel</button>
              <button onClick={doEscalate} disabled={!escalateTarget || !escalateReason}
                className="px-4 py-2 rounded bg-red-600 text-white text-sm disabled:opacity-50">
                Escalate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: MANAGER CHAT
// ══════════════════════════════════════════════════════════════════
function ManagerChatTab({ userDept }) {
  const [view, setView] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [compose, setCompose] = useState({ toDepartment: '', subject: '', body: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3500); };

  const load = useCallback(async (type) => {
    setLoading(true);
    try {
      const res = await deptMessagesAPI.getManagerMessages(type !== 'compose' ? type : undefined);
      setMessages(res.data.data.messages || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (view !== 'compose') load(view); }, [view, load]);

  const sendReply = async (id) => {
    if (!replyText.trim()) return;
    try {
      await deptMessagesAPI.replyManagerMessage(id, replyText);
      flash('Reply sent.'); setReplyText(''); setSelected(null); load(view);
    } catch { flash('Reply failed'); }
  };

  const sendCompose = async () => {
    if (!compose.toDepartment || !compose.subject || !compose.body) return;
    try {
      await deptMessagesAPI.sendManagerMessage(compose);
      flash('Message sent!'); setCompose({ toDepartment: '', subject: '', body: '' }); setView('sent');
    } catch (err) { flash(err.response?.data?.message || 'Failed to send'); }
  };

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {[['inbox','📥 Inbox'],['sent','📤 Sent'],['compose','✉️ Compose']].map(([v, lbl]) => (
          <button key={v} onClick={() => { setView(v); setSelected(null); }}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              view === v ? 'bg-accent-brown text-white' : 'bg-background-secondary text-text-secondary hover:bg-border-light'
            }`}>{lbl}</button>
        ))}
      </div>
      {msg && <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">{msg}</div>}

      {view === 'compose' ? (
        <div className="bg-white border border-border-light rounded-lg p-5 max-w-lg">
          <h2 className="text-base font-semibold text-text-primary mb-4">New Inter-Department Message</h2>
          <label className="block text-sm font-medium text-text-secondary mb-1">To Department</label>
          <select value={compose.toDepartment}
            onChange={(e) => setCompose({ ...compose, toDepartment: e.target.value })}
            className="w-full border border-border-primary rounded px-3 py-2 mb-3 text-sm">
            <option value="">Select department…</option>
            {ALL_DEPARTMENTS.filter((d) => d !== userDept).map((d) => (
              <option key={d} value={d}>{DEPT_CONFIG[d]?.label || d}</option>
            ))}
          </select>
          <label className="block text-sm font-medium text-text-secondary mb-1">Subject</label>
          <input type="text" value={compose.subject}
            onChange={(e) => setCompose({ ...compose, subject: e.target.value })}
            className="w-full border border-border-primary rounded px-3 py-2 mb-3 text-sm" placeholder="Subject…" />
          <label className="block text-sm font-medium text-text-secondary mb-1">Message</label>
          <textarea rows={5} value={compose.body}
            onChange={(e) => setCompose({ ...compose, body: e.target.value })}
            className="w-full border border-border-primary rounded px-3 py-2 mb-4 text-sm resize-none" placeholder="Write your message…" />
          <button onClick={sendCompose}
            disabled={!compose.toDepartment || !compose.subject || !compose.body}
            className="px-5 py-2 rounded bg-accent-brown text-white text-sm disabled:opacity-50">
            Send Message
          </button>
        </div>
      ) : loading ? (
        <div className="text-center py-10 text-text-light">Loading…</div>
      ) : (
        <div className="flex gap-4">
          <div className="w-2/5 space-y-2">
            {messages.length === 0 && <div className="text-center py-8 text-text-light text-sm">No messages.</div>}
            {messages.map((m) => (
              <div key={m._id + (m.direction||'')} onClick={() => setSelected(m)}
                className={`p-3 rounded-lg border cursor-pointer transition ${
                  selected?._id === m._id ? 'border-accent-brown/40 bg-accent-brown/10' : 'border-border-light hover:bg-background-secondary'
                }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-text-light">{m.direction === 'sent' ? '→' : '←'}</span>
                  <span className="text-sm font-medium text-text-primary truncate flex-1">
                    {m.direction === 'sent'
                      ? `To: ${m.toManager?.name || m.toManager?.email} (${m.toManager?.department})`
                      : `From: ${m.fromManager?.name || m.fromManager?.email} (${m.fromManager?.department})`}
                  </span>
                </div>
                <p className="text-xs text-text-secondary truncate">{m.subject}</p>
                <p className="text-xs text-text-light">{new Date(m.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
          {selected ? (
            <div className="flex-1 bg-white border border-border-light rounded-lg p-5">
              <h3 className="font-semibold text-text-primary mb-1">{selected.subject}</h3>
              <p className="text-xs text-text-light mb-3">
                {selected.fromManager?.name} ({selected.fromManager?.department}) → {selected.toManager?.name} ({selected.toManager?.department})
              </p>
              <p className="text-sm text-text-secondary whitespace-pre-wrap mb-4">{selected.body}</p>
              {(selected.replies || []).map((r, i) => (
                <div key={i} className="bg-background-secondary rounded p-2 text-sm mb-1">
                  <span className="font-medium text-text-secondary">{r.from?.name || 'Unknown'}: </span>
                  <span className="text-text-secondary">{r.body}</span>
                </div>
              ))}
              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
                rows={3} className="w-full border border-border-light rounded px-3 py-2 text-sm resize-none mt-3 mb-2"
                placeholder="Write a reply…" />
              <button onClick={() => sendReply(selected._id)} disabled={!replyText.trim()}
                className="px-4 py-2 rounded bg-accent-brown text-white text-sm disabled:opacity-50">Reply</button>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-light text-sm">
              Select a message to view
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: EMPLOYEE REPORTS
// ══════════════════════════════════════════════════════════════════
function EmployeeReportsTab() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [response, setResponse] = useState('');
  const [msg, setMsg] = useState('');
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3500); };

  const load = async () => {
    setLoading(true);
    try {
      const res = await deptMessagesAPI.getEmployeeReports();
      setReports(res.data.data.reports || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const respond = async (id) => {
    if (!response.trim()) return;
    try {
      await deptMessagesAPI.respondToReport(id, response);
      flash('Response sent!'); setResponse(''); setSelected(null); load();
    } catch { flash('Failed to respond'); }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-text-primary mb-4">📋 Employee Reports</h2>
      {msg && <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">{msg}</div>}
      {loading ? (
        <div className="text-center py-10 text-text-light">Loading…</div>
      ) : (
        <div className="flex gap-4">
          <div className="w-2/5 space-y-2">
            {reports.length === 0 && <div className="text-center py-8 text-text-light text-sm">No reports yet.</div>}
            {reports.map((r) => (
              <div key={r._id} onClick={() => { setSelected(r); setResponse(''); }}
                className={`p-3 rounded-lg border cursor-pointer transition ${
                  selected?._id === r._id ? 'border-accent-brown/40 bg-accent-brown/10' : 'border-border-light hover:bg-background-secondary'
                }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-text-primary truncate flex-1">{r.subject}</span>
                  <Badge text={r.status}
                    colorClass={r.status === 'resolved' ? 'bg-green-100 text-green-700' : r.status === 'acknowledged' ? 'bg-blue-100 text-blue-700' : 'bg-background-secondary text-text-secondary'} />
                </div>
                <p className="text-xs text-text-tertiary">From: {r.fromEmployee?.name || r.fromEmployee?.email}</p>
                <p className="text-xs text-text-light">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
          {selected ? (
            <div className="flex-1 bg-white border border-border-light rounded-lg p-5">
              <h3 className="font-semibold text-text-primary mb-1">{selected.subject}</h3>
              <p className="text-xs text-text-light mb-3">
                From: {selected.fromEmployee?.name} ({selected.fromEmployee?.email}) — {new Date(selected.createdAt).toLocaleString()}
              </p>
              <p className="text-sm text-text-secondary whitespace-pre-wrap mb-4">{selected.body}</p>
              {selected.managerResponse ? (
                <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
                  <strong>Your response:</strong> {selected.managerResponse}
                </div>
              ) : (
                <>
                  <textarea value={response} onChange={(e) => setResponse(e.target.value)}
                    rows={3} className="w-full border border-border-light rounded px-3 py-2 text-sm resize-none mb-2"
                    placeholder="Write your response…" />
                  <button onClick={() => respond(selected._id)} disabled={!response.trim()}
                    className="px-4 py-2 rounded bg-accent-brown text-white text-sm disabled:opacity-50">
                    Send Response
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-light text-sm">
              Select a report to respond
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: ANALYTICS
// ══════════════════════════════════════════════════════════════════
function AnalyticsTab({ department }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const cfg = DEPT_CONFIG[department] || {};

  useEffect(() => {
    taskAPI.getStats()
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-10 text-text-light">Loading analytics…</div>;
  if (!stats) return <div className="text-center py-10 text-text-light">No data.</div>;

  const statusCards = [
    { label: 'Pending',     value: stats.byStatus?.pending     || 0, color: 'bg-background-secondary   border-border-light   text-text-secondary'  },
    { label: 'Assigned',    value: stats.byStatus?.assigned    || 0, color: 'bg-blue-50   border-blue-200   text-blue-700'  },
    { label: 'In Progress', value: stats.byStatus?.in_progress || 0, color: 'bg-yellow-50 border-yellow-200 text-yellow-700'},
    { label: 'Resolved',    value: stats.byStatus?.resolved    || 0, color: 'bg-green-50  border-green-200  text-green-700' },
    { label: 'Escalated',   value: stats.byStatus?.escalated   || 0, color: 'bg-red-50    border-red-200    text-red-700'   },
  ];

  const total    = Object.values(stats.byStatus || {}).reduce((a, b) => a + b, 0);
  const resolved = stats.byStatus?.resolved || 0;
  const rate     = total > 0 ? ((resolved / total) * 100).toFixed(1) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-text-primary">{cfg.icon} {cfg.label} Analytics</h2>
        <span className="text-sm text-text-tertiary">
          Resolution rate: <strong className="text-green-600">{rate}%</strong>
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {statusCards.map((c) => (
          <div key={c.label} className={`border rounded-lg p-4 text-center ${c.color}`}>
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-xs mt-1">{c.label}</div>
          </div>
        ))}
      </div>
      {stats.employeePerformance?.length > 0 && (
        <>
          <h3 className="text-base font-semibold text-text-secondary mb-3">Employee Performance</h3>
          <div className="overflow-x-auto rounded-lg border border-border-light">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background-secondary text-left text-text-tertiary text-xs uppercase">
                  <th className="px-4 py-2">Employee</th>
                  <th className="px-4 py-2 text-center">Active</th>
                  <th className="px-4 py-2 text-center">Resolved</th>
                  <th className="px-4 py-2 text-center">Total</th>
                  <th className="px-4 py-2 text-center">Rate</th>
                </tr>
              </thead>
              <tbody>
                {stats.employeePerformance.map((emp) => (
                  <tr key={emp._id} className="border-t hover:bg-background-secondary">
                    <td className="px-4 py-2">
                      <div className="font-medium text-text-primary">{emp.name || 'N/A'}</div>
                      <div className="text-xs text-text-light">{emp.email || emp._id}</div>
                    </td>
                    <td className="px-4 py-2 text-center text-yellow-600 font-medium">{emp.activeTasks}</td>
                    <td className="px-4 py-2 text-center text-green-600 font-medium">{emp.resolvedTasks}</td>
                    <td className="px-4 py-2 text-center text-text-secondary">{emp.totalTasks}</td>
                    <td className="px-4 py-2 text-center">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        {emp.totalTasks > 0 ? ((emp.resolvedTasks / emp.totalTasks) * 100).toFixed(0) : 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ROOT COMPONENT
// ══════════════════════════════════════════════════════════════════
export default function ManagerDashboard() {
  const user = useSelector((state) => state.auth.user);
  const department = user?.department || 'marketplace';
  const cfg = DEPT_CONFIG[department] || DEPT_CONFIG.marketplace;

  const TABS = [
    { id: 'tasks',    label: `${cfg.icon} Tasks`          },
    { id: 'chat',     label: '🗨 Manager Chat'             },
    { id: 'reports',  label: '📋 Employee Reports'         },
    { id: 'analytics',label: '📊 Analytics'                },
  ];
  const [activeTab, setActiveTab] = useState('tasks');

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <div className={`bg-gradient-to-r ${cfg.color} text-white`}>
        <div className="container-custom py-6">
          <h1 className="text-2xl font-bold mb-1">{cfg.icon} {cfg.label} Manager Dashboard</h1>
          <p className="text-sm opacity-80">{cfg.description}</p>
          <p className="text-xs opacity-60 mt-1">{user?.name || user?.email}</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-background-primary border-b border-border-light sticky top-0 z-10">
        <div className="container-custom flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'border-accent-brown text-accent-brown'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-8">
        {activeTab === 'tasks'     && <TasksTab department={department} />}
        {activeTab === 'chat'      && <ManagerChatTab userDept={department} />}
        {activeTab === 'reports'   && <EmployeeReportsTab />}
        {activeTab === 'analytics' && <AnalyticsTab department={department} />}
      </div>
    </div>
  );
}
