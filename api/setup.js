export default async function handler(req, res) {
  const SB_URL = 'https://wwtbgrizaytnyodfojez.supabase.co';
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  const sql = async (query) => {
    const r = await fetch(`${SB_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      },
      body: JSON.stringify({ sql: query })
    });
    return r.json();
  };

  try {
    await sql(`
      create table if not exists projects (
        id uuid default gen_random_uuid() primary key,
        user_id uuid references auth.users(id) on delete cascade,
        name text not null,
        token text not null,
        created_at timestamptz default now()
      );
      create table if not exists videos (
        id uuid default gen_random_uuid() primary key,
        project_id uuid references projects(id) on delete cascade,
        quality text not null,
        storage_path text not null,
        url text not null,
        created_at timestamptz default now()
      );
      alter table if exists projects enable row level security;
      alter table if exists videos enable row level security;
      create policy if not exists "p_own" on projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
      create policy if not exists "p_read" on projects for select using (true);
      create policy if not exists "v_own" on videos for all using (project_id in (select id from projects where user_id = auth.uid())) with check (project_id in (select id from projects where user_id = auth.uid()));
      create policy if not exists "v_read" on videos for select using (true);
    `);

    res.status(200).json({ ok: true, msg: '✅ تم إنشاء الجداول بنجاح!' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
                         }
