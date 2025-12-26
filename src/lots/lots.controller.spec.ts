import { Test, TestingModule } from '@nestjs/testing';
import { LotsController } from './lots.controller';
import { LotsService } from './lots.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';

describe('LotsController', () => {
  let controller: LotsController;
  let service: jest.Mocked<LotsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LotsController],
      providers: [
        {
          provide: LotsService,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            deactivate: jest.fn(),
            restore: jest.fn(),
            setActiveLot: jest.fn(),
            search: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => true,
      })
      .compile();

    controller = module.get<LotsController>(LotsController);
    service = module.get(LotsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ================= CREATE =================
  it('should create a lot', async () => {
    const dto = { name: 'Lote 1' } as any;
    const lotMock = { _id: '1', name: 'Lote 1' };

    service.create.mockResolvedValue(lotMock as any);

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toBe(lotMock);
  });

  // ================= UPDATE =================
  it('should update a lot', async () => {
    const dto = { name: 'Updated Lot' } as any;
    const lotMock = { _id: '1', name: 'Updated Lot' };

    service.update.mockResolvedValue(lotMock as any);

    const result = await controller.update('1', dto);

    expect(service.update).toHaveBeenCalledWith('1', dto);
    expect(result).toBe(lotMock);
  });

  // ================= DELETE =================
  it('should deactivate a lot', async () => {
    const lotMock = { _id: '1', active: false };

    service.deactivate.mockResolvedValue(lotMock as any);

    const result = await controller.delete('1');

    expect(service.deactivate).toHaveBeenCalledWith('1');
    expect(result).toBe(lotMock);
  });

  // ================= RESTORE =================
  it('should restore a lot', async () => {
    const lotMock = { _id: '1', active: true };

    service.restore.mockResolvedValue(lotMock as any);

    const result = await controller.restore('1');

    expect(service.restore).toHaveBeenCalledWith('1');
    expect(result).toBe(lotMock);
  });

  // ================= SET ACTIVE =================
  it('should set active lot by code', async () => {
    const lotMock = { code: 'ABC123', active: true };

    service.setActiveLot.mockResolvedValue(lotMock as any);

    const result = await controller.setActiveLot('ABC123');

    expect(service.setActiveLot).toHaveBeenCalledWith('ABC123');
    expect(result).toBe(lotMock);
  });

  // ================= SEARCH =================
  it('should search lots with filters', async () => {
    const responseMock = {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      data: [],
    };

    service.search.mockResolvedValue(responseMock as any);

    const result = await controller.list(
      'CODE',
      'Lote',
      'Soja',
      '1',
      '10',
      'createdAt',
      'desc',
      'false',
    );

    expect(service.search).toHaveBeenCalledWith({
      code: 'CODE',
      name: 'Lote',
      cereal: 'Soja',
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      order: 'desc',
      showDeleted: false,
    });

    expect(result).toBe(responseMock);
  });
});
