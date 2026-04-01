import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const row = await queryOne(`SELECT * FROM companies WHERE id = $1`, [params.id]);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { name, industry, location, website } = await req.json();
  const row = await queryOne(
    `UPDATE companies SET name=$1, industry=$2, location=$3, website=$4
     WHERE id=$5 RETURNING *`,
    [name, industry, location, website, params.id]
  );
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await query(`DELETE FROM companies WHERE id = $1`, [params.id]);
  return NextResponse.json({ success: true });
}
