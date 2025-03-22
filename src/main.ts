import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();
  
  // Enable validation
  app.useGlobalPipes(new ValidationPipe());

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Flight Booking API')
    .setDescription('API documentation for the Flight Booking System')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('flights', 'Flight search and details')
    .addTag('auth', 'Authentication endpoints')
    .addTag('bookings', 'Booking management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 9000);
}
bootstrap();
