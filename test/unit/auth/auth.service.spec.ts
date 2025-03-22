import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  
  // Mock Supabase client
  const mockSupabaseClient = {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: 'SUPABASE_CLIENT',
          useValue: mockSupabaseClient,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signUp', () => {
    it('should register a new user successfully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      const mockAuthResponse = {
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
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue(mockAuthResponse);

      const result = await service.signUp(credentials);

      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: credentials.email,
        password: credentials.password
      });
      expect(result.user.id).toBe('user-123');
      expect(result.accessToken).toBe('mock-token');
    });

    it('should throw UnauthorizedException if sign up fails', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      const mockAuthResponse = {
        data: { user: null, session: null },
        error: { message: 'Email already registered' }
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue(mockAuthResponse);

      await expect(service.signUp(credentials))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signIn', () => {
    it('should authenticate a user successfully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      const mockAuthResponse = {
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
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(mockAuthResponse);

      const result = await service.signIn(credentials);

      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: credentials.email,
        password: credentials.password
      });
      expect(result.user.id).toBe('user-123');
      expect(result.accessToken).toBe('mock-token');
    });

    it('should throw UnauthorizedException if sign in fails', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'WrongPassword'
      };

      const mockAuthResponse = {
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(mockAuthResponse);

      await expect(service.signIn(credentials))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signOut', () => {
    it('should sign out a user successfully', async () => {
      const token = 'valid-token';

      const mockAuthResponse = {
        error: null
      };

      mockSupabaseClient.auth.signOut.mockResolvedValue(mockAuthResponse);

      const result = await service.signOut(token);

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should throw UnauthorizedException if sign out fails', async () => {
      const token = 'invalid-token';

      const mockAuthResponse = {
        error: { message: 'Invalid token' }
      };

      mockSupabaseClient.auth.signOut.mockResolvedValue(mockAuthResponse);

      await expect(service.signOut(token))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user data if token is valid', async () => {
      const token = 'valid-token';
      const userId = 'user-123';

      const mockAuthResponse = {
        data: {
          user: {
            id: userId,
            email: 'test@example.com'
          }
        },
        error: null
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue(mockAuthResponse);

      const result = await service.validateUser(token);

      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith(token);
      expect(result.id).toBe(userId);
    });

    it('should return null if token is invalid', async () => {
      const token = 'invalid-token';

      const mockAuthResponse = {
        data: { user: null },
        error: { message: 'Invalid token' }
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue(mockAuthResponse);

      const result = await service.validateUser(token);

      expect(result).toBeNull();
    });
  });
});
