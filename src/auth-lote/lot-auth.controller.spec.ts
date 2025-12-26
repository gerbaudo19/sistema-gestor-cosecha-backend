import { Test, TestingModule } from '@nestjs/testing';
import { LotAuthController } from './lot-auth.controller';
import { LotsService } from '../lots/lots.service';
import { UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('LotAuthController', () => {
  let controller: LotAuthController;
  let lotsService: jest.Mocked<LotsService>;

  const mockLotsService = {
    findByCode: jest.fn(),
  };

  beforeEach(async () => {
    process.env.LOT_SECRET = 'test-secret';

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LotAuthController],
      providers: [
        {
          provide: LotsService,
          useValue: mockLotsService,
        },
      ],
    }).compile();

    controller = module.get<LotAuthController>(LotAuthController);
    lotsService = module.get(LotsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should login successfully and return lot token', async () => {
    const lotMock = {
      _id: 'lotId123',
      active: true,
    };

    lotsService.findByCode.mockResolvedValue(lotMock as any);

    (jwt.sign as jest.Mock).mockReturnValue('fake-jwt-token');

    const result = await controller.login({ code: 'ABC123' });

    expect(lotsService.findByCode).toHaveBeenCalledWith('ABC123');
    expect(jwt.sign).toHaveBeenCalledWith(
      {
        lotId: 'lotId123',
        type: 'LOT',
      },
      'test-secret',
      { expiresIn: '12h' },
    );

    expect(result).toEqual({
      lotToken: 'fake-jwt-token',
      lotId: 'lotId123',
      expiresIn: '12h',
    });
  });

  it('should throw UnauthorizedException if lot does not exist', async () => {
    lotsService.findByCode.mockResolvedValue(null);

    await expect(
      controller.login({ code: 'INVALID' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if lot is inactive', async () => {
    lotsService.findByCode.mockResolvedValue({
      _id: 'lotId',
      active: false,
    } as any);

    await expect(
      controller.login({ code: 'INACTIVE' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
