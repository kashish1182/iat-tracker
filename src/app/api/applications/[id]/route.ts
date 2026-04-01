import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const row = await queryOne(
    `SELECT a.*, jp.title AS job_title, jp.role_type, jp.deadline, jp.posting_url,
            c.name AS company_name, c.industry, c.location AS company_location
     FROM applications a
     JOIN job_postings jp ON jp.id = a.job_posting_id
     JOIN companies c ON c.id = jp.company_id
     WHERE a.id = $1`,
    [params.id]
  );
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Fetch interviews for this application
  const interviews = await query(
    `SELECT * FROM interviews WHERE application_id = $1 ORDER BY round ASC`,
    [params.id]
  );

  return NextResponse.json({ ...row as object, interviews });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { status, applied_date, source, notes } = await req.json();
  const row = await queryOne(
    `UPDATE applications SET status=$1, applied_date=$2, source=$3, notes=$4, updated_at=NOW()
     WHERE id=$5 RETURNING *`,
    [status, applied_date, source, notes, params.id]
  );
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await query(`DELETE FROM applications WHERE id = $1`, [params.id]);
  return NextResponse.json({ success: true });
}
