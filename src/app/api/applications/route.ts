import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status      = searchParams.get('status');
  const companyId   = searchParams.get('company_id');
  const source      = searchParams.get('source');
  const dateFrom    = searchParams.get('date_from');
  const dateTo      = searchParams.get('date_to');
  const search      = searchParams.get('search') || '';

  // ---- MULTI-TABLE JOIN QUERY ----
  // Joins applications → job_postings → companies + interview count subquery
  let sql = `
    SELECT
      a.id,
      a.status,
      a.applied_date,
      a.source,
      a.notes,
      a.updated_at,
      jp.id         AS job_id,
      jp.title      AS job_title,
      jp.role_type,
      jp.location   AS job_location,
      jp.posting_url,
      jp.deadline,
      c.id          AS company_id,
      c.name        AS company_name,
      c.industry,
      COALESCE(iv.interview_count, 0) AS interview_count,
      iv.latest_interview
    FROM applications a
    JOIN job_postings jp ON jp.id = a.job_posting_id
    JOIN companies    c  ON c.id  = jp.company_id
    LEFT JOIN (
      SELECT application_id,
             COUNT(*)                AS interview_count,
             MAX(interview_date)     AS latest_interview
      FROM interviews
      GROUP BY application_id
    ) iv ON iv.application_id = a.id
    WHERE (c.name ILIKE $1 OR jp.title ILIKE $1)`;

  const params: unknown[] = [`%${search}%`];

  if (status)    { params.push(status);    sql += ` AND a.status = $${params.length}`; }
  if (companyId) { params.push(companyId); sql += ` AND c.id = $${params.length}`; }
  if (source)    { params.push(source);    sql += ` AND a.source = $${params.length}`; }
  if (dateFrom)  { params.push(dateFrom);  sql += ` AND a.applied_date >= $${params.length}`; }
  if (dateTo)    { params.push(dateTo);    sql += ` AND a.applied_date <= $${params.length}`; }

  sql += ` ORDER BY a.updated_at DESC`;

  const rows = await query(sql, params);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { job_posting_id, status, applied_date, source, notes } = await req.json();
  if (!job_posting_id) return NextResponse.json({ error: 'job_posting_id required' }, { status: 400 });

  const rows = await query(
    `INSERT INTO applications (job_posting_id, status, applied_date, source, notes)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [job_posting_id, status || 'Applied', applied_date || new Date().toISOString().slice(0,10), source, notes]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
