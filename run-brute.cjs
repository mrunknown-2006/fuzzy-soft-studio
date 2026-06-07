const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hbzmkpeirngvbsdawcld.supabase.co';
const supabaseAnonKey = 'sb_publishable_BSJLRQTQaT35ED0LBtMRgQ_5z0IHtll';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const email = 'angrybird@fuzzysoftstudio.com';
  const passwords = [
    'angrybirdPassword123!',
    'angrybirdPassword123',
    'angrybird123!',
    'Angrybird123!',
    'AngrybirdPassword123!',
    'angrybird',
    'angrybird123',
    'angrybird@123',
    'angrybird@2026',
    'fuzzysoft2026',
    'fuzzysoftstudio2026',
    'floral2026',
    'blooms2026',
    'bloom20',
    'bloom2026',
    'angrybirdPassword',
    'angrybirdpassword',
    'password123',
    'password123!',
    'admin',
    'admin123!',
    'Admin123!',
    'AdminPassword123!',
    'adminpassword123!',
    'adminpassword',
    'AdminPassword'
  ];

  for (const pass of passwords) {
    console.log(`Trying password: ${pass}`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass
    });

    if (!error) {
      console.log(`SUCCESS! Password is: ${pass}`);
      console.log('User:', data.user.id);
      return;
    } else {
      console.log(`Failed: ${error.message}`);
    }
  }
  console.log('All passwords failed.');
}

run();
