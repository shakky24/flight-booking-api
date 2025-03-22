import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

export interface AuthCredentialsDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: any;
  session: any;
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseClient) {}

  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<AuthResponse> {
    const { email, password } = authCredentialsDto;
    
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    // Create a record in the users table with the same ID as the auth user
    if (data.user) {
      // Create a user record in the custom users table with the same UUID
      const { error: insertError } = await this.supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
        });

      if (insertError) {
        console.error('Failed to create user record:', insertError);
        // We don't throw here to avoid preventing sign-up, but this should be logged/monitored
      }
    }

    return {
      user: data.user,
      session: data.session,
      accessToken: data.session?.access_token,
    };
  }

  async signIn(authCredentialsDto: AuthCredentialsDto): Promise<AuthResponse> {
    const { email, password } = authCredentialsDto;
    
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    // Check if this user has a record in the users table, if not, create one
    if (data.user) {
      const { data: existingUser, error: checkError } = await this.supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single();
        
      if (checkError && checkError.code === 'PGRST116') { // No rows found
        // Create the user record if it doesn't exist
        const { error: insertError } = await this.supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
          });
          
        if (insertError) {
          console.error('Failed to create user record during sign-in:', insertError);
        }
      }
    }

    return {
      user: data.user,
      session: data.session,
      accessToken: data.session.access_token,
    };
  }

  async signOut(token: string): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    
    if (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  async getUser(token: string): Promise<any> {
    const { data, error } = await this.supabase.auth.getUser(token);
    
    if (error || !data.user) {
      throw new UnauthorizedException('Invalid token');
    }
    
    return data.user;
  }
}
