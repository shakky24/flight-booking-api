import { Test, TestingModule } from '@nestjs/testing';
import { FlightsService } from '../../../src/modules/flights/flights.service';
import { SearchFlightDto, CabinClass, TripType } from '../../../src/modules/flights/dto/search-flight.dto';
import { NotFoundException } from '@nestjs/common';

describe('FlightsService', () => {
  let service: FlightsService;

  // Mock database client
  const mockPool = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlightsService,
        {
          provide: 'PG_CONNECTION',
          useValue: mockPool,
        },
      ],
    }).compile();

    service = module.get<FlightsService>(FlightsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchFlights', () => {
    it('should return flights for a one-way trip', async () => {
      const searchDto: SearchFlightDto = {
        origin: 'JFK',
        destination: 'LAX',
        departureDate: '2025-04-15',
        cabinClass: CabinClass.ECONOMY,
        tripType: TripType.ONE_WAY,
        passengers: 1
      };

      const mockQueryResult = {
        rows: [
          {
            id: '1',
            flight_number: 'AA101',
            origin: 'JFK',
            destination: 'LAX',
            departure_date: '2025-04-15T08:00:00Z',
            arrival_date: '2025-04-15T11:00:00Z',
            cabin_class: 'ECONOMY',
            price: 300,
            available_seats: 10
          }
        ]
      };

      mockPool.query.mockResolvedValue(mockQueryResult);

      const result = await service.searchFlights(searchDto);

      expect(mockPool.query).toHaveBeenCalled();
      expect(result.outbound).toHaveLength(1);
      expect(result.outbound[0].flight_number).toBe('AA101');
      expect(result.return).toBeNull();
    });

    it('should return flights for a round-trip', async () => {
      const searchDto: SearchFlightDto = {
        origin: 'JFK',
        destination: 'LAX',
        departureDate: '2025-04-15',
        returnDate: '2025-04-22',
        cabinClass: CabinClass.ECONOMY,
        tripType: TripType.ROUND_TRIP,
        passengers: 2
      };

      // Mock outbound flights
      const mockOutboundResult = {
        rows: [
          {
            id: '1',
            flight_number: 'AA101',
            origin: 'JFK',
            destination: 'LAX',
            departure_date: '2025-04-15T08:00:00Z',
            arrival_date: '2025-04-15T11:00:00Z',
            cabin_class: 'ECONOMY',
            price: 300,
            available_seats: 10
          }
        ]
      };

      // Mock return flights
      const mockReturnResult = {
        rows: [
          {
            id: '2',
            flight_number: 'AA102',
            origin: 'LAX',
            destination: 'JFK',
            departure_date: '2025-04-22T12:00:00Z',
            arrival_date: '2025-04-22T15:00:00Z',
            cabin_class: 'ECONOMY',
            price: 350,
            available_seats: 8
          }
        ]
      };

      // Mock the query calls sequentially
      mockPool.query
        .mockResolvedValueOnce(mockOutboundResult)
        .mockResolvedValueOnce(mockReturnResult);

      const result = await service.searchFlights(searchDto);

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(result.outbound).toHaveLength(1);
      expect(result.outbound[0].flight_number).toBe('AA101');
      expect(result.return).toHaveLength(1);
      expect(result.return[0].flight_number).toBe('AA102');
    });
  });

  describe('getFlightById', () => {
    it('should return a flight by id', async () => {
      const flightId = '123e4567-e89b-12d3-a456-426614174000';
      
      const mockQueryResult = {
        rows: [
          {
            id: flightId,
            flight_number: 'AA123',
            origin: 'JFK',
            destination: 'LAX',
            departure_date: '2025-04-15T08:00:00Z',
            arrival_date: '2025-04-15T11:00:00Z',
            cabin_classes: [
              {
                id: '1',
                cabin_class: 'ECONOMY',
                price: 300,
                available_seats: 10
              },
              {
                id: '2',
                cabin_class: 'BUSINESS',
                price: 800,
                available_seats: 5
              }
            ]
          }
        ]
      };

      mockPool.query.mockResolvedValue(mockQueryResult);

      const result = await service.getFlightById(flightId);

      expect(mockPool.query).toHaveBeenCalled();
      expect(result.id).toBe(flightId);
      expect(result.flight_number).toBe('AA123');
      expect(result.cabin_classes).toHaveLength(2);
    });

    it('should throw NotFoundException if flight not found', async () => {
      const flightId = 'non-existent-id';
      
      mockPool.query.mockResolvedValue({ rows: [] });

      await expect(service.getFlightById(flightId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLocations', () => {
    it('should return a list of airports', async () => {
      const mockQueryResult = {
        rows: [
          { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York' },
          { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles' }
        ]
      };

      mockPool.query.mockResolvedValue(mockQueryResult);

      const result = await service.getLocations();

      expect(mockPool.query).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('JFK');
      expect(result[1].code).toBe('LAX');
    });
  });
});
