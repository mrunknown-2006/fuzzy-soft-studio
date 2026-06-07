const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hbzmkpeirngvbsdawcld.supabase.co';
const supabaseAnonKey = 'sb_publishable_BSJLRQTQaT35ED0LBtMRgQ_5z0IHtll';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const email = 'angrybird@fuzzysoftstudio.com';
  const password = 'AngrybirdPassword123!';
  
  console.log('Signing in...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
    console.error('Sign in failed:', signInError.message);
    return;
  }
  console.log('Signed in successfully!');

  const tables = ['categories', 'reviews', 'discounts', 'site_content', 'store_settings'];
  for (const table of tables) {
    console.log(`Inspecting ${table} dummy insert...`);
    const { data, error } = await supabase.from(table).insert({}).select('*');
    console.log(`Result for ${table}:`);
    if (error) {
      console.log("Error details:", error);
    } else {
      console.log("Inserted columns:", data);
      // Let's delete the dummy row we inserted (using id or key or code)
      if (data && data[0]) {
        const row = data[0];
        const key = row.id !== undefined ? 'id' : (row.key !== undefined ? 'key' : (row.code !== undefined ? 'code' : null));
        if (key) {
          await supabase.from(table).delete().eq(key, row[key]);
          console.log(`Deleted dummy row in ${table}`);
        }
      }
    }
  }
}

test();
