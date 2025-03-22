import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { FlightsService } from './flights.service';
import { SearchFlightDto } from './dto/search-flight.dto';

@ApiTags('flights')
@Controller('flights')
export class FlightsController {
  constructor(private readonly flightsService: FlightsService) {}

  @Post('search')
  @ApiOperation({ summary: 'Search for flights based on criteria' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of flights matching search criteria',
  })
  async searchFlights(@Body() searchFlightDto: SearchFlightDto) {
    return this.flightsService.searchFlights(searchFlightDto);
  }

  @Get('locations/all')
  @ApiOperation({ summary: 'Get all airport locations' })
  @ApiResponse({ status: 200, description: 'List of airports' })
  async getLocations() {
    return this.flightsService.getLocations();
  }

  @Get('detail/:id')
  @ApiOperation({ summary: 'Get flight details by ID' })
  @ApiParam({ name: 'id', description: 'Flight ID' })
  @ApiResponse({ status: 200, description: 'Flight details' })
  @ApiResponse({ status: 404, description: 'Flight not found' })
  async getFlight(@Param('id') id: string) {
    return this.flightsService.getFlightById(id);
  }
}
