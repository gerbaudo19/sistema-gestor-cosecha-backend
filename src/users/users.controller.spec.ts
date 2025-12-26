import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const usersServiceMock = {
    createByAdmin: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create user via service', async () => {
    const req = { user: { isAdmin: true } };
    const dto = {
      name: 'Test',
      email: 'test@test.com',
      password: '1234',
    };

    usersServiceMock.createByAdmin.mockResolvedValue({
      email: dto.email,
    });

    const result = await controller.create(req as any, dto);

    expect(service.createByAdmin).toHaveBeenCalledWith(req.user, dto);
    expect(result.email).toBe(dto.email);
  });
});

