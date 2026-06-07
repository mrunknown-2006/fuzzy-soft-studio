const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hbzmkpeirngvbsdawcld.supabase.co';
const supabaseAnonKey = 'sb_publishable_BSJLRQTQaT35ED0LBtMRgQ_5z0IHtll';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const reviewCandidates = ['body', 'review', 'message', 'review_text', 'review_body', 'text_content', 'opinion', 'heading', 'title', 'summary'];
const discountCandidates = ['percent', 'percentage', 'discount', 'expiry', 'expires_at', 'limit', 'usage_limit', 'max_uses', 'active', 'status', 'description'];
const contentCandidates = ['key', 'value', 'content_key', 'content_value', 'name', 'data', 'content', 'text', 'image_url', 'slug', 'section', 'block'];

async function run() {
  console.log("\nProbing reviews:");
  for (const col of reviewCandidates) {
    const { error } = await supabase.from('reviews').insert({ [col]: null });
    if (error && error.code === '42501') console.log(`  - ${col}`);
  }

  console.log("\nProbing discounts:");
  for (const col of discountCandidates) {
    const { error } = await supabase.from('discounts').insert({ [col]: null });
    if (error && error.code === '42501') console.log(`  - ${col}`);
  }

  console.log("\nProbing site_content:");
  for (const col of contentCandidates) {
    const { error } = await supabase.from('site_content').insert({ [col]: null });
    if (error && error.code === '42501') console.log(`  - ${col}`);
  }
}

run();
