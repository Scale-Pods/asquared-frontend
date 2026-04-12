const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching users:', error);
    
    // Try to list tables via RPC if available or just check another table
    console.log('Attempting to list tables...');
    // In Supabase, you can't easily list tables via supabase-js without an RPC call
  } else {
    console.log('Users table exists. Found:', data);
  }
}

check();
