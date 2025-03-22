import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { CreateBookingDto } from '../../src/modules/bookings/dto/create-booking.dto';
import { CabinClass } from '../../src/modules/flights/dto/search-flight.dto';
import { AuthCredentialsDto } from '../../src/modules/auth/auth.service';

describe('BookingsController (Integration)', () => {
  let app: INestApplication;
  let authToken: string;
  const userId = 'test-user-id';
  
  // Mock database functions to avoid actual DB calls
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn(),
  };

  // Mock client for transactions
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
    on: jest.fn(),
  };

  // Mock Supabase client
  const mockSupabaseClient = {
    auth: {
      signInWithPassword: jest.fn(),
      getUser: jest.fn(),
    }
  };

  beforeAll(async () => {
    // Configure mock responses
    mockPool.connect.mockResolvedValue(mockClient);
    
    // Mock Supabase auth responses
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: userId, email: 'test@example.com' },
        session: { access_token: 'test-token' }
      },
      error: null
    });

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: userId, email: 'test@example.com' } },
      error: null
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider('PG_CONNECTION')
    .useValue(mockPool)
    .overrideProvider('SUPABASE_CLIENT')
    .useValue(mockSupabaseClient)
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

    // Get auth token for protected endpoints
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: 'test@example.com',
        password: 'password123'
      } as AuthCredentialsDto);
    
    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/bookings (POST)', () => {
    it('should create a new booking when authenticated', async () => {
      const createBookingDto: CreateBookingDto = {
        flights: {
          outbound: 'flight-123',
          cabinClass: CabinClass.ECONOMY,
          cabinClassId: 'cabin-class-123'
        },
        contactEmail: 'test@example.com',
        contactPhone: '1234567890',
        passengers: [
          {
            gender: 'Mr',
            firstName: 'John',
            lastName: 'Doe',
            birthDay: '1',
            birthMonth: 'January',
            birthYear: '1990',
            passportNumber: 'AB1234567',
            passportCountry: 'USA',
            passportExpiryDay: '15',
            passportExpiryMonth: 'April',
            passportExpiryYear: '2030'
          }
        ],
        totalPrice: 500,
        bookingDate: new Date().toISOString()
      };

      // Mock flight availability check
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ available_seats: 10 }] })
        .mockResolvedValueOnce({
          rows: [{
            id: 'booking-123',
            user_id: userId,
            status: 'CONFIRMED',
            flights: {
              outbound: createBookingDto.flights.outbound,
              cabinClass: createBookingDto.flights.cabinClass
            },
            passengers: createBookingDto.passengers,
            contact_email: createBookingDto.contactEmail,
            contact_phone: createBookingDto.contactPhone,
            total_price: createBookingDto.totalPrice
          }]
        });

      const response = await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createBookingDto)
        .expect(201);

      expect(response.body.id).toBe('booking-123');
      expect(response.body.status).toBe('CONFIRMED');
    });

    it('should return 401 when not authenticated', async () => {
      const createBookingDto: CreateBookingDto = {
        flights: {
          outbound: 'flight-123',
          cabinClass: CabinClass.ECONOMY,
          cabinClassId: 'cabin-class-123'
        },
        contactEmail: 'test@example.com',
        contactPhone: '1234567890',
        passengers: [
          {
            gender: 'Mr',
            firstName: 'John',
            lastName: 'Doe',
            birthDay: '1',
            birthMonth: 'January',
            birthYear: '1990',
            passportNumber: 'AB1234567',
            passportCountry: 'USA',
            passportExpiryDay: '15',
            passportExpiryMonth: 'April',
            passportExpiryYear: '2030'
          }
        ],
        totalPrice: 500,
        bookingDate: new Date().toISOString()
      };

      await request(app.getHttpServer())
        .post('/bookings')
        .send(createBookingDto)
        .expect(401);
    });

    it('should return 400 for invalid booking data', async () => {
      const invalidBookingDto = {
        // missing required fields
        contactEmail: 'test@example.com',
        contactPhone: '1234567890',
        passengers: [
          {
            gender: 'Mr',
            firstName: 'John',
            lastName: 'Doe',
            birthDay: '1',
            birthMonth: 'January',
            birthYear: '1990',
            passportNumber: 'AB1234567',
            passportCountry: 'USA',
            passportExpiryDay: '15',
            passportExpiryMonth: 'April',
            passportExpiryYear: '2030'
          }
        ]
        // missing flights, totalPrice, bookingDate
      };

      await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidBookingDto)
        .expect(400);
    });
  });

  describe('/bookings (GET)', () => {
    it('should return user bookings when authenticated', async () => {
      const mockBookings = [
        {
          id: 'booking-123',
          user_id: userId,
          status: 'CONFIRMED',
          flights: {
            outbound: 'flight-123',
            cabinClass: CabinClass.ECONOMY
          },
          total_price: 500
        },
        {
          id: 'booking-456',
          user_id: userId,
          status: 'CANCELLED',
          flights: {
            outbound: 'flight-456',
            cabinClass: CabinClass.BUSINESS
          },
          total_price: 1200
        }
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockBookings });

      const response = await request(app.getHttpServer())
        .get('/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].id).toBe('booking-123');
      expect(response.body[1].id).toBe('booking-456');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/bookings')
        .expect(401);
    });
  });

  describe('/bookings/:id (GET)', () => {
    it('should return booking details when authenticated and user owns the booking', async () => {
      const bookingId = 'booking-123';
      
      const mockBooking = {
        id: bookingId,
        user_id: userId,
        status: 'CONFIRMED',
        flights: {
          outbound: 'flight-123',
          cabinClass: CabinClass.ECONOMY
        },
        total_price: 500
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockBooking] });

      const response = await request(app.getHttpServer())
        .get(`/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(bookingId);
      expect(response.body.status).toBe('CONFIRMED');
    });

    it('should return 401 when not authenticated', async () => {
      const bookingId = 'booking-123';
      
      await request(app.getHttpServer())
        .get(`/bookings/${bookingId}`)
        .expect(401);
    });

    it('should return 404 for non-existent booking', async () => {
      const nonExistentId = 'non-existent-booking';
      
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await request(app.getHttpServer())
        .get(`/bookings/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/bookings/:id/cancel (POST)', () => {
    it('should cancel a booking when authenticated and user owns the booking', async () => {
      const bookingId = 'booking-123';
      
      // Mock get booking query
      mockPool.query
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: bookingId,
            user_id: userId,
            status: 'CONFIRMED' 
          }] 
        })
        // Mock update booking status query
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: bookingId,
            user_id: userId,
            status: 'CANCELLED' 
          }] 
        });

      const response = await request(app.getHttpServer())
        .post(`/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(bookingId);
      expect(response.body.status).toBe('CANCELLED');
    });

    it('should return 401 when not authenticated', async () => {
      const bookingId = 'booking-123';
      
      await request(app.getHttpServer())
        .post(`/bookings/${bookingId}/cancel`)
        .expect(401);
    });

    it('should return 404 for non-existent booking', async () => {
      const nonExistentId = 'non-existent-booking';
      
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await request(app.getHttpServer())
        .post(`/bookings/${nonExistentId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 400 if booking is already cancelled', async () => {
      const bookingId = 'already-cancelled-booking';
      
      mockPool.query.mockResolvedValueOnce({ 
        rows: [{ 
          id: bookingId,
          user_id: userId,
          status: 'CANCELLED' 
        }] 
      });

      await request(app.getHttpServer())
        .post(`/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });
});
