'use client';
import { useEffect, useState, useCallback } from 'react';

interface Contact {
  id: number; name: string; email: string; phone: string; role: string;
  linkedin_url: string; notes: string; last_contacted: string;
  company_id: number; company_name: string; application_id: number;
}
interface Company { id: number; name: string; }

const ROLES = ['Recruiter','Hiring Manager','Engineering Manager','Alumni','Referral','Career Services','Other'];
const emptyForm = { company_id:'', application_id:'', name:'', email:'', phone:'', role:'', linkedin_url:'', notes:'', last_contacted:'' };

function fmtDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}
function daysSince(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days}d ago`;
}

export default function ContactsPage() {
  const [contacts,  setContacts]  = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem,  setEditItem]  = useState<Contact|null>(null);
  const [form,      setForm]      = useState({...emptyForm});
  const [saving,    setSaving]    = useState(false);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const data = await fetch(`/api/contacts?search=${encodeURIComponent(search)}`).then(r=>r.json());
    setContacts(data);
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);
  useEffect(() => { fetch('/api/companies').then(r=>r.json()).then(setCompanies); }, []);

  function openNew() { setEditItem(null); setForm({...emptyForm}); setModalOpen(true); }
  function openEdit(c: Contact) {
    setEditItem(c);
    setForm({
      company_id: String(c.company_id||''), application_id: String(c.application_id||''),
      name: c.name, email: c.email||'', phone: c.phone||'', role: c.role||'',
      linkedin_url: c.linkedin_url||'', notes: c.notes||'',
      last_contacted: c.last_contacted?.slice(0,10)||'',
    });
    setModalOpen(true);
  }

  async function save() {
    setSaving(true);
    if (editItem) {
      await fetch('/api/contacts',{method:'PUT',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({...form,id:editItem.id,company_id:form.company_id||null,application_id:form.application_id||null})});
    } else {
      await fetch('/api/contacts',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({...form,company_id:form.company_id||null,application_id:form.application_id||null})});
    }
    setSaving(false); setModalOpen(false); fetchContacts();
  }

  async function del(id: number) {
    if (!confirm('Delete this contact?')) return;
    await fetch(`/api/contacts?id=${id}`,{method:'DELETE'});
    fetchContacts();
  }

  // Quick "mark contacted today"
  async function markContacted(c: Contact) {
    await fetch('/api/contacts',{method:'PUT',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        id:c.id,company_id:c.company_id,application_id:c.application_id,
        name:c.name,email:c.email,phone:c.phone,role:c.role,
        linkedin_url:c.linkedin_url,notes:c.notes,
        last_contacted:new Date().toISOString().slice(0,10),
      })});
    fetchContacts();
  }

  return (
    <div className="animate-in">
      <div className="page-header" style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-subtitle">Recruiters, alumni, and networking connections</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Add Contact</button>
      </div>

      <div className="search-bar">
        <div className="form-group" style={{flex:1}}>
          <label className="form-label">Search contacts</label>
          <input className="form-input" placeholder="Name, email, or role…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
      </div>

      {/* Stats row */}
      <div className="metric-grid" style={{marginBottom:'1.5rem'}}>
        <div className="card">
          <div className="card-label">Total Contacts</div>
          <div className="card-value">{contacts.length}</div>
        </div>
        <div className="card">
          <div className="card-label">Contacted This Week</div>
          <div className="card-value accent">
            {contacts.filter(c => c.last_contacted && Math.floor((Date.now()-new Date(c.last_contacted).getTime())/86400000) <= 7).length}
          </div>
        </div>
        <div className="card">
          <div className="card-label">Never Contacted</div>
          <div className="card-value" style={{color:'var(--orange)'}}>
            {contacts.filter(c => !c.last_contacted).length}
          </div>
        </div>
        <div className="card">
          <div className="card-label">Unique Companies</div>
          <div className="card-value">
            {new Set(contacts.map(c=>c.company_id).filter(Boolean)).size}
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr>
            <th>Name</th><th>Role</th><th>Company</th><th>Email</th>
            <th>Last Contacted</th><th>Links</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {loading
              ? <tr><td colSpan={7} style={{textAlign:'center',color:'var(--text3)',padding:'3rem',fontFamily:'var(--font-mono)',fontSize:'0.8rem'}}>Loading…</td></tr>
              : contacts.length===0
              ? <tr><td colSpan={7}><div className="empty">No contacts yet. Start networking!</div></td></tr>
              : contacts.map(c=>(
                <tr key={c.id}>
                  <td className="primary" style={{fontWeight:600}}>
                    {c.name}
                    {c.notes && <div style={{fontSize:'0.72rem',color:'var(--text3)',marginTop:'0.2rem',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.notes}</div>}
                  </td>
                  <td>{c.role ? <span className="tag">{c.role}</span> : '—'}</td>
                  <td style={{color:'var(--text2)'}}>{c.company_name||'—'}</td>
                  <td style={{fontFamily:'var(--font-mono)',fontSize:'0.75rem',color:'var(--blue)'}}>
                    {c.email ? <a href={`mailto:${c.email}`} style={{color:'inherit',textDecoration:'none'}}>{c.email}</a> : '—'}
                  </td>
                  <td>
                    {c.last_contacted
                      ? <div>
                          <div style={{fontFamily:'var(--font-mono)',fontSize:'0.75rem'}}>{fmtDate(c.last_contacted)}</div>
                          <div style={{fontSize:'0.7rem',color:'var(--text3)'}}>{daysSince(c.last_contacted)}</div>
                        </div>
                      : <span style={{color:'var(--orange)',fontFamily:'var(--font-mono)',fontSize:'0.75rem'}}>Never</span>
                    }
                  </td>
                  <td>
                    <div style={{display:'flex',gap:'0.4rem'}}>
                      {c.linkedin_url && <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">in</a>}
                    </div>
                  </td>
                  <td>
                    <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap'}}>
                      <button className="btn btn-ghost btn-sm" onClick={()=>markContacted(c)} title="Mark contacted today">✓ Today</button>
                      <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(c)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={()=>del(c.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModalOpen(false)}>
          <div className="modal">
            <h2 className="modal-title">{editItem?'Edit Contact':'Add Contact'}</h2>
            <div className="form-grid">
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Sarah Kim" />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                  <option value="">Select role…</option>
                  {ROLES.map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Company</label>
                <select className="form-select" value={form.company_id} onChange={e=>setForm({...form,company_id:e.target.value})}>
                  <option value="">No company</option>
                  {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="name@company.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+1 (555) 000-0000" />
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">LinkedIn URL</label>
                <input className="form-input" value={form.linkedin_url} onChange={e=>setForm({...form,linkedin_url:e.target.value})} placeholder="https://linkedin.com/in/…" />
              </div>
              <div className="form-group">
                <label className="form-label">Last Contacted</label>
                <input className="form-input" type="date" value={form.last_contacted} onChange={e=>setForm({...form,last_contacted:e.target.value})} />
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="How did you meet? Any details to remember?" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving||!form.name}>
                {saving?'Saving…':editItem?'Save Changes':'Add Contact'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
