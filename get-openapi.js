const fetch = require('node-fetch');

const supabaseUrl = 'https://hbzmkpeirngvbsdawcld.supabase.co';
const supabaseAnonKey = 'sb_publishable_BSJLRQTQaT35ED0LBtMRgQ_5z0IHtll';

async function run() {
  const response = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseAnonKey}`);
  const spec = await response.json();
  
  const tables = ['categories', 'reviews', 'discounts', 'site_content', 'store_settings', 'products', 'orders'];
  
  for (const tableName of tables) {
    console.log(`\n=================== TABLE: ${tableName} ===================`);
    const definition = spec.definitions[tableName];
    if (!definition) {
      console.log(`Table ${tableName} not found in OpenAPI spec.`);
      continue;
    }
    const properties = definition.properties;
    for (const [colName, colSpec] of Object.entries(properties)) {
      console.log(`  - ${colName}: ${colSpec.type} (${colSpec.format || ''}) ${colSpec.description || ''}`);
    }
  }
}

run().catch(console.error);
