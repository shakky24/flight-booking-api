import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from '../../../src/modules/bookings/bookings.service';
import { CreateBookingDto } from '../../../src/modules/bookings/dto/create-booking.dto';
import { CabinClass } from '../../../src/modules/flights/dto/search-flight.dto';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('BookingsService', () => {
  let service: BookingsService;

  // Mock database client
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn(),
  };

  // Mock client object for transactions
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
    on: jest.fn(),
  };

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    mockPool.connect.mockResolvedValue(mockClient);
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: 'PG_CONNECTION',
          useValue: mockPool,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBooking', () => {
    it('should create a one-way booking successfully', async () => {
      const userId = 'user-123';
      
      const createBookingDto: CreateBookingDto = {
        outboundFlightId: 'flight-123',
        cabinClass: CabinClass.ECONOMY,
        contactEmail: 'test@example.com',
        contactPhone: '1234567890',
        passengers: [
          {
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1990-01-01',
            passportNumber: 'AB1234567',
          }
        ],
        totalPrice: 500
      };

      // Mock check flight availability
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ available_seats: 10 }] }) // Outbound flight seats check
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 'booking-123',
            status: 'CONFIRMED',
            user_id: userId,
            outbound_flight_id: createBookingDto.outboundFlightId,
            cabin_class: createBookingDto.cabinClass,
            passengers: createBookingDto.passengers,
            contact_email: createBookingDto.contactEmail,
            contact_phone: createBookingDto.contactPhone,
            total_price: createBookingDto.totalPrice,
            created_at: new Date().toISOString()
          }] 
        }); // Create booking query

      const result = await service.createBooking(userId, createBookingDto);

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledTimes(2);
      expect(result.id).toBe('booking-123');
      expect(result.status).toBe('CONFIRMED');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should create a round-trip booking successfully', async () => {
      const userId = 'user-123';
      
      const createBookingDto: CreateBookingDto = {
        outboundFlightId: 'flight-123',
        returnFlightId: 'flight-456',
        cabinClass: CabinClass.ECONOMY,
        contactEmail: 'test@example.com',
        contactPhone: '1234567890',
        passengers: [
          {
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1990-01-01',
            passportNumber: 'AB1234567',
          }
        ],
        totalPrice: 800
      };

      // Mock check flight availability
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ available_seats: 10 }] }) // Outbound flight seats check
        .mockResolvedValueOnce({ rows: [{ available_seats: 8 }] }) // Return flight seats check
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 'booking-123',
            status: 'CONFIRMED',
            user_id: userId,
            outbound_flight_id: createBookingDto.outboundFlightId,
            return_flight_id: createBookingDto.returnFlightId,
            cabin_class: createBookingDto.cabinClass,
            passengers: createBookingDto.passengers,
            contact_email: createBookingDto.contactEmail,
            contact_phone: createBookingDto.contactPhone,
            total_price: createBookingDto.totalPrice,
            created_at: new Date().toISOString()
          }] 
        }); // Create booking query

      const result = await service.createBooking(userId, createBookingDto);

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledTimes(3);
      expect(result.id).toBe('booking-123');
      expect(result.status).toBe('CONFIRMED');
      expect(result.return_flight_id).toBe(createBookingDto.returnFlightId);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException if outbound flight has no available seats', async () => {
      const userId = 'user-123';
      
      const createBookingDto: CreateBookingDto = {
        outboundFlightId: 'flight-123',
        cabinClass: CabinClass.ECONOMY,
        contactEmail: 'test@example.com',
        contactPhone: '1234567890',
        passengers: [
          {
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1990-01-01',
            passportNumber: 'AB1234567',
          }
        ],
        totalPrice: 500
      };

      // Mock check flight availability - no seats available
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ available_seats: 0 }] });

      await expect(service.createBooking(userId, createBookingDto))
        .rejects.toThrow(BadRequestException);
      
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getUserBookings', () => {
    it('should return all bookings for a user', async () => {
      const userId = 'user-123';
      
      const mockBookings = [
        { 
          id: 'booking-123',
          status: 'CONFIRMED',
          user_id: userId,
          outbound_flight_id: 'flight-123',
          cabin_class: 'ECONOMY',
          total_price: 500
        },
        { 
          id: 'booking-456',
          status: 'CANCELLED',
          user_id: userId,
          outbound_flight_id: 'flight-789',
          cabin_class: 'BUSINESS',
          total_price: 1200
        }
      ];

      mockPool.query.mockResolvedValue({ rows: mockBookings });

      const result = await service.getUserBookings(userId);

      expect(mockPool.query).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('booking-123');
      expect(result[1].id).toBe('booking-456');
    });

    it('should return empty array if user has no bookings', async () => {
      const userId = 'user-with-no-bookings';
      
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await service.getUserBookings(userId);

      expect(mockPool.query).toHaveBeenCalled();
      expect(result).toHaveLength(0);
    });
  });

  describe('getBookingById', () => {
    it('should return a booking by id if user owns it', async () => {
      const userId = 'user-123';
      const bookingId = 'booking-123';
      
      const mockBooking = { 
        id: bookingId,
        status: 'CONFIRMED',
        user_id: userId,
        outbound_flight_id: 'flight-123',
        cabin_class: 'ECONOMY',
        total_price: 500
      };

      mockPool.query.mockResolvedValue({ rows: [mockBooking] });

      const result = await service.getBookingById(bookingId, userId);

      expect(mockPool.query).toHaveBeenCalled();
      expect(result.id).toBe(bookingId);
    });

    it('should throw NotFoundException if booking does not exist', async () => {
      const userId = 'user-123';
      const bookingId = 'non-existent-booking';
      
      mockPool.query.mockResolvedValue({ rows: [] });

      await expect(service.getBookingById(bookingId, userId))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the booking', async () => {
      const userId = 'user-123';
      const anotherUserId = 'user-456';
      const bookingId = 'booking-123';
      
      const mockBooking = { 
        id: bookingId,
        status: 'CONFIRMED',
        user_id: anotherUserId, // different user owns the booking
        outbound_flight_id: 'flight-123',
        cabin_class: 'ECONOMY',
        total_price: 500
      };

      mockPool.query.mockResolvedValue({ rows: [mockBooking] });

      await expect(service.getBookingById(bookingId, userId))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('cancelBooking', () => {
    it('should cancel a booking if user owns it', async () => {
      const userId = 'user-123';
      const bookingId = 'booking-123';
      
      // Mock get booking query
      mockPool.query
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: bookingId,
            status: 'CONFIRMED',
            user_id: userId
          }] 
        })
        // Mock update booking status query
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: bookingId,
            status: 'CANCELLED',
            user_id: userId
          }] 
        });

      const result = await service.cancelBooking(bookingId, userId);

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(result.id).toBe(bookingId);
      expect(result.status).toBe('CANCELLED');
    });

    it('should throw NotFoundException if booking does not exist', async () => {
      const userId = 'user-123';
      const bookingId = 'non-existent-booking';
      
      mockPool.query.mockResolvedValue({ rows: [] });

      await expect(service.cancelBooking(bookingId, userId))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the booking', async () => {
      const userId = 'user-123';
      const anotherUserId = 'user-456';
      const bookingId = 'booking-123';
      
      mockPool.query.mockResolvedValue({ 
        rows: [{ 
          id: bookingId,
          status: 'CONFIRMED',
          user_id: anotherUserId // different user owns the booking
        }] 
      });

      await expect(service.cancelBooking(bookingId, userId))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if booking is already cancelled', async () => {
      const userId = 'user-123';
      const bookingId = 'booking-123';
      
      mockPool.query.mockResolvedValue({ 
        rows: [{ 
          id: bookingId,
          status: 'CANCELLED', // booking is already cancelled
          user_id: userId
        }] 
      });

      await expect(service.cancelBooking(bookingId, userId))
        .rejects.toThrow(BadRequestException);
    });
  });
});
