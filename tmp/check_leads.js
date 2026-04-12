const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  const { data, error } = await supabase
    .from('master_leads')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching master_leads:', error);
  } else {
    console.log('master_leads table exists. Found:', data);
  }
}

check();
