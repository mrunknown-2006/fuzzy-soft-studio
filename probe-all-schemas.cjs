const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hbzmkpeirngvbsdawcld.supabase.co';
const supabaseAnonKey = 'sb_publishable_BSJLRQTQaT35ED0LBtMRgQ_5z0IHtll';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const tableCandidates = {
  categories: ['id', 'name', 'slug', 'created_at', 'active', 'image', 'description'],
  reviews: ['id', 'product_id', 'customer_name', 'rating', 'title', 'comment', 'status', 'created_at', 'approved', 'location', 'verified'],
  discounts: ['id', 'code', 'percent', 'expiry', 'limit', 'active', 'created_at', 'type', 'value', 'min_purchase'],
  site_content: ['id', 'key', 'value', 'updated_at', 'created_at', 'type'],
  store_settings: ['id', 'key', 'value', 'updated_at', 'created_at']
};

async function probe() {
  for (const [table, candidates] of Object.entries(tableCandidates)) {
    console.log(`\nProbing table: ${table}`);
    const existingColumns = [];
    for (const col of candidates) {
      const payload = { [col]: null }; // Try setting it to null or a default dummy value
      // Wait, we need to pass a valid format/value depending on the type, but let's try null first.
      const { error } = await supabase.from(table).insert(payload);
      if (error) {
        if (error.code === '42501' || error.message.includes('row-level security') || error.message.includes('violates check constraint') || error.message.includes('null value in column')) {
          existingColumns.push(col);
        } else if (error.message.includes('Could not find')) {
          // PGRST204 column does not exist
        } else {
          // Other error means column exists but type mismatch or check constraint failed
          existingColumns.push(col);
        }
      } else {
        // No error means it worked (column exists)
        existingColumns.push(col);
      }
    }
    console.log(`Existing columns in ${table}:`, existingColumns);
  }
}

probe();
