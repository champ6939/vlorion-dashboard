-- VLORION Dashboard — Forms Schema
-- Run: npx wrangler d1 execute vlorion-dashboard-db --file=./schema-forms.sql --remote

CREATE TABLE IF NOT EXISTS forms (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT,
    fields_json TEXT NOT NULL,
    created_at  INTEGER NOT NULL -- Unix timestamp
);

CREATE TABLE IF NOT EXISTS form_responses (
    id          TEXT PRIMARY KEY,
    form_id     TEXT NOT NULL,
    data_json   TEXT NOT NULL,
    created_at  INTEGER NOT NULL, -- Unix timestamp
    FOREIGN KEY(form_id) REFERENCES forms(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_form_responses_form_id ON form_responses(form_id);
