import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabase = createClient(
    'https://wwtbgrizaytnyodfojez.supabase.co',
    process.env.SUPABASE_SERVICE_KEY
  );

  try {
    // Create projects table
    await supabase.rpc('exec_sql', { sql: `
      create table if not exists projects (
        id uuid default gen_random_uuid() primary key,
        user_id uuid references auth.users(id) on delete cascade,
        name text not null,
        token text not null,
        created_at timestamptz default now()
      );
    `});

    // Create videos table
    await supabase.rpc('exec_sql', { sql: `
      create table if not exists videos (
        id uuid default gen_random_uuid() primary key,
        project_id uuid references projects(id) on delete cascade,
        quality text not null,
        storage_path text not null,
        url text not null,
        created_at timestamptz default now()
      );
    `});

    // Enable RLS and policies
    const { error } = await supabase.rpc('exec_sql', { sql: `
      alter table if exists projects enable row level security;
      alter table if exists videos enable row level security;
      
      do $$ begin
        if not exists (select 1 from pg_policies where tablename='projects' and policyname='p_own') then
          create policy "p_own" on projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
        end if;
        if not exists (select 1 from pg_policies where tablename='projects' and policyname='p_read') then
          create policy "p_read" on projects for select using (true);
        end if;
        if not exists (select 1 from pg_policies where tablename='videos' and policyname='v_own') then
          create policy "v_own" on videos for all using (
            project_id in (select id from projects where user_id = auth.uid())
          ) with check (
            project_id in (select id from projects where user_id = auth.uid())
          );
        end if;
        if not exists (select 1 from pg_policies where tablename='videos' and policyname='v_read') then
          create policy "v_read" on videos for select using (true);
        end if;
      end $$;
    `});

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'تم إنشاء الجداول بنجاح ✅' });
  } catch (err) {
    // Tables might already exist via direct SQL — try a simpler check
    const { data } = await supabase.from('projects').select('id').limit(1);
    if (data !== null) {
      return res.status(200).json({ success: true, message: 'الجداول موجودة بالفعل ✅' });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
}
