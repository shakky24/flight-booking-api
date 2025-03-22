<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# Flight Booking API

A NestJS-based API for flight booking that supports both one-way and round-trip tickets with multiple cabin classes.

## Features

- Search for flights with various criteria (origin, destination, dates, cabin class)
- Support for one-way and round-trip bookings
- Multiple cabin classes (Economy, Premium Economy, Business, First)
- JWT authentication using Supabase
- Detailed passenger information management
- Booking creation, retrieval, and cancellation
- API documentation using Swagger

## API Endpoints

### Public Endpoints (No Auth Required)

- `POST /flights/search` - Search for flights based on criteria
- `GET /flights/:id` - Get flight details by ID
- `GET /flights/locations/all` - Get all airport locations

### Authentication Endpoints

- `POST /auth/signup` - Register a new user
- `POST /auth/signin` - Sign in with email and password
- `POST /auth/signout` - Sign out the current user
- `GET /auth/profile` - Get current user profile (protected)

### Protected Endpoints (JWT Auth Required)

- `POST /bookings` - Create a new booking
- `GET /bookings` - Get all bookings for authenticated user
- `GET /bookings/:id` - Get booking details by ID
- `POST /bookings/:id/cancel` - Cancel a booking

## Database Schema

The database uses PostgreSQL with the following main tables:

1. `airports` - Stores airport information
2. `flights` - Stores flight details
3. `flight_cabin_classes` - Stores cabin class details for each flight
4. `users` - Stores user information
5. `bookings` - Stores booking information

## Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL
- Supabase account for authentication

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/flight-booking-nestjs.git
cd flight-booking-nestjs
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables in `.env` file
```
DATABASE_URL=postgresql://user:password@localhost:5432/flight_booking
JWT_SECRET=your_jwt_secret
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
PORT=9000
```

4. Run database migrations
```bash
npm run migration:run
```

5. Start the application
```bash
npm run start:dev
```

6. Access the Swagger documentation at `http://localhost:9000/api`

## Testing with Postman

A Postman collection is included in the `/postman` folder to help you test the API endpoints. Import this collection into Postman to get started quickly.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
