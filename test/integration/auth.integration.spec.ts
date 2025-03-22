import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AuthCredentialsDto } from '../../src/modules/auth/auth.service';

describe('AuthController (Integration)', () => {
  let app: INestApplication;
  
  // Mock Supabase client
  const mockSupabaseClient = {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
    }
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/signup (POST)', () => {
    it('should register a new user', async () => {
      const credentials: AuthCredentialsDto = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: credentials.email,
          },
          session: {
            access_token: 'mock-token',
            expires_at: Date.now() + 3600,
          }
        },
        error: null
      });

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(credentials)
        .expect(201);

      expect(response.body.user.id).toBe('user-123');
      expect(response.body.accessToken).toBe('mock-token');
    });

    it('should return 400 for invalid signup data', async () => {
      const invalidCredentials = {
        email: 'not-a-valid-email',
        password: 'weak'
      };

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(invalidCredentials)
        .expect(400);
    });

    it('should return 401 if Supabase signup fails', async () => {
      const credentials: AuthCredentialsDto = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already registered' }
      });

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(credentials)
        .expect(401);
    });
  });

  describe('/auth/signin (POST)', () => {
    it('should authenticate a user', async () => {
      const credentials: AuthCredentialsDto = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: credentials.email,
          },
          session: {
            access_token: 'mock-token',
            expires_at: Date.now() + 3600,
          }
        },
        error: null
      });

      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send(credentials)
        .expect(200);

      expect(response.body.user.id).toBe('user-123');
      expect(response.body.accessToken).toBe('mock-token');
    });

    it('should return 401 for invalid credentials', async () => {
      const credentials: AuthCredentialsDto = {
        email: 'test@example.com',
        password: 'WrongPassword'
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      });

      await request(app.getHttpServer())
        .post('/auth/signin')
        .send(credentials)
        .expect(401);
    });
  });

  describe('/auth/signout (POST)', () => {
    it('should sign out a user', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null
      });

      const response = await request(app.getHttpServer())
        .post('/auth/signout')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 401 if sign out fails', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: { message: 'Invalid token' }
      });

      await request(app.getHttpServer())
        .post('/auth/signout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/auth/profile (GET)', () => {
    it('should return user profile when authenticated', async () => {
      const userId = 'user-123';
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: 'test@example.com',
          }
        },
        error: null
      });

      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.id).toBe(userId);
    });

    it('should return 401 when not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      });

      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
