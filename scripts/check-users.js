const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  // Get users from the users table
  const { data: dbUsers, error: dbError } = await supabase
    .from('users')
    .select('*');
  
  if (dbError) {
    console.error('Error fetching users from database:', dbError.message);
    return;
  }
  
  console.log('Users in your database:');
  console.log(dbUsers);
}

checkUsers();
