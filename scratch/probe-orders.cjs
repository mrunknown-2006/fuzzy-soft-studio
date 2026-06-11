const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hbzmkpeirngvbsdawcld.supabase.co';
const supabaseAnonKey = 'sb_publishable_BSJLRQTQaT35ED0LBtMRgQ_5z0IHtll';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const candidates = [
  'id', 'order_id', 'user_id', 'created_at', 'total_amount', 'total', 'status',
  'items', 'shipping_address', 'address', 'customer_name', 'customer_phone',
  'customer_email', 'email', 'phone', 'payment_method', 'tracking_number',
  'carrier', 'internal_notes', 'confirmed_at', 'shipped_at', 'delivered_at',
  'cod_applied', 'cod_charge', 'discount_amount', 'discount_code', 'subtotal',
  'shipping', 'shipping_charges'
];

async function probe() {
  console.log('Probing orders table columns...');
  const existingColumns = [];
  for (const col of candidates) {
    const { error } = await supabase.from('orders').insert({ [col]: null });
    if (error) {
      if (error.message.includes('Could not find')) {
        // Column does not exist
      } else {
        existingColumns.push(col);
      }
    } else {
      existingColumns.push(col);
    }
  }
  console.log('Existing columns in orders:', existingColumns);
}

probe();
