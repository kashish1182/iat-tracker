import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const row = await queryOne(
    `SELECT jp.*, c.name AS company_name FROM job_postings jp
     JOIN companies c ON c.id = jp.company_id WHERE jp.id = $1`,
    [params.id]
  );
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { company_id, title, role_type, location, posting_url, deadline, description } = await req.json();
  const row = await queryOne(
    `UPDATE job_postings SET company_id=$1, title=$2, role_type=$3, location=$4,
       posting_url=$5, deadline=$6, description=$7
     WHERE id=$8 RETURNING *`,
    [company_id, title, role_type, location, posting_url, deadline || null, description, params.id]
  );
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await query(`DELETE FROM job_postings WHERE id = $1`, [params.id]);
  return NextResponse.json({ success: true });
}
