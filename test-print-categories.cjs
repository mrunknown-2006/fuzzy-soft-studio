const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hbzmkpeirngvbsdawcld.supabase.co';
const supabaseAnonKey = 'sb_publishable_BSJLRQTQaT35ED0LBtMRgQ_5z0IHtll';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const cat = await supabase.from('categories').select('*').limit(1);
  console.log('categories:', cat.data ? Object.keys(cat.data[0] || {}) : cat.error);

  const disc = await supabase.from('discounts').select('*').limit(1);
  console.log('discounts:', disc.data ? Object.keys(disc.data[0] || {}) : disc.error);

  const rev = await supabase.from('reviews').select('*').limit(1);
  console.log('reviews:', rev.data ? Object.keys(rev.data[0] || {}) : rev.error);
}

run();
