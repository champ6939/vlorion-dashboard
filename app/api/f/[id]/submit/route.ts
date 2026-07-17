import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'edge';

// POST: 訪客送出表單
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        if (!id) return NextResponse.json({ error: 'Missing form id' }, { status: 400 });

        const data = await req.json(); // user submitted key-value pairs

        const db = getDb();
        
        // 檢查表單是否存在
        const form = await db.prepare('SELECT id FROM forms WHERE id = ?').bind(id).first();
        if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 });

        // 寫入回覆
        const responseId = crypto.randomUUID();
        const dataJson = JSON.stringify(data);
        
        await db.prepare('INSERT INTO form_responses (id, form_id, data_json, created_at) VALUES (?, ?, ?, ?)')
            .bind(responseId, id, dataJson, Math.floor(Date.now() / 1000))
            .run();

        // CORS headers 允許 iframe 或跨域存取
        return new NextResponse(JSON.stringify({ success: true, id: responseId }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// 處理 CORS 預檢請求
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
