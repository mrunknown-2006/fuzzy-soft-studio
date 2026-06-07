const supabaseUrl = 'https://hbzmkpeirngvbsdawcld.supabase.co';
const supabaseAnonKey = 'sb_publishable_BSJLRQTQaT35ED0LBtMRgQ_5z0IHtll';

async function run() {
  const response = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseAnonKey}`);
  const spec = await response.json();
  console.log('Spec received:', spec);
  return;
  
  for (const tableName of tables) {
    console.log(`\n=================== TABLE: ${tableName} ===================`);
    const definition = schemas[tableName];
    if (!definition) {
      console.log(`Table ${tableName} not found in spec.`);
      continue;
    }
    const properties = definition.properties;
    for (const [colName, colSpec] of Object.entries(properties)) {
      console.log(`  - ${colName}: ${colSpec.type} (${colSpec.format || ''})`);
    }
  }
}

run().catch(console.error);
