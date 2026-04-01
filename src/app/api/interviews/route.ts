import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const applicationId = searchParams.get('application_id');
  const upcoming      = searchParams.get('upcoming'); // ?upcoming=true

  let sql = `
    SELECT i.*, a.status AS app_status, jp.title AS job_title, c.name AS company_name
    FROM interviews i
    JOIN applications a  ON a.id = i.application_id
    JOIN job_postings jp ON jp.id = a.job_posting_id
    JOIN companies    c  ON c.id  = jp.company_id
    WHERE 1=1`;
  const params: unknown[] = [];

  if (applicationId) { params.push(applicationId); sql += ` AND i.application_id = $${params.length}`; }
  if (upcoming === 'true') { sql += ` AND i.interview_date >= NOW()`; }

  sql += ` ORDER BY i.interview_date ASC`;

  const rows = await query(sql, params);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { application_id, round, interview_date, interview_type, notes, outcome } = await req.json();
  if (!application_id) return NextResponse.json({ error: 'application_id required' }, { status: 400 });

  const rows = await query(
    `INSERT INTO interviews (application_id, round, interview_date, interview_type, notes, outcome)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [application_id, round || 1, interview_date || null, interview_type, notes, outcome || 'Pending']
  );

  // Auto-update application status to 'Interview' when interview is added
  await queryOne(
    `UPDATE applications SET status='Interview', updated_at=NOW()
     WHERE id=$1 AND status NOT IN ('Offer','Rejected','Withdrawn','Accepted')`,
    [application_id]
  );

  return NextResponse.json(rows[0], { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { id, round, interview_date, interview_type, notes, outcome } = await req.json();
  const row = await queryOne(
    `UPDATE interviews SET round=$1, interview_date=$2, interview_type=$3, notes=$4, outcome=$5
     WHERE id=$6 RETURNING *`,
    [round, interview_date, interview_type, notes, outcome, id]
  );
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  await query(`DELETE FROM interviews WHERE id = $1`, [id]);
  return NextResponse.json({ success: true });
}
