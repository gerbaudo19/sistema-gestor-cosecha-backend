import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: jest.Mocked<UsersService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    usersService = {
      findById: jest.fn(),
    } as any;

    configService = {
      get: jest.fn().mockReturnValue('jwt-secret'),
    } as any;

    strategy = new JwtStrategy(usersService, configService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return user if payload is valid', async () => {
    const userMock = { _id: '1', email: 'test@mail.com' };
    usersService.findById.mockResolvedValue(userMock as any);

    const result = await strategy.validate({ sub: '1' });

    expect(usersService.findById).toHaveBeenCalledWith('1');
    expect(result).toBe(userMock);
  });

  it('should throw UnauthorizedException if user not found', async () => {
    usersService.findById.mockResolvedValue(null);

    await expect(strategy.validate({ sub: '1' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw error if JWT_SECRET is missing', () => {
    configService.get.mockReturnValue(undefined);

    expect(
      () => new JwtStrategy(usersService, configService),
    ).toThrow('JWT_SECRET no está definido en el .env');
  });
});
