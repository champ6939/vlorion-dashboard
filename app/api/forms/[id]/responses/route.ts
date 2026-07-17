import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'edge';

// GET: 取得特定表單的所有回覆
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

    const id = (await params).id;
    if (!id) return NextResponse.json({ error: 'Missing form id' }, { status: 400 });

    const db = getDb();
    
    // Check if form exists
    const form = await db.prepare('SELECT title, fields_json FROM forms WHERE id = ?').bind(id).first();
    if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 });

    // Get responses
    const responses = await db.prepare('SELECT id, data_json, created_at FROM form_responses WHERE form_id = ? ORDER BY created_at DESC').bind(id).all();

    return NextResponse.json({
        form: {
            title: form.title,
            fields: JSON.parse(form.fields_json as string || '[]')
        },
        responses: (responses.results || []).map((r: any) => ({
            id: r.id,
            data: JSON.parse(r.data_json as string || '{}'),
            created_at: r.created_at
        }))
    });
}
