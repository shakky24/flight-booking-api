import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export enum CabinClass {
  ECONOMY = 'Economy',
  PREMIUM_ECONOMY = 'Premium Economy', 
  BUSINESS = 'Business',
  FIRST = 'First'
}

export enum TripType {
  ONE_WAY = 'ONE_WAY',
  ROUND_TRIP = 'ROUND_TRIP'
}

export class SearchFlightDto {
  @ApiProperty({ description: 'Origin airport code', example: 'JFK' })
  @IsString()
  origin: string;

  @ApiProperty({ description: 'Destination airport code', example: 'LAX' })
  @IsString()
  destination: string;

  @ApiProperty({ description: 'Departure date', example: '2025-04-15' })
  @IsDateString()
  departureDate: string;

  @ApiProperty({ description: 'Return date (required for round trips)', example: '2025-04-22', required: false })
  @IsDateString()
  @IsOptional()
  returnDate?: string;

  @ApiProperty({ description: 'Cabin class', enum: CabinClass, example: CabinClass.ECONOMY })
  @IsEnum(CabinClass)
  cabinClass: CabinClass;

  @ApiProperty({ description: 'Trip type', enum: TripType, example: TripType.ONE_WAY })
  @IsEnum(TripType)
  tripType: TripType;

  @ApiProperty({ description: 'Number of passengers', example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  passengers: number;
}
