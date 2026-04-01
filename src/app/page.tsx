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
  Applied: '#5b9cf6', 'Phone Screen': '#ff9a3c', Interview: '#a78bfa',
  Offer: '#a3ff6b', Accepted: '#e8ff47', Rejected: '#ff5f5f',
  Withdrawn: '#9898a8', Wishlist: '#2dd4bf',
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
  const color = days <= 3 ? 'var(--red)' : days <= 7 ? 'var(--orange)' : 'var(--text2)';
  return <span style={{ color, fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
    {days < 0 ? 'Past' : days === 0 ? 'Today' : `${days}d`}
  </span>;
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
      Loading dashboard…
    </div>
  );

  const { metrics, statusBreakdown, sourceStats, engagementScores, upcomingDeadlines, upcomingInterviews, bestBets } = data;
  const total = statusBreakdown.reduce((s, r) => s + parseInt(r.count), 0);
  const maxScore = engagementScores[0]?.engagement_score || 1;

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Your <em>search</em>, centralized.</h1>
        <p className="page-subtitle">All applications, interviews, and opportunities at a glance.</p>
      </div>

      {/* Metric Cards */}
      <div className="metric-grid">
        {[
          { label: 'Total Apps',        value: metrics.total_applications,           sub: 'submitted' },
          { label: 'Interviews',         value: metrics.apps_with_interviews,         sub: 'reached interview stage' },
          { label: 'Offers',             value: metrics.offers_received,              sub: 'offers received', accent: true },
          { label: 'Response Rate',      value: `${metrics.response_rate_pct ?? 0}%`, sub: 'apps → interview' },
          { label: 'Offer Rate',         value: `${metrics.offer_rate_pct ?? 0}%`,    sub: 'interview → offer' },
          { label: 'Avg Days to Reply',  value: metrics.avg_days_to_first_interview ?? '—', sub: 'applied → 1st interview' },
        ].map(m => (
          <div className="card" key={m.label}>
            <div className="card-label">{m.label}</div>
            <div className={`card-value${m.accent ? ' accent' : ''}`}>{m.value}</div>
            <div className="card-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="two-col" style={{ marginBottom: '1.5rem' }}>
        {/* Status Breakdown */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">Applications by Status</span>
            <span className="tag">{total} total</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {statusBreakdown.map(row => {
              const pct = total ? Math.round(parseInt(row.count) / total * 100) : 0;
              return (
                <div key={row.status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span className={badgeClass(row.status)}>{row.status}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text2)' }}>
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
        </div>

        {/* Source Effectiveness */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">Source Effectiveness</span>
          </div>
          <div className="table-wrap" style={{ border: 'none' }}>
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
                      <span style={{ color: parseFloat(r.interview_rate_pct) > 30 ? 'var(--accent2)' : 'var(--text2)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        {r.interview_rate_pct ?? 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="two-col" style={{ marginBottom: '1.5rem' }}>
        {/* Upcoming Deadlines */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">⏰ Deadlines (next 14 days)</span>
          </div>
          {upcomingDeadlines.length === 0
            ? <div className="empty">No upcoming deadlines</div>
            : <div className="table-wrap" style={{ border: 'none' }}>
                <table><thead><tr><th>Role</th><th>Company</th><th>Deadline</th><th>In</th></tr></thead>
                  <tbody>{upcomingDeadlines.map((r, i) => (
                    <tr key={i}>
                      <td className="primary" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</td>
                      <td>{r.company_name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{fmtDate(r.deadline)}</td>
                      <td><DaysUntil date={r.deadline} /></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
          }
        </div>

        {/* Upcoming Interviews */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">📅 Upcoming Interviews</span>
          </div>
          {upcomingInterviews.length === 0
            ? <div className="empty">No upcoming interviews</div>
            : <div className="table-wrap" style={{ border: 'none' }}>
                <table><thead><tr><th>Role</th><th>Company</th><th>Date</th><th>Type</th></tr></thead>
                  <tbody>{upcomingInterviews.map((r, i) => (
                    <tr key={i}>
                      <td className="primary" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.job_title}</td>
                      <td>{r.company_name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{fmtDate(r.interview_date)}</td>
                      <td><span className="tag">{r.interview_type}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
          }
        </div>
      </div>

      {/* Advanced: Best Bets */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="section-header">
          <span className="section-title">🎯 Best Bets — Momentum Score</span>
          <span className="tag">Advanced · Predictive</span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>
          Score = source conversion rate × 0.3 + interview rounds × 20 + contacts × 10 + status bonus
        </p>
        {bestBets.length === 0
          ? <div className="empty">No active applications to score</div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {bestBets.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent)', width: 28, textAlign: 'right' }}>
                    #{i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 500, color: 'var(--text)' }}>{b.job_title}</span>
                      <span style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>@ {b.company_name}</span>
                      <span className={badgeClass(b.status)}>{b.status}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                      <span>{b.interview_rounds} interviews</span>
                      <span>{b.contacts} contacts</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 80 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: '1.1rem' }}>{b.momentum_score}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>score</div>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>

      {/* Company Engagement Scores */}
      <div className="card">
        <div className="section-header">
          <span className="section-title">🏢 Company Engagement Scores</span>
          <span className="tag">Advanced · SQL Aggregation</span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>
          Score = interviews×3 + contacts×2 + offers×5 − rejections
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {engagementScores.map(r => {
            const pct = maxScore > 0 ? Math.round(r.engagement_score / maxScore * 100) : 0;
            return (
              <div key={r.company_name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{r.company_name}</span>
                    <span style={{ color: 'var(--text3)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>{r.application_count} apps · {r.interview_count} interviews · {r.contact_count} contacts</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent)' }}>{r.engagement_score}</span>
                </div>
                <div className="score-bar">
                  <div className="score-bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
