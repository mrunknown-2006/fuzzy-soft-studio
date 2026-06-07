const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hbzmkpeirngvbsdawcld.supabase.co';
const supabaseAnonKey = 'sb_publishable_BSJLRQTQaT35ED0LBtMRgQ_5z0IHtll';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Testing categories invalid column...");
  const res1 = await supabase.from('categories').insert({ this_column_does_not_exist: 'test' });
  console.log("Categories invalid column error:", res1.error ? res1.error.code + ' - ' + res1.error.message : 'No error');

  console.log("Testing categories name column...");
  const res2 = await supabase.from('categories').insert({ name: 'test' });
  console.log("Categories name column error:", res2.error ? res2.error.code + ' - ' + res2.error.message : 'No error');
}

run();
