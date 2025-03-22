import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth() // Require JWT token for Swagger
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createBooking(@Request() req, @Body() createBookingDto: CreateBookingDto) {
    // Use userId from DTO if provided, otherwise use authenticated user's ID
    const userId = createBookingDto.userId || req.user.id;
    return this.bookingsService.createBooking(userId, createBookingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookings for authenticated user' })
  @ApiResponse({ status: 200, description: 'List of bookings' })
  async findAll(@Request() req) {
    return this.bookingsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking details by ID' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Booking details' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.bookingsService.findOne(req.user.id, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async cancelBooking(@Request() req, @Param('id') id: string) {
    return this.bookingsService.cancelBooking(id, req.user.id);
  }
}
