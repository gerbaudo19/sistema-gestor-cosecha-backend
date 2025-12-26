import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthService = {
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call authService.login and return token', async () => {
    authService.login.mockResolvedValue({
      access_token: 'jwt-token',
    });

    const result = await controller.login({
      email: 'test@mail.com',
      password: '1234',
    });

    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@mail.com',
      password: '1234',
    });

    expect(result.access_token).toBe('jwt-token');
  });
});
