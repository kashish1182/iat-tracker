import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(_: NextRequest) {
  // ---- AGGREGATE QUERY 1: Applications by status ----
  const statusBreakdown = await query(`
    SELECT status, COUNT(*) AS count
    FROM applications
    GROUP BY status
    ORDER BY count DESC
  `);

  // ---- AGGREGATE QUERY 2: Source effectiveness ----
  const sourceStats = await query(`
    SELECT
      source,
      COUNT(*)                                          AS total_applications,
      COUNT(*) FILTER (WHERE status IN ('Interview','Offer','Accepted')) AS reached_interview,
      COUNT(*) FILTER (WHERE status IN ('Offer','Accepted'))             AS received_offer,
      ROUND(
        100.0 * COUNT(*) FILTER (WHERE status IN ('Interview','Offer','Accepted'))
        / NULLIF(COUNT(*), 0), 1
      ) AS interview_rate_pct
    FROM applications
    GROUP BY source
    ORDER BY total_applications DESC
  `);

  // ---- AGGREGATE QUERY 3: Performance metrics ----
  const metrics = await query(`
    SELECT
      COUNT(DISTINCT a.id)                                             AS total_applications,
      COUNT(DISTINCT i.application_id)                                 AS apps_with_interviews,
      COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('Offer','Accepted')) AS offers_received,
      COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'Accepted')           AS accepted,
      ROUND(
        100.0 * COUNT(DISTINCT i.application_id) / NULLIF(COUNT(DISTINCT a.id), 0), 1
      ) AS response_rate_pct,
      ROUND(
        100.0 * COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('Offer','Accepted'))
        / NULLIF(COUNT(DISTINCT i.application_id), 0), 1
      ) AS offer_rate_pct,
      ROUND(
        AVG(
          EXTRACT(EPOCH FROM (i.first_interview - a.applied_date)) / 86400
        )::numeric, 1
      ) AS avg_days_to_first_interview
    FROM applications a
    LEFT JOIN (
      SELECT application_id, MIN(interview_date) AS first_interview
      FROM interviews
      GROUP BY application_id
    ) i ON i.application_id = a.id
  `);

  // ---- ADVANCED: Company Engagement Score ----
  // Score = (interviews * 3) + (contacts * 2) + (has_offer * 5) - (rejected * 1)
  // This is the advanced function: multi-table join + computed derived metric
  const engagementScores = await query(`
    SELECT
      c.id,
      c.name AS company_name,
      c.industry,
      COUNT(DISTINCT a.id)    AS application_count,
      COUNT(DISTINCT i.id)    AS interview_count,
      COUNT(DISTINCT ct.id)   AS contact_count,
      COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('Offer','Accepted')) AS offer_count,
      COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'Rejected') AS rejection_count,
      -- Derived engagement score formula
      (
        COUNT(DISTINCT i.id) * 3 +
        COUNT(DISTINCT ct.id) * 2 +
        COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('Offer','Accepted')) * 5 -
        COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'Rejected') * 1
      ) AS engagement_score
    FROM companies c
    LEFT JOIN job_postings jp ON jp.company_id = c.id
    LEFT JOIN applications a  ON a.job_posting_id = jp.id
    LEFT JOIN interviews   i  ON i.application_id = a.id
    LEFT JOIN contacts     ct ON ct.company_id = c.id
    GROUP BY c.id, c.name, c.industry
    HAVING COUNT(DISTINCT a.id) > 0
    ORDER BY engagement_score DESC
    LIMIT 10
  `);

  // ---- Upcoming deadlines (next 14 days) ----
  const upcomingDeadlines = await query(`
    SELECT jp.title, jp.deadline, jp.posting_url, c.name AS company_name,
           a.status, a.id AS application_id
    FROM job_postings jp
    JOIN companies c ON c.id = jp.company_id
    LEFT JOIN applications a ON a.job_posting_id = jp.id
    WHERE jp.deadline BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '14 days'
    ORDER BY jp.deadline ASC
    LIMIT 10
  `);

  // ---- Upcoming interviews ----
  const upcomingInterviews = await query(`
    SELECT i.interview_date, i.interview_type, i.round,
           jp.title AS job_title, c.name AS company_name, a.id AS application_id
    FROM interviews i
    JOIN applications a  ON a.id = i.application_id
    JOIN job_postings jp ON jp.id = a.job_posting_id
    JOIN companies    c  ON c.id  = jp.company_id
    WHERE i.interview_date >= NOW()
    ORDER BY i.interview_date ASC
    LIMIT 10
  `);

  // ---- ADVANCED: Predictive "Best Bet" recommendation ----
  // Recommends which active applications have the highest likelihood of progression
  // based on: recency, interview stage, source conversion rate, company engagement
  const bestBets = await query(`
    WITH source_rates AS (
      SELECT source,
             ROUND(
               100.0 * COUNT(*) FILTER (WHERE status IN ('Interview','Offer','Accepted'))
               / NULLIF(COUNT(*), 0), 1
             ) AS source_interview_rate
      FROM applications GROUP BY source
    )
    SELECT
      a.id,
      a.status,
      a.applied_date,
      jp.title  AS job_title,
      jp.deadline,
      c.name    AS company_name,
      sr.source_interview_rate,
      COALESCE(iv.interview_count, 0) AS interview_rounds,
      COALESCE(ct.contact_count, 0)   AS contacts,
      -- Composite "momentum score"
      ROUND((
        COALESCE(sr.source_interview_rate, 0) * 0.3 +
        COALESCE(iv.interview_count, 0) * 20 +
        COALESCE(ct.contact_count, 0)   * 10 +
        CASE a.status
          WHEN 'Phone Screen' THEN 20
          WHEN 'Interview'    THEN 40
          WHEN 'Offer'        THEN 60
          ELSE 0
        END
      )::numeric, 1) AS momentum_score
    FROM applications a
    JOIN job_postings jp ON jp.id = a.job_posting_id
    JOIN companies    c  ON c.id  = jp.company_id
    LEFT JOIN source_rates sr ON sr.source = a.source
    LEFT JOIN (
      SELECT application_id, COUNT(*) AS interview_count
      FROM interviews GROUP BY application_id
    ) iv ON iv.application_id = a.id
    LEFT JOIN (
      SELECT application_id, COUNT(*) AS contact_count
      FROM contacts WHERE application_id IS NOT NULL GROUP BY application_id
    ) ct ON ct.application_id = a.id
    WHERE a.status NOT IN ('Rejected','Withdrawn','Accepted')
    ORDER BY momentum_score DESC
    LIMIT 5
  `);

  return NextResponse.json({
    metrics: metrics[0] || {},
    statusBreakdown,
    sourceStats,
    engagementScores,
    upcomingDeadlines,
    upcomingInterviews,
    bestBets,
  });
}
