const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hbzmkpeirngvbsdawcld.supabase.co';
const supabaseAnonKey = 'sb_publishable_BSJLRQTQaT35ED0LBtMRgQ_5z0IHtll';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const candidates = [
  'id', 'product_id', 'customer_name', 'rating', 'status', 'created_at',
  'title', 'comment', 'quote', 'text', 'content', 'name', 'location', 'verified', 'approved'
];

async function run() {
  for (const col of candidates) {
    const { error } = await supabase.from('reviews').insert({ [col]: null });
    console.log(`Column ${col}:`, error ? `${error.code} - ${error.message}` : 'Success');
  }
}

run();
