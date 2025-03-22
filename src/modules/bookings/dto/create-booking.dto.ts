import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CabinClass } from '../../flights/dto/search-flight.dto';

class PassengerDto {
  @ApiProperty({ enum: ['Mr', 'Mrs', 'Ms'], description: 'Gender/Title' })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({ description: 'First name of the passenger' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Last name of the passenger' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ description: 'Birth day', example: '2' })
  @IsString()
  @IsNotEmpty()
  birthDay: string;

  @ApiProperty({ description: 'Birth month', example: 'January' })
  @IsString()
  @IsNotEmpty()
  birthMonth: string;

  @ApiProperty({ description: 'Birth year', example: '2000' })
  @IsString()
  @IsNotEmpty()
  birthYear: string;

  @ApiProperty({ description: 'Passport number' })
  @IsString()
  @IsNotEmpty()
  passportNumber: string;

  @ApiProperty({ description: 'Passport issuing country' })
  @IsString()
  @IsNotEmpty()
  passportCountry: string;

  @ApiProperty({ description: 'Passport expiry day', example: '3' })
  @IsString()
  @IsNotEmpty()
  passportExpiryDay: string;

  @ApiProperty({ description: 'Passport expiry month', example: 'January' })
  @IsString()
  @IsNotEmpty()
  passportExpiryMonth: string;

  @ApiProperty({ description: 'Passport expiry year', example: '2030' })
  @IsString()
  @IsNotEmpty()
  passportExpiryYear: string;
}

class FlightDetailDto {
  @ApiProperty({ description: 'Flight ID (UUID)' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Flight number', example: 'AI201' })
  @IsString()
  flightNumber: string;

  @ApiProperty({ description: 'Origin airport code', example: 'JFK' })
  @IsString()
  origin: string;

  @ApiProperty({ description: 'Destination airport code', example: 'LAX' })
  @IsString()
  destination: string;

  @ApiProperty({ description: 'Departure time' })
  @IsString()
  departureTime: string;

  @ApiProperty({ description: 'Arrival time' })
  @IsString()
  arrivalTime: string;

  @ApiProperty({ description: 'Flight duration', example: '5h 30m' })
  @IsString()
  duration: string;

  @ApiProperty({ description: 'Ticket price' })
  @IsNumber()
  price: number;
}

class FlightsDto {
  @ApiProperty({ 
    description: 'Outbound flight details or ID',
    oneOf: [
      { type: 'string' },
      { $ref: '#/components/schemas/FlightDetailDto' }
    ]
  })
  outbound: string | FlightDetailDto;

  @ApiProperty({ 
    description: 'Return flight details or ID (optional)',
    oneOf: [
      { type: 'string' },
      { $ref: '#/components/schemas/FlightDetailDto' },
      { type: 'null' }
    ],
    required: false
  })
  @IsOptional()
  return?: string | FlightDetailDto | null;

  @ApiProperty({ 
    description: 'Cabin class ID (UUID from flight_cabin_classes table)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  cabinClassId: string;

  @ApiProperty({ 
    description: 'Cabin class',
    enum: CabinClass,
    example: CabinClass.ECONOMY
  })
  @IsEnum(CabinClass)
  cabinClass: CabinClass;
}

export class CreateBookingDto {
  @ApiProperty({ type: [PassengerDto], description: 'List of passengers' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PassengerDto)
  passengers: PassengerDto[];

  @ApiProperty({ description: 'Contact email' })
  @IsEmail()
  contactEmail: string;

  @ApiProperty({ description: 'Contact phone number' })
  @IsString()
  @IsNotEmpty()
  contactPhone: string;

  @ApiProperty({ description: 'Flight details' })
  @IsObject()
  @ValidateNested()
  @Type(() => FlightsDto)
  flights: FlightsDto;

  @ApiProperty({ description: 'Total booking price' })
  @IsNumber()
  totalPrice: number;

  @ApiProperty({ description: 'Booking date' })
  @IsString()
  @IsNotEmpty()
  bookingDate: string;

  @ApiProperty({ description: 'User ID (optional, will use authenticated user if not provided)', required: false })
  @IsUUID()
  @IsOptional()
  userId?: string;
}
