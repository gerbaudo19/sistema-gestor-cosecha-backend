import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;

  const userModelMock = {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    process.env.ADMIN_EMAIL = 'admin@test.com';
    process.env.ADMIN_PASSWORD = '123456';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken('User'),
          useValue: userModelMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should NOT create admin if one already exists', async () => {
    userModelMock.findOne.mockResolvedValue({ isAdmin: true });

    await service.ensureAdminUser();

    expect(userModelMock.create).not.toHaveBeenCalled();
  });

  it('should create admin user if not exists', async () => {
    userModelMock.findOne.mockResolvedValue(null);
    userModelMock.create.mockResolvedValue({ email: 'admin@test.com' });

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

    await service.ensureAdminUser();

    expect(userModelMock.create).toHaveBeenCalled();
  });

  it('should create user if admin', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

    userModelMock.create.mockResolvedValue({ email: 'user@test.com' });

    const result = await service.createByAdmin(
      { isAdmin: true } as any,
      {
        name: 'User',
        email: 'user@test.com',
        password: '1234',
      },
    );

    expect(result.email).toBe('user@test.com');
  });
});
