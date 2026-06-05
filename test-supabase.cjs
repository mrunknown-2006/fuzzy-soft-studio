const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hbzmkpeirngvbsdawcld.supabase.co';
const supabaseAnonKey = 'sb_publishable_BSJLRQTQaT35ED0LBtMRgQ_5z0IHtll';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Checking products table...");
  const { data: pData, error: pError } = await supabase.from('products').select('*');
  console.log("Products error:", pError ? pError.message : "None");

  console.log("Checking settings table...");
  const { data: sData, error: sError } = await supabase.from('settings').select('*');
  console.log("Settings error:", sError ? sError.message : "None");

  console.log("Checking orders table...");
  const { data: oData, error: oError } = await supabase.from('orders').select('*');
  console.log("Orders error:", oError ? oError.message : "None");
}

test();
