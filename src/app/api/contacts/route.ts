import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('company_id');
  const search    = searchParams.get('search') || '';

  let sql = `
    SELECT ct.*, c.name AS company_name
    FROM contacts ct
    LEFT JOIN companies c ON c.id = ct.company_id
    WHERE (ct.name ILIKE $1 OR ct.email ILIKE $1 OR ct.role ILIKE $1)`;
  const params: unknown[] = [`%${search}%`];

  if (companyId) { params.push(companyId); sql += ` AND ct.company_id = $${params.length}`; }

  sql += ` ORDER BY ct.last_contacted DESC NULLS LAST`;
  const rows = await query(sql, params);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { company_id, application_id, name, email, phone, role, linkedin_url, notes, last_contacted } = await req.json();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const rows = await query(
    `INSERT INTO contacts (company_id, application_id, name, email, phone, role, linkedin_url, notes, last_contacted)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [company_id || null, application_id || null, name, email, phone, role, linkedin_url, notes, last_contacted || null]
  );
  return NextResponse.json(rows[0], { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { id, company_id, application_id, name, email, phone, role, linkedin_url, notes, last_contacted } = await req.json();
  const row = await queryOne(
    `UPDATE contacts SET company_id=$1, application_id=$2, name=$3, email=$4, phone=$5,
       role=$6, linkedin_url=$7, notes=$8, last_contacted=$9
     WHERE id=$10 RETURNING *`,
    [company_id || null, application_id || null, name, email, phone, role, linkedin_url, notes, last_contacted || null, id]
  );
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  await query(`DELETE FROM contacts WHERE id = $1`, [id]);
  return NextResponse.json({ success: true });
}
