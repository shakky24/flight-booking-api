import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SearchFlightDto, CabinClass, TripType } from './dto/search-flight.dto';

@Injectable()
export class FlightsService {
  constructor(private readonly supabase: SupabaseClient) {}

  async searchFlights(searchDto: SearchFlightDto) {
    try {
      // Extract departure date (we need date only, not datetime)
      const departureDate = searchDto.departureDate.split('T')[0];
      
      // Search for outbound flights using the search_flights function
      const { data: outboundFlights, error: outboundError } = await this.supabase
        .rpc('search_flights', {
          p_origin: searchDto.origin,
          p_destination: searchDto.destination,
          p_departure_date: departureDate,
          p_cabin_class: searchDto.cabinClass,
          p_passengers: searchDto.passengers
        });

      if (outboundError) {
        throw new Error(`Error searching for outbound flights: ${outboundError.message}`);
      }

      // For round trips, search return flights
      let returnFlights = [];
      if (searchDto.tripType === TripType.ROUND_TRIP && searchDto.returnDate) {
        const returnDate = searchDto.returnDate.split('T')[0];
        
        const { data: returnData, error: returnError } = await this.supabase
          .rpc('search_flights', {
            p_origin: searchDto.destination, // Swap origin and destination
            p_destination: searchDto.origin,
            p_departure_date: returnDate,
            p_cabin_class: searchDto.cabinClass,
            p_passengers: searchDto.passengers
          });

        if (returnError) {
          throw new Error(`Error searching for return flights: ${returnError.message}`);
        }

        returnFlights = returnData || [];
      }

      return {
        outbound: this.formatFlightResults(outboundFlights || []),
        return: searchDto.tripType === TripType.ROUND_TRIP ? this.formatFlightResults(returnFlights) : null
      };
    } catch (error) {
      throw new Error(`Flight search failed: ${error.message}`);
    }
  }

  async getFlightById(id: string) {
    const { data, error } = await this.supabase
      .from('flights')
      .select(`
        *,
        origin:airports!flights_origin_id_fkey(id, code, name, city, country),
        destination:airports!flights_destination_id_fkey(id, code, name, city, country),
        flight_cabin_classes(id, cabin_class, total_seats, available_seats, price)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error fetching flight: ${error.message}`);
    }

    if (!data) {
      throw new NotFoundException(`Flight with ID ${id} not found`);
    }

    // Format the flight data for the response
    return this.formatSingleFlightResult(data);
  }

  private formatSingleFlightResult(flight: any) {
    // Extract cabin classes
    const cabinClasses = flight.flight_cabin_classes.map(cc => ({
      id: cc.id,
      cabinClass: cc.cabin_class,
      totalSeats: cc.total_seats,
      availableSeats: cc.available_seats,
      price: cc.price
    }));

    // Calculate duration
    const duration = new Date(flight.arrival_time).getTime() - new Date(flight.departure_time).getTime();
    const durationInMinutes = Math.floor(duration / 60000);

    return {
      id: flight.id,
      flightNumber: flight.flight_number,
      origin: {
        id: flight.origin.id,
        code: flight.origin.code,
        name: flight.origin.name,
        city: flight.origin.city,
        country: flight.origin.country
      },
      destination: {
        id: flight.destination.id,
        code: flight.destination.code,
        name: flight.destination.name,
        city: flight.destination.city,
        country: flight.destination.country
      },
      departureTime: flight.departure_time,
      arrivalTime: flight.arrival_time,
      duration: durationInMinutes,
      aircraft: flight.aircraft_type,
      cabinClasses
    };
  }

  async updateAvailableSeats(flightId: string, cabinClass: CabinClass, seatCount: number) {
    const { data: cabinClassData, error: findError } = await this.supabase
      .from('flight_cabin_classes')
      .select('available_seats')
      .eq('flight_id', flightId)
      .eq('cabin_class', cabinClass)
      .single();

    if (findError || !cabinClassData) {
      throw new Error('Flight cabin class not found');
    }

    const newAvailableSeats = cabinClassData.available_seats - seatCount;
    if (newAvailableSeats < 0) {
      throw new Error('Not enough seats available');
    }

    const { error: updateError } = await this.supabase
      .from('flight_cabin_classes')
      .update({ available_seats: newAvailableSeats })
      .eq('flight_id', flightId)
      .eq('cabin_class', cabinClass);

    if (updateError) {
      throw new Error('Error updating seats: ' + updateError.message);
    }
  }

  async getLocations() {
    // Get all airports from the database
    const { data: airports, error } = await this.supabase
      .from('airports')
      .select('code, name, city, country')
      .order('city');

    if (error) {
      throw new Error(`Error fetching airport locations: ${error.message}`);
    }

    return airports.map(airport => ({
      code: airport.code,
      name: airport.name,
      city: airport.city,
      country: airport.country
    }));
  }

  private formatFlightResults(flights: any[]) {
    return flights.map(flight => {
      // Calculate duration in minutes if not already provided
      let durationMin = flight.duration;
      if (!durationMin && flight.arrival_time && flight.departure_time) {
        const durationMs = new Date(flight.arrival_time).getTime() - new Date(flight.departure_time).getTime();
        durationMin = Math.floor(durationMs / 60000);
      }
      
      // Handle both cases: when origin/destination are strings or full objects
      const originCode = typeof flight.origin === 'string' ? flight.origin : flight.origin?.code;
      const destinationCode = typeof flight.destination === 'string' ? flight.destination : flight.destination?.code;
      
      // Fetch airport details if available
      let originObj = null;
      let destinationObj = null;
      
      // If we have the full airport objects, use them
      if (flight.origin && typeof flight.origin === 'object' && flight.origin.code) {
        originObj = flight.origin;
      } else {
        // Otherwise create a simple object with just the code
        originObj = { code: originCode };
      }
      
      if (flight.destination && typeof flight.destination === 'object' && flight.destination.code) {
        destinationObj = flight.destination;
      } else {
        destinationObj = { code: destinationCode };
      }
      
      return {
        id: flight.id,
        flightNumber: flight.flight_number,
        origin: originObj,
        destination: destinationObj,
        departureTime: flight.departure_time,
        arrivalTime: flight.arrival_time,
        duration: durationMin,
        cabinClass: flight.cabin_class,
        cabinClassId: flight.cabin_class_id,
        price: flight.price,
        availableSeats: flight.available_seats,
        aircraft: flight.aircraft_type
      };
    });
  }
}
