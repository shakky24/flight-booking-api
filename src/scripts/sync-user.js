require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials from supabase.config.ts
const supabaseUrl = 'https://lqegazuelocbxjmtevti.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZWdhenVlbG9jYnhqbXRldnRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NTYwNzIsImV4cCI6MjA1ODEzMjA3Mn0.F4sVu3mQ6dJsCA6Kz66zPazGdB7a51TMovNUOZjT2mo';
const supabase = createClient(supabaseUrl, supabaseKey);

// User details to add to the users table
const userId = '5038a978-6c3f-4a71-a38a-0dfc19c14d8c';
const userEmail = 'shakthiseshadri@gmail.com';

async function syncUser() {
  try {
    console.log(`Creating user record for: ${userEmail} (${userId})`);
    
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (existingUser) {
      console.log('User already exists in database');
      return;
    }
    
    // Insert user record
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: userEmail
      })
      .select();
    
    if (error) {
      console.error('Error creating user:', error.message);
      return;
    }
    
    console.log('User successfully created:', data);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

syncUser();
