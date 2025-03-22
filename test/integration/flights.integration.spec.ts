import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { SearchFlightDto, CabinClass, TripType } from '../../src/modules/flights/dto/search-flight.dto';

describe('FlightsController (Integration)', () => {
  let app: INestApplication;
  
  // Mock database functions to avoid actual DB calls
  const mockPool = {
    query: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider('PG_CONNECTION')
    .useValue(mockPool)
    .compile();

    app = moduleFixture.createNestApplication();
    
    // Apply the same pipes as in the main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/flights/search (POST)', () => {
    it('should return flight search results for valid one-way search', async () => {
      // Mock database response
      mockPool.query.mockResolvedValueOnce({
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
        ],
      });

      const searchDto: SearchFlightDto = {
        origin: 'JFK',
        destination: 'LAX',
        departureDate: '2025-04-15',
        cabinClass: CabinClass.ECONOMY,
        tripType: TripType.ONE_WAY,
        passengers: 1
      };

      const response = await request(app.getHttpServer())
        .post('/flights/search')
        .send(searchDto)
        .expect(200);

      expect(response.body.outbound).toHaveLength(1);
      expect(response.body.outbound[0].flight_number).toBe('AA101');
      expect(response.body.return).toBeNull();
    });

    it('should return 400 for invalid search criteria', async () => {
      const invalidSearchDto = {
        origin: 'JFK',
        // missing required field: destination
        departureDate: '2025-04-15',
        cabinClass: CabinClass.ECONOMY,
        tripType: TripType.ONE_WAY,
        passengers: 1
      };

      await request(app.getHttpServer())
        .post('/flights/search')
        .send(invalidSearchDto)
        .expect(400);
    });

    it('should validate round-trip requires return date', async () => {
      const invalidRoundTripDto = {
        origin: 'JFK',
        destination: 'LAX',
        departureDate: '2025-04-15',
        // missing returnDate for ROUND_TRIP
        cabinClass: CabinClass.ECONOMY,
        tripType: TripType.ROUND_TRIP,
        passengers: 1
      };

      await request(app.getHttpServer())
        .post('/flights/search')
        .send(invalidRoundTripDto)
        .expect(400);
    });
  });

  describe('/flights/locations (GET)', () => {
    it('should return a list of airport locations', async () => {
      // Mock database response
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York' },
          { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles' }
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/flights/locations')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].code).toBe('JFK');
      expect(response.body[1].code).toBe('LAX');
    });
  });

  describe('/flights/:id (GET)', () => {
    it('should return flight details by id', async () => {
      const flightId = '123e4567-e89b-12d3-a456-426614174000';
      
      // Mock database response
      mockPool.query.mockResolvedValueOnce({
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
        ],
      });

      const response = await request(app.getHttpServer())
        .get(`/flights/${flightId}`)
        .expect(200);

      expect(response.body.id).toBe(flightId);
      expect(response.body.flight_number).toBe('AA123');
      expect(response.body.cabin_classes).toHaveLength(2);
    });

    it('should return 404 for non-existent flight', async () => {
      const nonExistentId = 'non-existent-id';
      
      // Mock database response for non-existent flight
      mockPool.query.mockResolvedValueOnce({
        rows: [],
      });

      await request(app.getHttpServer())
        .get(`/flights/${nonExistentId}`)
        .expect(404);
    });
  });
});
