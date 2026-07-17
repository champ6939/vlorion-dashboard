import PostalMime from 'postal-mime';

interface Env {
    DB: any; // D1Database
}

export default {
    async email(message: any, env: Env, ctx: any) {
        // Read the raw message stream into an ArrayBuffer
        const rawBuffer = await new Response(message.raw).arrayBuffer();
        
        // Parse the raw email using postal-mime
        const parsed = await PostalMime.parse(rawBuffer);
        
        const id = crypto.randomUUID();
        const sender = message.from;
        const recipient = message.to;
        const subject = parsed.subject || '(無主旨)';
        const bodyText = parsed.text || '';
        const bodyHtml = parsed.html || '';
        const date = Math.floor(Date.now() / 1000);

        // Insert into D1 inbox table
        await env.DB.prepare(`
            INSERT INTO inbox (id, sender, recipient, subject, body_text, body_html, date, read, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
        `)
        .bind(id, sender, recipient, subject, bodyText, bodyHtml, date, date)
        .run();
    }
};
