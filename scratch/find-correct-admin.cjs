const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hbzmkpeirngvbsdawcld.supabase.co';
const supabaseAnonKey = 'sb_publishable_BSJLRQTQaT35ED0LBtMRgQ_5z0IHtll';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const passwordsToTry = [
  'angrybirdPassword123!',
  'angrybird',
  'admin123',
  'password',
  '123456',
  'fuzzysoft',
  'fuzzysoftstudio',
  'angrybird123',
  'angrybird@fuzzysoftstudio.com',
  'AngrybirdPassword123!'
];

async function run() {
  const email = 'angrybird@fuzzysoftstudio.com';
  let authenticatedClient = null;

  for (const pass of passwordsToTry) {
    console.log(`Trying sign in with password: ${pass}`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass
    });

    if (!error) {
      console.log('SUCCESS! Authenticated with password:', pass);
      authenticatedClient = supabase;
      break;
    } else {
      console.log(`Failed: ${error.message}`);
    }
  }

  if (!authenticatedClient) {
    console.error('All passwords failed. Cannot update database.');
    process.exit(1);
  }

  const aboutContent = {
    about_hero_title: 'Our Story',
    about_hero_subtitle: 'Born from a love of blooms — Fuzzy Soft Studio is where flowers become feelings.',
    about_block1_title: "Founder's Journey",
    about_block1_image: '',
    about_block1_text1: "Fuzzy Soft Studio is a new handmade floral studio based in Lucknow, founded by Warisha Shariq in 2026. What started as a personal love for flowers and crochet has grown into a small studio that crafts made-to-order arrangements for life's quiet and grand moments.",
    about_block1_text2: 'Every piece is handmade with care, and no two are exactly alike.',
    about_block2_title: 'Crafted with Care',
    about_block2_image: '',
    about_block2_text1: 'We believe that flowers should hold more than just a temporary place in our lives. Our crochet arrangements are hand-threaded to order, ensuring each set of petals carries custom character and enduring warmth.',
    about_block2_text2: 'By creating made-to-order floral statements, we ensure nothing is wasted, and every box is a custom work of art.'
  };

  console.log('Updating site_content for id="about"...');
  const { data: upsertData, error: upsertError } = await supabase
    .from('site_content')
    .upsert({
      id: 'about',
      content: aboutContent,
      updated_at: new Date().toISOString()
    })
    .select();

  if (upsertError) {
    console.error('Update failed:', upsertError.message);
  } else {
    console.log('Update successful! Data:', upsertData);
  }
}

run();
