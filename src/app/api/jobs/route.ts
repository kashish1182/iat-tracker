import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('company_id');
  const roleType  = searchParams.get('role_type');

  let sql = `
    SELECT jp.*, c.name AS company_name, c.industry
    FROM job_postings jp
    JOIN companies c ON c.id = jp.company_id
    WHERE 1=1`;
  const params: unknown[] = [];

  if (companyId) { params.push(companyId); sql += ` AND jp.company_id = $${params.length}`; }
  if (roleType)  { params.push(roleType);  sql += ` AND jp.role_type = $${params.length}`; }

  sql += ` ORDER BY jp.deadline ASC NULLS LAST`;
  const rows = await query(sql, params);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { company_id, title, role_type, location, posting_url, deadline, description } = await req.json();
  if (!company_id || !title) return NextResponse.json({ error: 'company_id and title required' }, { status: 400 });

  const rows = await query(
    `INSERT INTO job_postings (company_id, title, role_type, location, posting_url, deadline, description)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [company_id, title, role_type, location, posting_url, deadline || null, description]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
