import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../src/modules/auth/guards/jwt-auth.guard';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    authService = module.get<AuthService>(AuthService);
    
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true if token is valid', async () => {
      const token = 'valid-token';
      const userId = 'user-123';
      
      // Mock execution context
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              authorization: `Bearer ${token}`,
            },
          }),
        }),
      } as unknown as ExecutionContext;

      // Mock successful user validation
      mockAuthService.validateUser.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
      });

      const result = await guard.canActivate(mockContext);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(token);
      expect(result).toBe(true);
      
      // Check that the user was attached to the request
      const request = mockContext.switchToHttp().getRequest();
      expect(request.user).toEqual({
        id: userId,
        email: 'test@example.com',
      });
    });

    it('should throw UnauthorizedException if no authorization header', async () => {
      // Mock execution context without authorization header
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {},
          }),
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(mockContext))
        .rejects.toThrow(UnauthorizedException);
      
      expect(mockAuthService.validateUser).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      const token = 'invalid-token';
      
      // Mock execution context with invalid token
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              authorization: `Bearer ${token}`,
            },
          }),
        }),
      } as unknown as ExecutionContext;

      // Mock failed user validation
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(guard.canActivate(mockContext))
        .rejects.toThrow(UnauthorizedException);
      
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(token);
    });

    it('should handle authorization header without Bearer prefix', async () => {
      const token = 'valid-token';
      
      // Mock execution context with direct token (no Bearer prefix)
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              authorization: token,
            },
          }),
        }),
      } as unknown as ExecutionContext;

      // Mock successful user validation
      mockAuthService.validateUser.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
      });

      const result = await guard.canActivate(mockContext);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(token);
      expect(result).toBe(true);
    });
  });
});
