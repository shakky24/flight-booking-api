import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { FlightsModule } from '../flights/flights.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [FlightsModule, SupabaseModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
