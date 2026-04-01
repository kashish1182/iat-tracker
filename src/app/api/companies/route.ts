import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';

  const rows = await query(
    `SELECT c.*, 
       COUNT(DISTINCT jp.id) AS job_count,
       COUNT(DISTINCT a.id)  AS application_count
     FROM companies c
     LEFT JOIN job_postings jp ON jp.company_id = c.id
     LEFT JOIN applications a  ON a.job_posting_id = jp.id
     WHERE c.name ILIKE $1 OR c.industry ILIKE $1
     GROUP BY c.id
     ORDER BY c.name`,
    [`%${search}%`]
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { name, industry, location, website } = await req.json();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const rows = await query(
    `INSERT INTO companies (name, industry, location, website)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, industry, location, website]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
