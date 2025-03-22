import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function createUserRecord(authToken: string) {
  try {
    // Get the authenticated user details from the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(authToken);
    
    if (userError || !user) {
      console.error('Error getting user:', userError?.message || 'User not found');
      return;
    }

    console.log('Found authenticated user:', user.email);
    
    // Check if user already exists in the users table
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();
      
    if (existingUser) {
      console.log('User already exists in users table:', existingUser.id);
      return;
    }
    
    // Insert the user record with the same ID as the auth user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
      })
      .select()
      .single();
      
    if (insertError) {
      console.error('Error creating user record:', insertError.message);
      return;
    }
    
    console.log('Successfully created user record:', newUser.id);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Get token from command line arguments
const authToken = process.argv[2];

if (!authToken) {
  console.error('Please provide your JWT token as a command line argument');
  console.log('Usage: ts-node create-user-record.ts YOUR_JWT_TOKEN');
  process.exit(1);
}

createUserRecord(authToken).then(() => process.exit(0));
