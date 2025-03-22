import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: SupabaseClient,
      useFactory: (configService: ConfigService) => {
        const supabaseUrl = configService.get('supabase.url');
        const supabaseKey = configService.get('supabase.key');
        return createClient(supabaseUrl, supabaseKey);
      },
      inject: [ConfigService],
    },
  ],
  exports: [SupabaseClient],
})
export class SupabaseModule {}
