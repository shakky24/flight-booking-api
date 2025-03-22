import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { CreateBookingDto } from './dto/create-booking.dto';
import { FlightsService } from '../flights/flights.service';

enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled'
}

@Injectable()
export class BookingsService {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly flightsService: FlightsService,
  ) {}

  async createBooking(userId: string, createBookingDto: CreateBookingDto) {
    const outboundFlightId = typeof createBookingDto.flights.outbound === 'string' 
      ? createBookingDto.flights.outbound 
      : createBookingDto.flights.outbound.id;
    
    const outboundFlight = await this.flightsService.getFlightById(outboundFlightId);
    if (!outboundFlight) {
      throw new NotFoundException('Outbound flight not found');
    }

    let returnFlightId = null;
    if (createBookingDto.flights.return) {
      returnFlightId = typeof createBookingDto.flights.return === 'string'
        ? createBookingDto.flights.return
        : createBookingDto.flights.return.id;
      
      const returnFlight = await this.flightsService.getFlightById(returnFlightId);
      if (!returnFlight) {
        throw new NotFoundException('Return flight not found');
      }
    }

    const { data: booking, error } = await this.supabase.rpc('create_booking', {
      p_user_id: userId,
      p_outbound_flight_id: outboundFlightId,
      p_return_flight_id: returnFlightId,
      p_cabin_class: createBookingDto.flights.cabinClass,
      p_cabin_class_id: createBookingDto.flights.cabinClassId,
      p_total_price: createBookingDto.totalPrice,
      p_contact_email: createBookingDto.contactEmail,
      p_contact_phone: createBookingDto.contactPhone,
      p_passengers: createBookingDto.passengers,
      p_booking_date: createBookingDto.bookingDate
    });

    if (error) {
      throw new BadRequestException(`Failed to create booking: ${error.message}`);
    }

    return booking;
  }

  async findAll(userId: string) {
    // Modify the query to fetch bookings with flight details including origin and destination
    const { data, error } = await this.supabase
      .from('bookings')
      .select(`
        *,
        outbound_flight:outbound_flight_id(
          *,
          origin:airports!flights_origin_id_fkey(code, name, city, country),
          destination:airports!flights_destination_id_fkey(code, name, city, country)
        ),
        return_flight:return_flight_id(
          *,
          origin:airports!flights_origin_id_fkey(code, name, city, country),
          destination:airports!flights_destination_id_fkey(code, name, city, country)
        )
      `)
      .eq('user_id', userId)
      .order('booking_date', { ascending: false });

    if (error) {
      throw new BadRequestException(`Failed to fetch bookings: ${error.message}`);
    }

    return data || [];
  }

  async findOne(userId: string, id: string) {
    const { data, error } = await this.supabase
      .from('bookings')
      .select(`
        *,
        outbound_flight:outbound_flight_id(
          *,
          origin:airports!flights_origin_id_fkey(code, name, city, country),
          destination:airports!flights_destination_id_fkey(code, name, city, country)
        ),
        return_flight:return_flight_id(
          *,
          origin:airports!flights_origin_id_fkey(code, name, city, country),
          destination:airports!flights_destination_id_fkey(code, name, city, country)
        )
      `)
      .eq('id', id)
      .eq('user_id', userId);
    
    // First check for query errors
    if (error) {
      throw new BadRequestException(`Failed to fetch booking: ${error.message}`);
    }
    
    // Check if we got any results
    if (!data || data.length === 0) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }
    
    // Return the first result
    return data[0];
  }

  async updateStatus(userId: string, id: string, status: BookingStatus) {
    const { data, error } = await this.supabase.rpc('update_booking_status', {
      p_booking_id: id,
      p_user_id: userId,
      p_status: status
    });

    if (error) {
      throw new BadRequestException(`Failed to update booking status: ${error.message}`);
    }

    if (!data) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return data;
  }

  async cancelBooking(id: string, userId: string) {
    return this.updateStatus(userId, id, BookingStatus.CANCELLED);
  }
}
