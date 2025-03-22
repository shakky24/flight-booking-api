import { Test, TestingModule } from '@nestjs/testing';
import { FlightsController } from '../../../src/modules/flights/flights.controller';
import { FlightsService } from '../../../src/modules/flights/flights.service';
import { SearchFlightDto, CabinClass, TripType } from '../../../src/modules/flights/dto/search-flight.dto';

describe('FlightsController', () => {
  let controller: FlightsController;
  let service: FlightsService;

  const mockFlightsService = {
    searchFlights: jest.fn(),
    getFlightById: jest.fn(),
    getLocations: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlightsController],
      providers: [
        {
          provide: FlightsService,
          useValue: mockFlightsService,
        },
      ],
    }).compile();

    controller = module.get<FlightsController>(FlightsController);
    service = module.get<FlightsService>(FlightsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchFlights', () => {
    it('should call service.searchFlights with correct parameters', async () => {
      const searchDto: SearchFlightDto = {
        origin: 'JFK',
        destination: 'LAX',
        departureDate: '2025-04-15',
        returnDate: '2025-04-22',
        cabinClass: CabinClass.ECONOMY,
        tripType: TripType.ROUND_TRIP,
        passengers: 2
      };

      const expectedResult = {
        outbound: [
          { id: '1', flightNumber: 'AA101', price: 300 }
        ],
        return: [
          { id: '2', flightNumber: 'AA102', price: 350 }
        ]
      };

      mockFlightsService.searchFlights.mockResolvedValue(expectedResult);

      const result = await controller.searchFlights(searchDto);

      expect(service.searchFlights).toHaveBeenCalledWith(searchDto);
      expect(result).toBe(expectedResult);
    });

    it('should handle one-way flight searches', async () => {
      const searchDto: SearchFlightDto = {
        origin: 'JFK',
        destination: 'LAX',
        departureDate: '2025-04-15',
        cabinClass: CabinClass.ECONOMY,
        tripType: TripType.ONE_WAY,
        passengers: 1
      };

      const expectedResult = {
        outbound: [
          { id: '1', flightNumber: 'AA101', price: 300 }
        ],
        return: null
      };

      mockFlightsService.searchFlights.mockResolvedValue(expectedResult);

      const result = await controller.searchFlights(searchDto);

      expect(service.searchFlights).toHaveBeenCalledWith(searchDto);
      expect(result).toBe(expectedResult);
    });
  });

  describe('getFlight', () => {
    it('should call service.getFlightById with correct id', async () => {
      const flightId = '123e4567-e89b-12d3-a456-426614174000';
      const expectedResult = {
        id: flightId,
        flightNumber: 'AA123',
        origin: 'JFK',
        destination: 'LAX',
        flight_cabin_classes: [
          {
            id: '1',
            cabin_class: CabinClass.ECONOMY,
            price: 300
          }
        ]
      };

      mockFlightsService.getFlightById.mockResolvedValue(expectedResult);

      const result = await controller.getFlight(flightId);

      expect(service.getFlightById).toHaveBeenCalledWith(flightId);
      expect(result).toBe(expectedResult);
    });
  });

  describe('getLocations', () => {
    it('should call service.getLocations', async () => {
      const expectedResult = [
        { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York' },
        { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles' }
      ];

      mockFlightsService.getLocations.mockResolvedValue(expectedResult);

      const result = await controller.getLocations();

      expect(service.getLocations).toHaveBeenCalled();
      expect(result).toBe(expectedResult);
    });
  });
});
