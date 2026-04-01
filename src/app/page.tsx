'use client';
import { useEffect, useState } from 'react';

interface Metrics {
  total_applications: number;
  apps_with_interviews: number;
  offers_received: number;
  accepted: number;
  response_rate_pct: number;
  offer_rate_pct: number;
  avg_days_to_first_interview: number;
}
interface StatusRow  { status: string; count: string; }
interface SourceRow  { source: string; total_applications: string; interview_rate_pct: string; }
interface EngagRow   { company_name: string; engagement_score: number; application_count: string; interview_count: string; contact_count: string; }
interface DeadlineRow{ title: string; deadline: string; company_name: string; status: string; application_id: string; }
interface InterviewRow{ interview_date: string; interview_type: string; round: number; job_title: string; company_name: string; }
interface BetRow     { job_title: string; company_name: string; status: string; momentum_score: number; interview_rounds: string; contacts: string; }

const STATUS_COLORS: Record<string, string> = {
  Applied: '#3a6fc4', 'Phone Screen': '#c07020', Interview: '#7030a0',
  Offer: '#007000', Accepted: '#808000', Rejected: '#c00000',
  Withdrawn: '#808080', Wishlist: '#007070',
};

function badgeClass(s: string) {
  const map: Record<string, string> = {
    Applied: 'badge-applied', 'Phone Screen': 'badge-phone-screen',
    Interview: 'badge-interview', Offer: 'badge-offer', Accepted: 'badge-accepted',
    Rejected: 'badge-rejected', Withdrawn: 'badge-withdrawn', Wishlist: 'badge-wishlist',
  };
  return `badge ${map[s] || 'badge-applied'}`;
}

function fmtDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function DaysUntil({ date }: { date: string }) {
  const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  const color = days <= 3 ? '#cc0000' : days <= 7 ? '#cc6600' : '#444444';
  return <span style={{ color, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 'bold' }}>
    {days < 0 ? 'Past' : days === 0 ? 'Today' : `${days}d`}
  </span>;
}

function WinWindow({ icon, title, children }: { icon?: string; title: string; children: React.ReactNode }) {
  return (
    <div className="win-window">
      <div className="win-titlebar">
        <span className="win-titlebar-text">{icon && <span>{icon}</span>}{title}</span>
        <div className="win-titlebar-btns">
          <button className="win-btn" aria-label="Minimize">_</button>
          <button className="win-btn" aria-label="Maximize">□</button>
          <button className="win-btn" aria-label="Close" style={{ color: '#c00' }}>✕</button>
        </div>
      </div>
      <div className="win-content">{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<{
    metrics: Metrics; statusBreakdown: StatusRow[]; sourceStats: SourceRow[];
    engagementScores: EngagRow[]; upcomingDeadlines: DeadlineRow[];
    upcomingInterviews: InterviewRow[]; bestBets: BetRow[];
  } | null>(null);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData);
  }, []);

  if (!data) return (
    <WinWindow icon="⏳" title="Loading...">
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text2)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
        Please wait while Windows loads your data…
      </div>
    </WinWindow>
  );

  const { metrics, statusBreakdown, sourceStats, engagementScores, upcomingDeadlines, upcomingInterviews, bestBets } = data;
  const total = statusBreakdown.reduce((s, r) => s + parseInt(r.count), 0);
  const maxScore = engagementScores[0]?.engagement_score || 1;

  return (
    <div className="animate-in">
      {/* Title bar header */}
      <div style={{
        background: 'linear-gradient(to right, var(--titlebar-start), var(--titlebar-end))',
        padding: '4px 8px',
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: 'var(--raised)',
      }}>
        <span style={{ fontSize: '16px' }}>📊</span>
        <div>
          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.85rem' }}>
            IAT Dashboard — Your <em style={{ fontStyle: 'normal', color: '#ffff99' }}>search</em>, centralized.
          </div>
          <div style={{ color: '#cce4ff', fontSize: '0.72rem' }}>All applications, interviews, and opportunities at a glance.</div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="metric-grid">
        {[
          { label: '📁 Total Apps',        value: metrics.total_applications,           sub: 'submitted', icon: '📁' },
          { label: '🎤 Interviews',         value: metrics.apps_with_interviews,         sub: 'interview stage' },
          { label: '🏆 Offers',             value: metrics.offers_received,              sub: 'offers received', accent: true },
          { label: '📈 Response Rate',      value: `${metrics.response_rate_pct ?? 0}%`, sub: 'apps → interview' },
          { label: '💰 Offer Rate',         value: `${metrics.offer_rate_pct ?? 0}%`,    sub: 'interview → offer' },
          { label: '⏱ Avg Days to Reply',  value: metrics.avg_days_to_first_interview ?? '—', sub: '1st interview' },
        ].map(m => (
          <div className="card" key={m.label}>
            <div className="card-label">{m.label}</div>
            <div className={`card-value${m.accent ? ' accent' : ''}`}>{m.value}</div>
            <div className="card-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="two-col" style={{ marginBottom: '8px' }}>
        {/* Status Breakdown */}
        <WinWindow icon="📊" title="Applications by Status">
          <div style={{ marginBottom: '4px', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'var(--text2)' }}>
            Total: <strong>{total}</strong> applications tracked
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {statusBreakdown.map(row => {
              const pct = total ? Math.round(parseInt(row.count) / total * 100) : 0;
              return (
                <div key={row.status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', alignItems: 'center' }}>
                    <span className={badgeClass(row.status)}>{row.status}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text)' }}>
                      {row.count} <span style={{ color: 'var(--text3)' }}>({pct}%)</span>
                    </span>
                  </div>
                  <div className="score-bar">
                    <div className="score-bar-fill" style={{ width: `${pct}%`, background: STATUS_COLORS[row.status] || 'var(--accent)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </WinWindow>

        {/* Source Effectiveness */}
        <WinWindow icon="🔍" title="Source Effectiveness">
          <div className="table-wrap" style={{ boxShadow: 'none' }}>
            <table>
              <thead><tr>
                <th>Source</th>
                <th>Apps</th>
                <th>Interview Rate</th>
              </tr></thead>
              <tbody>
                {sourceStats.map(r => (
                  <tr key={r.source}>
                    <td className="primary">{r.source || 'Unknown'}</td>
                    <td>{r.total_applications}</td>
                    <td>
                      <span style={{ color: parseFloat(r.interview_rate_pct) > 30 ? '#006600' : 'var(--text2)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {r.interview_rate_pct ?? 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </WinWindow>
      </div>

      <div className="two-col" style={{ marginBottom: '8px' }}>
        {/* Upcoming Deadlines */}
        <WinWindow icon="⏰" title="Deadlines — Next 14 Days">
          {upcomingDeadlines.length === 0
            ? <div className="empty">No upcoming deadlines</div>
            : <div className="table-wrap" style={{ boxShadow: 'none' }}>
                <table><thead><tr><th>Role</th><th>Company</th><th>Deadline</th><th>In</th></tr></thead>
                  <tbody>{upcomingDeadlines.map((r, i) => (
                    <tr key={i}>
                      <td className="primary" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</td>
                      <td>{r.company_name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{fmtDate(r.deadline)}</td>
                      <td><DaysUntil date={r.deadline} /></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
          }
        </WinWindow>

        {/* Upcoming Interviews */}
        <WinWindow icon="📅" title="Upcoming Interviews">
          {upcomingInterviews.length === 0
            ? <div className="empty">No upcoming interviews</div>
            : <div className="table-wrap" style={{ boxShadow: 'none' }}>
                <table><thead><tr><th>Role</th><th>Company</th><th>Date</th><th>Type</th></tr></thead>
                  <tbody>{upcomingInterviews.map((r, i) => (
                    <tr key={i}>
                      <td className="primary" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.job_title}</td>
                      <td>{r.company_name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{fmtDate(r.interview_date)}</td>
                      <td><span className="tag">{r.interview_type}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
          }
        </WinWindow>
      </div>

      {/* Best Bets */}
      <WinWindow icon="🎯" title="Best Bets — Momentum Score">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text2)', marginBottom: '8px', padding: '3px 6px', background: '#ffffc0', boxShadow: 'var(--sunken)', borderLeft: '3px solid #cccc00' }}>
          ℹ Score = source conversion rate × 0.3 + interview rounds × 20 + contacts × 10 + status bonus
        </div>
        {bestBets.length === 0
          ? <div className="empty">No active applications to score</div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {bestBets.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 6px', background: i % 2 === 0 ? 'var(--bg3)' : 'var(--bg2)', boxShadow: 'var(--sunken)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent)', width: 24, textAlign: 'right', fontWeight: 'bold' }}>
                    #{i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--text)', fontSize: '0.8rem' }}>{b.job_title}</span>
                      <span style={{ color: 'var(--text3)', fontSize: '0.75rem' }}>@ {b.company_name}</span>
                      <span className={badgeClass(b.status)}>{b.status}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.72rem', color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>
                      <span>Interviews: {b.interview_rounds}</span>
                      <span>Contacts: {b.contacts}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 70 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: '1.1rem', fontWeight: 'bold' }}>{b.momentum_score}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text3)', textTransform: 'uppercase' }}>SCORE</div>
                  </div>
                </div>
              ))}
            </div>
        }
      </WinWindow>

      {/* Company Engagement Scores */}
      <WinWindow icon="🏢" title="Company Engagement Scores">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text2)', marginBottom: '8px', padding: '3px 6px', background: '#ffffc0', boxShadow: 'var(--sunken)', borderLeft: '3px solid #cccc00' }}>
          ℹ Score = interviews×3 + contacts×2 + offers×5 − rejections
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {engagementScores.map(r => {
            const pct = maxScore > 0 ? Math.round(r.engagement_score / maxScore * 100) : 0;
            return (
              <div key={r.company_name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: 'var(--text)', fontWeight: 'bold', fontSize: '0.8rem' }}>{r.company_name}</span>
                    <span style={{ color: 'var(--text3)', fontSize: '0.72rem', marginLeft: '8px', fontFamily: 'var(--font-mono)' }}>
                      {r.application_count} apps · {r.interview_count} interviews · {r.contact_count} contacts
                    </span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 'bold' }}>{r.engagement_score}</span>
                </div>
                <div className="score-bar">
                  <div className="score-bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </WinWindow>

      <div style={{ height: 12 }} />
    </div>
  );
}
