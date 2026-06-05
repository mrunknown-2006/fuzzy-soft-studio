const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hbzmkpeirngvbsdawcld.supabase.co';
const supabaseAnonKey = 'sb_publishable_BSJLRQTQaT35ED0LBtMRgQ_5z0IHtll';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Fetching products...");
  const { data: selectData, error: selectError } = await supabase.from('products').select('*');
  if (selectError) {
    console.error("Select error:", selectError);
  } else {
    console.log(`Select successful: found ${selectData.length} products.`);
  }

  console.log("Attempting to insert a test product...");
  const testProduct = {
    id: `test-${Date.now()}`,
    name: 'Test Product',
    slug: `test-product-${Date.now()}`,
    price: 100,
    category: 'Bouquets',
    collection: 'everyday-luxury',
    image: 'https://images.unsplash.com/photo-1532634896-26909d0d4b89?w=600&q=80',
    images: [],
    bullet_points: ['Test'],
    care_instructions: 'Test',
    delivery_info: 'Test',
    description: 'Test description',
    stock: 5,
    active: false
  };

  const { data: insertData, error: insertError } = await supabase.from('products').insert(testProduct);
  if (insertError) {
    console.error("Insert failed:", insertError);
  } else {
    console.log("Insert succeeded!", insertData);
    
    // Clean up
    console.log("Cleaning up test product...");
    const { error: deleteError } = await supabase.from('products').delete().eq('id', testProduct.id);
    if (deleteError) {
      console.error("Delete failed:", deleteError);
    } else {
      console.log("Clean up succeeded!");
    }
  }
}

test();
