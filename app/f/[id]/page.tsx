import { getDb } from '@/lib/db';
import FormRenderer from './FormRenderer'; // Client component

export const runtime = 'edge';

export default async function PublicFormPage({ params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id;
    
    // Fetch form data from D1 directly (since this is a server component)
    const db = getDb();
    const form = await db.prepare('SELECT title, description, fields_json FROM forms WHERE id = ?').bind(id).first();

    if (!form) {
        return (
            <div style={{ fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center', color: '#666' }}>
                <h2>表單不存在或已被刪除</h2>
            </div>
        );
    }

    const fields = JSON.parse(form.fields_json as string || '[]');
    const formTitle = form.title as string;
    const formDesc = form.description as string | null;

    return (
        <div style={{ 
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            background: 'transparent',
            padding: '1rem',
            color: '#333'
        }}>
            <style>{`
                body { background: transparent !important; margin: 0; }
                .v-form-container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: #fff;
                    border-radius: 8px;
                    padding: 2rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                .v-form-header { margin-bottom: 2rem; border-bottom: 1px solid #eee; padding-bottom: 1rem; }
                .v-form-title { margin: 0 0 0.5rem 0; font-size: 1.5rem; color: #111; }
                .v-form-desc { margin: 0; color: #666; font-size: 0.95rem; line-height: 1.5; }
                .v-field { margin-bottom: 1.5rem; }
                .v-label { display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.95rem; }
                .v-required { color: #e53e3e; margin-left: 4px; }
                .v-input { 
                    width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 6px; 
                    font-size: 1rem; box-sizing: border-box; transition: border-color 0.2s;
                }
                .v-input:focus { outline: none; border-color: #3182ce; box-shadow: 0 0 0 1px #3182ce; }
                .v-textarea { resize: vertical; min-height: 100px; }
                .v-select { width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 6px; font-size: 1rem; background: #fff; }
                .v-radio-group { display: flex; flex-direction: column; gap: 0.5rem; }
                .v-radio-label { display: flex; align-items: center; gap: 0.5rem; font-weight: normal; cursor: pointer; }
                .v-submit { 
                    background: #3182ce; color: #fff; border: none; padding: 0.75rem 1.5rem; 
                    border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer; width: 100%;
                    transition: background 0.2s;
                }
                .v-submit:hover { background: #2b6cb0; }
                .v-submit:disabled { opacity: 0.7; cursor: not-allowed; }
            `}</style>
            
            <div className="v-form-container">
                <div className="v-form-header">
                    <h1 className="v-form-title">{formTitle}</h1>
                    {formDesc && <p className="v-form-desc">{formDesc}</p>}
                </div>
                
                <FormRenderer formId={id} fields={fields} />
            </div>
        </div>
    );
}
