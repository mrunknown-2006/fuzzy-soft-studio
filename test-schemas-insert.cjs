const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hbzmkpeirngvbsdawcld.supabase.co';
const supabaseAnonKey = 'sb_publishable_BSJLRQTQaT35ED0LBtMRgQ_5z0IHtll';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const tables = ['categories', 'reviews', 'discounts', 'site_content', 'store_settings'];
  for (const table of tables) {
    console.log(`Inspecting ${table} dummy insert...`);
    const { data, error } = await supabase.from(table).insert({}).select('*');
    console.log(`Result for ${table}:`);
    if (error) {
      console.log("Error details:", error);
    } else {
      console.log("Inserted columns:", data);
    }
  }
}

test();
