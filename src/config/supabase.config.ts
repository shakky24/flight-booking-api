import { registerAs } from '@nestjs/config';

export default registerAs('supabase', () => ({
  url: process.env.SUPABASE_URL || 'https://lqegazuelocbxjmtevti.supabase.co',
  key: process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZWdhenVlbG9jYnhqbXRldnRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NTYwNzIsImV4cCI6MjA1ODEzMjA3Mn0.F4sVu3mQ6dJsCA6Kz66zPazGdB7a51TMovNUOZjT2mo',
  jwt_secret: process.env.JWT_SECRET,
}));
