const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hbzmkpeirngvbsdawcld.supabase.co';
const supabaseAnonKey = 'sb_publishable_BSJLRQTQaT35ED0LBtMRgQ_5z0IHtll';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const tables = ['categories', 'reviews', 'discounts', 'site_content', 'store_settings'];
  for (const table of tables) {
    console.log(`Checking ${table}...`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Error on ${table}:`, error.message);
    } else {
      console.log(`Success on ${table}:`, data);
    }
  }
}

test();
