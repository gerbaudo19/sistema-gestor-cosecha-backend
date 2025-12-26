import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { LotsService } from './lots.service';
import { generateCode } from '../utils/generateCode';

jest.mock('../utils/generateCode', () => ({
  generateCode: jest.fn(),
}));

describe('LotsService', () => {
  let service: LotsService;

  const saveMock = jest.fn();

  const lotModelMock: any = jest.fn().mockImplementation(() => ({
    save: saveMock,
  }));

  lotModelMock.updateMany = jest.fn();
  lotModelMock.findOneAndUpdate = jest.fn();
  lotModelMock.findByIdAndUpdate = jest.fn();
  lotModelMock.findOne = jest.fn();
  lotModelMock.find = jest.fn();
  lotModelMock.countDocuments = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LotsService,
        {
          provide: getModelToken('Lot'),
          useValue: lotModelMock,
        },
      ],
    }).compile();

    service = module.get<LotsService>(LotsService);
  });

  // =====================
  // CREATE
  // =====================
  it('should create a lot', async () => {
    (generateCode as jest.Mock).mockReturnValue('LOT123');

    saveMock.mockResolvedValue({
      name: 'Lote Test',
      code: 'LOT123',
      active: true,
    });

    const result = await service.create({ name: 'Lote Test' } as any);

    expect(generateCode).toHaveBeenCalled();
    expect(lotModelMock).toHaveBeenCalledWith({
      name: 'Lote Test',
      code: 'LOT123',
      active: true,
    });
    expect(saveMock).toHaveBeenCalled();
    expect(result.code).toBe('LOT123');
  });

  // =====================
  // SET ACTIVE LOT
  // =====================
  it('should set active lot', async () => {
    lotModelMock.updateMany.mockResolvedValue({});
    lotModelMock.findOneAndUpdate.mockResolvedValue({
      code: 'LOT1',
      active: true,
    });

    const result = await service.setActiveLot('LOT1');

    expect(lotModelMock.updateMany).toHaveBeenCalledWith(
      {},
      { active: false },
    );
    expect(lotModelMock.findOneAndUpdate).toHaveBeenCalled();
    expect(result.active).toBe(true);
  });

  it('should throw error if lot not found when setting active lot', async () => {
    lotModelMock.updateMany.mockResolvedValue({});
    lotModelMock.findOneAndUpdate.mockResolvedValue(null);

    await expect(service.setActiveLot('INVALID')).rejects.toThrow(
      'Lote no encontrado',
    );
  });

  // =====================
  // UPDATE / DEACTIVATE / RESTORE
  // =====================
  it('should update lot', async () => {
    lotModelMock.findByIdAndUpdate.mockResolvedValue({ name: 'Updated' });

    const result = await service.update('id1', { name: 'Updated' } as any);

    expect(lotModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'id1',
      { name: 'Updated' },
      { new: true },
    );
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Updated');
  });

  it('should deactivate lot', async () => {
    lotModelMock.findByIdAndUpdate.mockResolvedValue({ active: false });

    const result = await service.deactivate('id1');

    expect(lotModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'id1',
      { active: false },
      { new: true },
    );
    expect(result).not.toBeNull();
    expect(result!.active).toBe(false);
  });

  it('should restore lot', async () => {
    lotModelMock.findByIdAndUpdate.mockResolvedValue({ active: true });

    const result = await service.restore('id1');

    expect(lotModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'id1',
      { active: true },
      { new: true },
    );
    expect(result).not.toBeNull();
    expect(result!.active).toBe(true);
  });

  // =====================
  // FIND BY CODE
  // =====================
  it('should find active lot by code', async () => {
    const execMock = jest.fn().mockResolvedValue({ code: 'LOT1' });

    lotModelMock.findOne.mockReturnValue({
      exec: execMock,
    });

    const result = await service.findByCode('LOT1');

    expect(lotModelMock.findOne).toHaveBeenCalledWith({
      code: 'LOT1',
      active: true,
    });

    expect(result).not.toBeNull();   
    expect(result!.code).toBe('LOT1'); 
  });

  // =====================
  // SEARCH
  // =====================
  it('should search lots with pagination', async () => {
    const execMock = jest.fn().mockResolvedValue([{ code: 'LOT1' }]);

    lotModelMock.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: execMock,
    });

    lotModelMock.countDocuments.mockResolvedValue(1);

    const result = await service.search({
      page: 1,
      limit: 10,
      sortBy: 'code',
      order: 'asc',
      showDeleted: false,
    } as any);

    expect(result.total).toBe(1);
    expect(result.data.length).toBe(1);
    expect(result.totalPages).toBe(1);
  });
});
