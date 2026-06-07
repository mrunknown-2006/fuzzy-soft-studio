const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hbzmkpeirngvbsdawcld.supabase.co';
const supabaseAnonKey = 'sb_publishable_BSJLRQTQaT35ED0LBtMRgQ_5z0IHtll';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const res1 = await supabase.from('discounts').insert({ min_order_value: null });
  console.log("discounts min_order_value:", res1.error ? res1.error.code : 'exists');

  const res2 = await supabase.from('reviews').insert({ customer_email: null });
  console.log("reviews customer_email:", res2.error ? res2.error.code : 'exists');
}

run();
