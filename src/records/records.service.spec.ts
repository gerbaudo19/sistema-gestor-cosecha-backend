import { Test, TestingModule } from '@nestjs/testing';
import { RecordsService } from './records.service';
import { getModelToken } from '@nestjs/mongoose';
import { RecordEntry } from './schemas/record.schema';
import { AuditService } from '../audit/audit.service';
import { Types } from 'mongoose';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('RecordsService', () => {
  let service: RecordsService;

  // =====================
  // MODEL MOCK (constructor + static methods)
  // =====================
  const recordModelMock: any = jest.fn();

  recordModelMock.findOne = jest.fn();
  recordModelMock.findById = jest.fn();
  recordModelMock.deleteOne = jest.fn();
  recordModelMock.find = jest.fn();

  // =====================
  // AUDIT SERVICE MOCK
  // =====================
  const auditServiceMock = {
    isDayClosed: jest.fn(),
    createEntry: jest.fn(),
    logUpdate: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    auditServiceMock.isDayClosed.mockResolvedValue(false);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordsService,
        {
          provide: getModelToken(RecordEntry.name),
          useValue: recordModelMock,
        },
        {
          provide: AuditService,
          useValue: auditServiceMock,
        },
      ],
    }).compile();

    service = module.get<RecordsService>(RecordsService);
  });

  // =====================
  // CREATE
  // =====================
  it('should create record with next order number', async () => {
    const lotId = new Types.ObjectId().toHexString();

    recordModelMock.findOne.mockReturnValue({
      sort: jest.fn().mockResolvedValue({ orderNumber: 3 }),
    });

    const saveMock = jest.fn().mockResolvedValue({
      _id: new Types.ObjectId(),
      orderNumber: 4,
    });

    recordModelMock.mockImplementation(() => ({
      save: saveMock,
    }));

    const result = await service.create(
      { date: new Date().toISOString() } as any,
      lotId,
    );

    expect(recordModelMock.findOne).toHaveBeenCalledWith({ lotId });
    expect(saveMock).toHaveBeenCalled();
    expect(auditServiceMock.createEntry).toHaveBeenCalled();
    expect(result.orderNumber).toBe(4);
  });

  it('should throw error if day is closed on create', async () => {
    auditServiceMock.isDayClosed.mockResolvedValue(true);

    await expect(
      service.create(
        { date: new Date().toISOString() } as any,
        new Types.ObjectId().toHexString(),
      ),
    ).rejects.toThrow(HttpException);
  });

  // =====================
  // UPDATE
  // =====================
  it('should update record', async () => {
    const lotId = new Types.ObjectId();

    const record: any = {
      lotId,
      date: new Date(),
      toObject: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue({ updated: true }),
    };

    recordModelMock.findById.mockResolvedValue(record);

    const result = await service.update(
      'rec1',
      { truckPlate: 'ABC123' },
      lotId.toHexString(),
    );

    expect(recordModelMock.findById).toHaveBeenCalledWith('rec1');
    expect(record.save).toHaveBeenCalled();
    expect(auditServiceMock.logUpdate).toHaveBeenCalled();
    expect(record.save).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('should throw error if record not found on update', async () => {
    recordModelMock.findById.mockResolvedValue(null);

    await expect(
      service.update('rec1', {}, new Types.ObjectId().toHexString()),
    ).rejects.toThrow(HttpException);
  });

  it('should throw error if record does not belong to lot', async () => {
    const record: any = {
      lotId: new Types.ObjectId(),
      date: new Date(),
    };

    recordModelMock.findById.mockResolvedValue(record);

    await expect(
      service.update(
        'rec1',
        {},
        new Types.ObjectId().toHexString(),
      ),
    ).rejects.toThrow(HttpException);
  });

  // =====================
  // DELETE
  // =====================
  it('should delete record', async () => {
    const record: any = {
      lotId: new Types.ObjectId(),
      date: new Date(),
      orderNumber: 5,
    };

    recordModelMock.findById.mockResolvedValue(record);
    recordModelMock.deleteOne.mockResolvedValue({ deletedCount: 1 });

    const result = await service.delete(
      new Types.ObjectId().toHexString(),
      'admin',
    );

    expect(recordModelMock.findById).toHaveBeenCalled();
    expect(recordModelMock.deleteOne).toHaveBeenCalled();
    expect(auditServiceMock.createEntry).toHaveBeenCalled();
    expect(result).toEqual({ message: 'Orden eliminada correctamente' });
  });

  it('should throw error if record not found on delete', async () => {
    recordModelMock.findById.mockResolvedValue(null);

    await expect(
      service.delete('rec1', 'admin'),
    ).rejects.toThrow(HttpException);
  });

  // =====================
  // LIST
  // =====================
  it('should list records by lot', async () => {
    const execMock = jest.fn().mockResolvedValue([{ orderNumber: 1 }]);

    recordModelMock.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      exec: execMock,
    });

    const result = await service.listByLot(
      new Types.ObjectId().toHexString(),
    );

    expect(recordModelMock.find).toHaveBeenCalled();
    expect(result.length).toBe(1);
  });

  it('should list records by lot and day', async () => {
    const execMock = jest.fn().mockResolvedValue([{ orderNumber: 1 }]);

    recordModelMock.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      exec: execMock,
    });

    const result = await service.listByLotAndDay(
      new Types.ObjectId().toHexString(),
      new Date(),
    );

    expect(recordModelMock.find).toHaveBeenCalled();
    expect(result.length).toBe(1);
  });

  // =====================
  // SEARCH
  // =====================
  it('should search records with filters', async () => {
    const execMock = jest.fn().mockResolvedValue([{ orderNumber: 1 }]);

    recordModelMock.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      exec: execMock,
    });

    const result = await service.search({
      truckPlate: 'ABC',
    });

    expect(recordModelMock.find).toHaveBeenCalled();
    expect(result.length).toBe(1);
  });

  // =====================
  // EXPORT
  // =====================
  it('should export records by lot', async () => {
    jest
      .spyOn(service, 'listByLot')
      .mockResolvedValue([{ orderNumber: 1 }] as any);

    const result = await service.exportByLot(
      new Types.ObjectId().toHexString(),
    );

    expect(result.length).toBe(1);
  });

  it('should throw error if no records to export', async () => {
    jest.spyOn(service, 'listByLot').mockResolvedValue([]);

    await expect(
      service.exportByLot(new Types.ObjectId().toHexString()),
    ).rejects.toThrow(HttpException);
  });
});
