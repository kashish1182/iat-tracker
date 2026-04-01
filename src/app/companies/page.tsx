'use client';
import { useEffect, useState, useCallback } from 'react';

interface Company {
  id: number; name: string; industry: string; location: string;
  website: string; job_count: string; application_count: string;
}

const emptyForm = { name:'', industry:'', location:'', website:'' };
const INDUSTRIES = ['Technology','Fintech','Finance','Healthcare','Education','E-commerce','Media','Consulting','Travel/Tech','Design/Tech','Data/Analytics','Productivity/Tech','Other'];

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem,  setEditItem]  = useState<Company|null>(null);
  const [form,      setForm]      = useState({...emptyForm});
  const [saving,    setSaving]    = useState(false);

  // Job posting sub-modal
  const [jpModal,   setJpModal]   = useState(false);
  const [jpCompany, setJpCompany] = useState<Company|null>(null);
  const [jpForm,    setJpForm]    = useState({ title:'', role_type:'Internship', location:'', posting_url:'', deadline:'', description:'' });
  const [jpList,    setJpList]    = useState<{id:number;title:string;role_type:string;deadline:string}[]>([]);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    const data = await fetch(`/api/companies?search=${encodeURIComponent(search)}`).then(r=>r.json());
    setCompanies(data);
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  function openNew()  { setEditItem(null); setForm({...emptyForm}); setModalOpen(true); }
  function openEdit(c: Company) { setEditItem(c); setForm({name:c.name,industry:c.industry||'',location:c.location||'',website:c.website||''}); setModalOpen(true); }

  async function save() {
    setSaving(true);
    const method = editItem ? 'PUT' : 'POST';
    const url    = editItem ? `/api/companies/${editItem.id}` : '/api/companies';
    await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
    setSaving(false); setModalOpen(false); fetchCompanies();
  }
  async function del(id:number) {
    if (!confirm('Delete this company and all related data?')) return;
    await fetch(`/api/companies/${id}`,{method:'DELETE'});
    fetchCompanies();
  }

  async function openJobs(c: Company) {
    setJpCompany(c);
    setJpForm({title:'',role_type:'Internship',location:'',posting_url:'',deadline:'',description:''});
    const data = await fetch(`/api/jobs?company_id=${c.id}`).then(r=>r.json());
    setJpList(data);
    setJpModal(true);
  }
  async function saveJob() {
    if (!jpCompany) return;
    await fetch('/api/jobs',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({...jpForm,company_id:jpCompany.id})});
    const data = await fetch(`/api/jobs?company_id=${jpCompany.id}`).then(r=>r.json());
    setJpList(data);
    setJpForm({title:'',role_type:'Internship',location:'',posting_url:'',deadline:'',description:''});
    fetchCompanies();
  }
  async function deleteJob(id:number) {
    if (!confirm('Delete this job posting?')) return;
    await fetch(`/api/jobs/${id}`,{method:'DELETE'});
    if (jpCompany) {
      const data = await fetch(`/api/jobs?company_id=${jpCompany.id}`).then(r=>r.json());
      setJpList(data);
    }
    fetchCompanies();
  }

  return (
    <div className="animate-in">
      <div className="page-header" style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
        <div>
          <h1 className="page-title">Companies</h1>
          <p className="page-subtitle">Manage companies and their job postings</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Add Company</button>
      </div>

      <div className="search-bar">
        <div className="form-group" style={{flex:1}}>
          <label className="form-label">Search companies</label>
          <input className="form-input" placeholder="Name or industry…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr>
            <th>Company</th><th>Industry</th><th>Location</th><th>Website</th>
            <th>Job Postings</th><th>Applications</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {loading
              ? <tr><td colSpan={7} style={{textAlign:'center',color:'var(--text3)',padding:'3rem',fontFamily:'var(--font-mono)',fontSize:'0.8rem'}}>Loading…</td></tr>
              : companies.length===0
              ? <tr><td colSpan={7}><div className="empty">No companies yet. Add one above!</div></td></tr>
              : companies.map(c=>(
                <tr key={c.id}>
                  <td className="primary" style={{fontWeight:600}}>{c.name}</td>
                  <td>{c.industry ? <span className="tag">{c.industry}</span> : '—'}</td>
                  <td style={{color:'var(--text2)'}}>{c.location||'—'}</td>
                  <td>
                    {c.website
                      ? <a href={c.website} target="_blank" rel="noreferrer" style={{color:'var(--blue)',fontFamily:'var(--font-mono)',fontSize:'0.75rem',textDecoration:'none'}}>↗ site</a>
                      : '—'}
                  </td>
                  <td style={{fontFamily:'var(--font-mono)',fontSize:'0.8rem',color:parseInt(c.job_count)>0?'var(--teal)':'var(--text3)'}}>
                    {c.job_count}
                  </td>
                  <td style={{fontFamily:'var(--font-mono)',fontSize:'0.8rem',color:parseInt(c.application_count)>0?'var(--purple)':'var(--text3)'}}>
                    {c.application_count}
                  </td>
                  <td>
                    <div style={{display:'flex',gap:'0.4rem'}}>
                      <button className="btn btn-ghost btn-sm" onClick={()=>openJobs(c)}>Jobs</button>
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

      {/* Company Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModalOpen(false)}>
          <div className="modal">
            <h2 className="modal-title">{editItem?'Edit Company':'Add Company'}</h2>
            <div className="form-grid">
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Company Name *</label>
                <input className="form-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Google" />
              </div>
              <div className="form-group">
                <label className="form-label">Industry</label>
                <select className="form-select" value={form.industry} onChange={e=>setForm({...form,industry:e.target.value})}>
                  <option value="">Select industry…</option>
                  {INDUSTRIES.map(i=><option key={i}>{i}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="e.g. San Francisco, CA" />
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Website</label>
                <input className="form-input" value={form.website} onChange={e=>setForm({...form,website:e.target.value})} placeholder="https://careers.company.com" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving||!form.name}>
                {saving?'Saving…':editItem?'Save Changes':'Add Company'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Postings Modal */}
      {jpModal && jpCompany && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setJpModal(false)}>
          <div className="modal" style={{maxWidth:700}}>
            <h2 className="modal-title">Job Postings — {jpCompany.name}</h2>

            {/* Existing postings */}
            {jpList.length > 0 && (
              <div className="table-wrap" style={{marginBottom:'1.5rem'}}>
                <table>
                  <thead><tr><th>Title</th><th>Type</th><th>Deadline</th><th></th></tr></thead>
                  <tbody>{jpList.map(j=>(
                    <tr key={j.id}>
                      <td className="primary">{j.title}</td>
                      <td><span className="tag">{j.role_type}</span></td>
                      <td style={{fontFamily:'var(--font-mono)',fontSize:'0.75rem'}}>{j.deadline?new Date(j.deadline).toLocaleDateString():'—'}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={()=>deleteJob(j.id)}>Del</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}

            {/* Add new posting */}
            <div style={{borderTop:'1px solid var(--border)',paddingTop:'1.25rem'}}>
              <div className="section-title" style={{marginBottom:'1rem'}}>Add Job Posting</div>
              <div className="form-grid">
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label className="form-label">Job Title *</label>
                  <input className="form-input" value={jpForm.title} onChange={e=>setJpForm({...jpForm,title:e.target.value})} placeholder="Software Engineer Intern" />
                </div>
                <div className="form-group">
                  <label className="form-label">Role Type</label>
                  <select className="form-select" value={jpForm.role_type} onChange={e=>setJpForm({...jpForm,role_type:e.target.value})}>
                    {['Internship','Full-Time','Part-Time','Co-op','Contract'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-input" value={jpForm.location} onChange={e=>setJpForm({...jpForm,location:e.target.value})} placeholder="Remote / City, State" />
                </div>
                <div className="form-group">
                  <label className="form-label">Posting URL</label>
                  <input className="form-input" value={jpForm.posting_url} onChange={e=>setJpForm({...jpForm,posting_url:e.target.value})} placeholder="https://…" />
                </div>
                <div className="form-group">
                  <label className="form-label">Deadline</label>
                  <input className="form-input" type="date" value={jpForm.deadline} onChange={e=>setJpForm({...jpForm,deadline:e.target.value})} />
                </div>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={jpForm.description} onChange={e=>setJpForm({...jpForm,description:e.target.value})} placeholder="Brief role description…" />
                </div>
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:'0.75rem',marginTop:'1rem'}}>
                <button className="btn btn-ghost" onClick={()=>setJpModal(false)}>Close</button>
                <button className="btn btn-primary" onClick={saveJob} disabled={!jpForm.title}>Add Posting</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
