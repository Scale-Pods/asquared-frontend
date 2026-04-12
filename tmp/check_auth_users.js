const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error fetching auth users:', error);
  } else {
    console.log('Auth users count:', data.users.length);
    console.log('Emails:', data.users.map(u => u.email));
  }
}

check();
