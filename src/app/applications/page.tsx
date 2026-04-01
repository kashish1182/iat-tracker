'use client';
import { useEffect, useState, useCallback } from 'react';

interface Application {
  id: number; status: string; applied_date: string; source: string; notes: string;
  job_id: number; job_title: string; role_type: string; job_location: string;
  posting_url: string; deadline: string; company_id: number; company_name: string;
  industry: string; interview_count: number; latest_interview: string;
}
interface Company { id: number; name: string; }
interface JobPosting { id: number; title: string; company_name: string; }

const STATUSES = ['Wishlist','Applied','Phone Screen','Interview','Offer','Rejected','Withdrawn','Accepted'];
const SOURCES  = ['LinkedIn','Handshake','Company Website','Indeed','Referral','Career Fair','AngelList','Other'];

function badgeClass(s: string) {
  const map: Record<string,string> = {
    Applied:'badge-applied','Phone Screen':'badge-phone-screen',Interview:'badge-interview',
    Offer:'badge-offer',Accepted:'badge-accepted',Rejected:'badge-rejected',
    Withdrawn:'badge-withdrawn',Wishlist:'badge-wishlist',
  };
  return `badge ${map[s]||'badge-applied'}`;
}
function fmtDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}
function daysUntil(d: string) {
  const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  if (days < 0) return <span style={{color:'var(--text3)',fontFamily:'var(--font-mono)',fontSize:'0.75rem'}}>Past</span>;
  if (days === 0) return <span style={{color:'var(--red)',fontFamily:'var(--font-mono)',fontSize:'0.75rem'}}>Today!</span>;
  const color = days <= 3 ? 'var(--red)' : days <= 7 ? 'var(--orange)' : 'var(--text2)';
  return <span style={{color,fontFamily:'var(--font-mono)',fontSize:'0.75rem'}}>{days}d left</span>;
}

const emptyForm = { job_posting_id:'', status:'Applied', applied_date: new Date().toISOString().slice(0,10), source:'', notes:'' };

export default function ApplicationsPage() {
  const [apps, setApps]         = useState<Application[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs]         = useState<JobPosting[]>([]);
  const [loading, setLoading]   = useState(true);

  // Filters
  const [search,     setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterFrom,   setFilterFrom]   = useState('');
  const [filterTo,     setFilterTo]     = useState('');

  // Modal state
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editApp,     setEditApp]     = useState<Application | null>(null);
  const [form,        setForm]        = useState({ ...emptyForm });
  const [saving,      setSaving]      = useState(false);

  // Interview modal
  const [ivModalOpen, setIvModalOpen] = useState(false);
  const [ivAppId,     setIvAppId]     = useState<number|null>(null);
  const [ivForm,      setIvForm]      = useState({ round:'1', interview_date:'', interview_type:'Phone', notes:'', outcome:'Pending' });

  const fetchApps = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search)       params.set('search', search);
    if (filterStatus) params.set('status', filterStatus);
    if (filterSource) params.set('source', filterSource);
    if (filterFrom)   params.set('date_from', filterFrom);
    if (filterTo)     params.set('date_to', filterTo);
    const data = await fetch(`/api/applications?${params}`).then(r => r.json());
    setApps(data);
    setLoading(false);
  }, [search, filterStatus, filterSource, filterFrom, filterTo]);

  useEffect(() => { fetchApps(); }, [fetchApps]);
  useEffect(() => {
    fetch('/api/companies').then(r=>r.json()).then(setCompanies);
    fetch('/api/jobs').then(r=>r.json()).then(setJobs);
  }, []);

  function openNew() { setEditApp(null); setForm({...emptyForm}); setModalOpen(true); }
  function openEdit(a: Application) {
    setEditApp(a);
    setForm({ job_posting_id: String(a.job_id), status: a.status, applied_date: a.applied_date?.slice(0,10)||'', source: a.source||'', notes: a.notes||'' });
    setModalOpen(true);
  }
  async function saveApp() {
    setSaving(true);
    const method = editApp ? 'PUT' : 'POST';
    const url    = editApp ? `/api/applications/${editApp.id}` : '/api/applications';
    await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify({
      ...form, job_posting_id: parseInt(form.job_posting_id),
    })});
    setSaving(false); setModalOpen(false); fetchApps();
  }
  async function deleteApp(id: number) {
    if (!confirm('Delete this application?')) return;
    await fetch(`/api/applications/${id}`, { method:'DELETE' });
    fetchApps();
  }
  async function saveInterview() {
    if (!ivAppId) return;
    await fetch('/api/interviews', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ...ivForm, application_id: ivAppId, round: parseInt(ivForm.round) }) });
    setIvModalOpen(false);
    fetchApps();
  }

  return (
    <div className="animate-in">
      <div className="page-header" style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
        <div>
          <h1 className="page-title">Applications</h1>
          <p className="page-subtitle">{apps.length} result{apps.length!==1?'s':''} · track every stage</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ New Application</button>
      </div>

      {/* Search & Filter Bar */}
      <div className="search-bar">
        <div className="form-group" style={{flex:'2',minWidth:200}}>
          <label className="form-label">Search</label>
          <input className="form-input" placeholder="Company or job title…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="">All</option>
            {STATUSES.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Source</label>
          <select className="form-select" value={filterSource} onChange={e=>setFilterSource(e.target.value)}>
            <option value="">All</option>
            {SOURCES.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">From</label>
          <input className="form-input" type="date" value={filterFrom} onChange={e=>setFilterFrom(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">To</label>
          <input className="form-input" type="date" value={filterTo} onChange={e=>setFilterTo(e.target.value)} />
        </div>
        <button className="btn btn-ghost btn-sm" onClick={()=>{setSearch('');setFilterStatus('');setFilterSource('');setFilterFrom('');setFilterTo('');}}>
          Clear
        </button>
      </div>

      {/* Applications Table */}
      <div className="table-wrap">
        <table>
          <thead><tr>
            <th>Company</th><th>Role</th><th>Status</th><th>Applied</th>
            <th>Deadline</th><th>Source</th><th>Interviews</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {loading
              ? <tr><td colSpan={8} style={{textAlign:'center',color:'var(--text3)',padding:'3rem',fontFamily:'var(--font-mono)',fontSize:'0.8rem'}}>Loading…</td></tr>
              : apps.length === 0
              ? <tr><td colSpan={8}><div className="empty">No applications found. Add one above!</div></td></tr>
              : apps.map(a => (
                <tr key={a.id}>
                  <td className="primary">
                    <div style={{fontWeight:600}}>{a.company_name}</div>
                    <div style={{fontSize:'0.75rem',color:'var(--text3)'}}>{a.industry}</div>
                  </td>
                  <td>
                    <div style={{color:'var(--text)'}}>{a.job_title}</div>
                    <div style={{fontSize:'0.75rem',color:'var(--text3)'}}>{a.role_type}</div>
                  </td>
                  <td><span className={badgeClass(a.status)}>{a.status}</span></td>
                  <td style={{fontFamily:'var(--font-mono)',fontSize:'0.8rem'}}>{fmtDate(a.applied_date)}</td>
                  <td>{a.deadline ? <>{fmtDate(a.deadline)}<br/>{daysUntil(a.deadline)}</> : '—'}</td>
                  <td><span className="tag">{a.source||'—'}</span></td>
                  <td style={{fontFamily:'var(--font-mono)',fontSize:'0.8rem',color:a.interview_count>0?'var(--purple)':'var(--text3)'}}>
                    {a.interview_count > 0 ? `${a.interview_count} round${a.interview_count!==1?'s':''}` : '—'}
                  </td>
                  <td>
                    <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap'}}>
                      {a.posting_url && <a href={a.posting_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">↗</a>}
                      <button className="btn btn-ghost btn-sm" onClick={()=>{setIvAppId(a.id);setIvForm({round:String(a.interview_count+1),interview_date:'',interview_type:'Phone',notes:'',outcome:'Pending'});setIvModalOpen(true);}}>+ Interview</button>
                      <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(a)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={()=>deleteApp(a.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Application Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModalOpen(false)}>
          <div className="modal">
            <h2 className="modal-title">{editApp ? 'Edit Application' : 'New Application'}</h2>
            <div className="form-grid">
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Job Posting *</label>
                <select className="form-select" value={form.job_posting_id} onChange={e=>setForm({...form,job_posting_id:e.target.value})}>
                  <option value="">Select a job posting…</option>
                  {jobs.map(j=><option key={j.id} value={j.id}>{j.company_name} — {j.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                  {STATUSES.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Applied Date</label>
                <input className="form-input" type="date" value={form.applied_date} onChange={e=>setForm({...form,applied_date:e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Source</label>
                <select className="form-select" value={form.source} onChange={e=>setForm({...form,source:e.target.value})}>
                  <option value="">Select source…</option>
                  {SOURCES.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Any notes about this application…" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveApp} disabled={saving||!form.job_posting_id}>
                {saving ? 'Saving…' : editApp ? 'Save Changes' : 'Add Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interview Modal */}
      {ivModalOpen && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setIvModalOpen(false)}>
          <div className="modal">
            <h2 className="modal-title">Log Interview Round</h2>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Round #</label>
                <input className="form-input" type="number" min={1} value={ivForm.round} onChange={e=>setIvForm({...ivForm,round:e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={ivForm.interview_type} onChange={e=>setIvForm({...ivForm,interview_type:e.target.value})}>
                  {['Phone','Video','Onsite','Technical','Behavioral','Case','Final'].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date & Time</label>
                <input className="form-input" type="datetime-local" value={ivForm.interview_date} onChange={e=>setIvForm({...ivForm,interview_date:e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Outcome</label>
                <select className="form-select" value={ivForm.outcome} onChange={e=>setIvForm({...ivForm,outcome:e.target.value})}>
                  {['Pending','Passed','Failed','No Decision'].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" value={ivForm.notes} onChange={e=>setIvForm({...ivForm,notes:e.target.value})} placeholder="What happened? What did they ask?" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setIvModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveInterview}>Save Interview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
