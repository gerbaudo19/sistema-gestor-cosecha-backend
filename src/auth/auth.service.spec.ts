import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { HttpException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =====================
  // validateUser
  // =====================
  it('should validate user successfully', async () => {
    const userMock = {
      email: 'test@mail.com',
      password: 'hashed',
    };

    usersService.findByEmail.mockResolvedValue(userMock as any);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.validateUser(
      'test@mail.com',
      '1234',
    );

    expect(result).toBe(userMock);
  });

  it('should return null if user not found', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    const result = await service.validateUser(
      'test@mail.com',
      '1234',
    );

    expect(result).toBeNull();
  });

  it('should return null if password is invalid', async () => {
    usersService.findByEmail.mockResolvedValue({
      password: 'hashed',
    } as any);

    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const result = await service.validateUser(
      'test@mail.com',
      'wrong',
    );

    expect(result).toBeNull();
  });

  // =====================
  // login
  // =====================
  it('should login and return access token', async () => {
    const userMock = {
      _id: '1',
      email: 'test@mail.com',
      isAdmin: true,
    };

    jest
      .spyOn(service, 'validateUser')
      .mockResolvedValue(userMock as any);

    jwtService.sign.mockReturnValue('jwt-token');

    const result = await service.login({
      email: 'test@mail.com',
      password: '1234',
    });

    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: '1',
      email: 'test@mail.com',
      isAdmin: true,
    });

    expect(result).toEqual({
      access_token: 'jwt-token',
    });
  });

  it('should throw exception if credentials are invalid', async () => {
    jest
      .spyOn(service, 'validateUser')
      .mockResolvedValue(null);

    await expect(
      service.login({
        email: 'bad@mail.com',
        password: 'wrong',
      }),
    ).rejects.toThrow(HttpException);
  });
});
