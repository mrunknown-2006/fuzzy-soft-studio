const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hbzmkpeirngvbsdawcld.supabase.co';
const supabaseAnonKey = 'sb_publishable_BSJLRQTQaT35ED0LBtMRgQ_5z0IHtll';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const discountCandidates = [
  'expires_at', 'expires', 'expiry_date', 'valid_until', 'ends_at',
  'is_active', 'active', 'status', 'enabled',
  'percent', 'discount_percent', 'discount_value', 'type', 'discount_type'
];

const contentCandidates = [
  'created_at', 'title', 'description', 'body', 'data', 'section', 'block', 'type'
];

async function run() {
  console.log("Probing discounts:");
  for (const col of discountCandidates) {
    const { error } = await supabase.from('discounts').insert({ [col]: null });
    if (error && error.code === '42501') console.log(`  - ${col}`);
  }

  console.log("Probing site_content:");
  for (const col of contentCandidates) {
    const { error } = await supabase.from('site_content').insert({ [col]: null });
    if (error && error.code === '42501') console.log(`  - ${col}`);
  }
}

run();
