import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'edge';

// GET: 取得所有表單清單
export async function GET(_req: NextRequest) {

    const db = getDb();
    const forms = await db.prepare('SELECT id, title, description, fields_json, created_at FROM forms ORDER BY created_at DESC').all();

    // 順便取得每個表單的回覆數量
    const responses = await db.prepare('SELECT form_id, COUNT(*) as count FROM form_responses GROUP BY form_id').all();
    const countMap = new Map();
    if (responses.results) {
        for (const row of responses.results) {
            countMap.set(row.form_id, row.count);
        }
    }

    const result = (forms.results || []).map((f: any) => ({
        ...f,
        fields: JSON.parse(f.fields_json || '[]'),
        responseCount: countMap.get(f.id) || 0
    }));

    return NextResponse.json(result);
}

// POST: 建立或更新表單
export async function POST(req: NextRequest) {

    try {
        const body = await req.json();
        const { id, title, description, fields } = body as {
            id?: string;
            title: string;
            description: string;
            fields: any[];
        };

        if (!title) return NextResponse.json({ error: '標題為必填' }, { status: 400 });

        const db = getDb();
        const formId = id || crypto.randomUUID();
        const fieldsJson = JSON.stringify(fields || []);
        
        if (id) {
            // Update
            await db.prepare('UPDATE forms SET title = ?, description = ?, fields_json = ? WHERE id = ?')
                .bind(title, description || '', fieldsJson, id)
                .run();
        } else {
            // Insert
            await db.prepare('INSERT INTO forms (id, title, description, fields_json, created_at) VALUES (?, ?, ?, ?, ?)')
                .bind(formId, title, description || '', fieldsJson, Math.floor(Date.now() / 1000))
                .run();
        }

        return NextResponse.json({ success: true, id: formId });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE: 刪除表單
export async function DELETE(req: NextRequest) {

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        const db = getDb();
        // form_responses 有設定 ON DELETE CASCADE，所以會一併刪除
        await db.prepare('DELETE FROM forms WHERE id = ?').bind(id).run();

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
