const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hbzmkpeirngvbsdawcld.supabase.co';
const supabaseAnonKey = 'sb_publishable_BSJLRQTQaT35ED0LBtMRgQ_5z0IHtll';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const email = 'angrybird@fuzzysoftstudio.com';
  const password = 'AngrybirdPassword123!';
  console.log('Registering...');
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });
  if (error) {
    console.error('Signup error:', error.message);
  } else {
    console.log('Signup result:', data);
  }
}

run();
