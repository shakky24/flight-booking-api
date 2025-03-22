import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from '../../../src/modules/bookings/bookings.controller';
import { BookingsService } from '../../../src/modules/bookings/bookings.service';
import { CreateBookingDto } from '../../../src/modules/bookings/dto/create-booking.dto';
import { CabinClass } from '../../../src/modules/flights/dto/search-flight.dto';
import { UnauthorizedException } from '@nestjs/common';

describe('BookingsController', () => {
  let controller: BookingsController;
  let service: BookingsService;

  const mockBookingsService = {
    createBooking: jest.fn(),
    getUserBookings: jest.fn(),
    getBookingById: jest.fn(),
    cancelBooking: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        {
          provide: BookingsService,
          useValue: mockBookingsService,
        },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    service = module.get<BookingsService>(BookingsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createBooking', () => {
    it('should create a booking when user is authenticated', async () => {
      const userId = 'user-123';
      const mockReq = { user: { id: userId } };
      
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
        totalPrice: 500
      };

      const expectedResult = {
        id: 'booking-123',
        userId,
        status: 'CONFIRMED',
        ...createBookingDto
      };

      mockBookingsService.createBooking.mockResolvedValue(expectedResult);

      const result = await controller.createBooking(mockReq, createBookingDto);

      expect(service.createBooking).toHaveBeenCalledWith(userId, createBookingDto);
      expect(result).toBe(expectedResult);
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      const mockReq = { user: null };
      const createBookingDto = {} as CreateBookingDto;

      await expect(controller.createBooking(mockReq, createBookingDto))
        .rejects.toThrow(UnauthorizedException);
      
      expect(service.createBooking).not.toHaveBeenCalled();
    });
  });

  describe('getUserBookings', () => {
    it('should return user bookings when user is authenticated', async () => {
      const userId = 'user-123';
      const mockReq = { user: { id: userId } };
      
      const expectedResult = [
        {
          id: 'booking-123',
          userId,
          status: 'CONFIRMED',
          totalPrice: 500
        },
        {
          id: 'booking-456',
          userId,
          status: 'PENDING',
          totalPrice: 700
        }
      ];

      mockBookingsService.getUserBookings.mockResolvedValue(expectedResult);

      const result = await controller.getUserBookings(mockReq);

      expect(service.getUserBookings).toHaveBeenCalledWith(userId);
      expect(result).toBe(expectedResult);
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      const mockReq = { user: null };

      await expect(controller.getUserBookings(mockReq))
        .rejects.toThrow(UnauthorizedException);
      
      expect(service.getUserBookings).not.toHaveBeenCalled();
    });
  });

  describe('getBookingById', () => {
    it('should return a booking by id when user is authenticated and owns the booking', async () => {
      const userId = 'user-123';
      const bookingId = 'booking-123';
      const mockReq = { user: { id: userId } };
      
      const expectedResult = {
        id: bookingId,
        userId,
        status: 'CONFIRMED',
        totalPrice: 500
      };

      mockBookingsService.getBookingById.mockResolvedValue(expectedResult);

      const result = await controller.getBookingById(mockReq, bookingId);

      expect(service.getBookingById).toHaveBeenCalledWith(bookingId, userId);
      expect(result).toBe(expectedResult);
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      const mockReq = { user: null };
      const bookingId = 'booking-123';

      await expect(controller.getBookingById(mockReq, bookingId))
        .rejects.toThrow(UnauthorizedException);
      
      expect(service.getBookingById).not.toHaveBeenCalled();
    });
  });

  describe('cancelBooking', () => {
    it('should cancel a booking when user is authenticated and owns the booking', async () => {
      const userId = 'user-123';
      const bookingId = 'booking-123';
      const mockReq = { user: { id: userId } };
      
      const expectedResult = {
        id: bookingId,
        userId,
        status: 'CANCELLED',
        totalPrice: 500
      };

      mockBookingsService.cancelBooking.mockResolvedValue(expectedResult);

      const result = await controller.cancelBooking(mockReq, bookingId);

      expect(service.cancelBooking).toHaveBeenCalledWith(bookingId, userId);
      expect(result).toBe(expectedResult);
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      const mockReq = { user: null };
      const bookingId = 'booking-123';

      await expect(controller.cancelBooking(mockReq, bookingId))
        .rejects.toThrow(UnauthorizedException);
      
      expect(service.cancelBooking).not.toHaveBeenCalled();
    });
  });
});
