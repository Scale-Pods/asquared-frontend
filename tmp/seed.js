const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const users = [
    { email: 'akarshrarora@gmail.com', password: 'Asquared@123', name: 'Akarsh Arora' },
    { email: 'info@scalepods.co', password: 'ScalePods@123', name: 'ScalePods Admin' }
  ];

  for (const u of users) {
    console.log(`Processing ${u.email}...`);
    const hash = await bcrypt.hash(u.password, 10);
    
    const { data, error } = await supabase
      .from('users')
      .upsert({
        email: u.email,
        password_hash: hash,
        full_name: u.name
      }, { onConflict: 'email' });

    if (error) {
      console.error(`Error for ${u.email}:`, error);
    } else {
      console.log(`Success for ${u.email}`);
    }
  }
}

run();
