import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditService } from './audit.service';
import { Audit } from './schemas/audit.schema';

describe('AuditService', () => {
  let service: AuditService;
  let auditModel: jest.Mocked<Model<any>>;

  const mockAuditModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getModelToken(Audit.name),
          useValue: mockAuditModel,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    auditModel = module.get(getModelToken(Audit.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------
  // createEntry
  // -------------------------
  it('should create an audit entry', async () => {
    const data = { action: 'TEST' };
    auditModel.create.mockResolvedValue(data as any);

    const result = await service.createEntry(data);

    expect(auditModel.create).toHaveBeenCalledWith(data);
    expect(result).toEqual(data);
  });

  // -------------------------
  // logUpdate
  // -------------------------
  it('should log update when changes exist', async () => {
    const before = { name: 'old' };
    const after = { name: 'new' };

    const createdAudit = {
      action: 'UPDATE',
    };

    auditModel.create.mockResolvedValue(createdAudit as any);

    const result = await service.logUpdate({
      recordId: new Types.ObjectId().toHexString(),
      lotId: new Types.ObjectId().toHexString(),
      userId: 'userId',
      before,
      after,
    });

    //solución correcta al error "possibly null"
    expect(result).not.toBeNull();
    expect(result!.action).toBe('UPDATE');
  });

  it('should return null if no changes are detected', async () => {
    const before = { name: 'same' };
    const after = { name: 'same' };

    const result = await service.logUpdate({
      recordId: new Types.ObjectId().toHexString(),
      lotId: new Types.ObjectId().toHexString(),
      userId: 'userId',
      before,
      after,
    });

    expect(result).toBeNull();
    expect(auditModel.create).not.toHaveBeenCalled();
  });

  // -------------------------
  // closeDay
  // -------------------------
  it('should close day', async () => {
    const mockAudit = { action: 'CLOSE_DAY' };
    auditModel.create.mockResolvedValue(mockAudit as any);

    const result = await service.closeDay(
      new Types.ObjectId().toHexString(),
      new Date(),
      'userId',
    );

    expect(auditModel.create).toHaveBeenCalled();
    expect(result.action).toBe('CLOSE_DAY');
  });

  // -------------------------
  // reopenDay
  // -------------------------
  it('should reopen day with reason', async () => {
    const mockAudit = { action: 'REOPEN_DAY' };
    auditModel.create.mockResolvedValue(mockAudit as any);

    const result = await service.reopenDay(
      new Types.ObjectId().toHexString(),
      new Date(),
      'userId',
      'Error humano',
    );

    expect(auditModel.create).toHaveBeenCalled();
    expect(result.action).toBe('REOPEN_DAY');
  });

  // -------------------------
  // isDayClosed
  // -------------------------
  it('should return true if last event is CLOSE_DAY', async () => {
    auditModel.findOne.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ action: 'CLOSE_DAY' }),
    } as any);

    const result = await service.isDayClosed(
      new Types.ObjectId().toHexString(),
      new Date(),
    );

    expect(result).toBe(true);
  });

  it('should return false if last event is REOPEN_DAY', async () => {
    auditModel.findOne.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ action: 'REOPEN_DAY' }),
    } as any);

    const result = await service.isDayClosed(
      new Types.ObjectId().toHexString(),
      new Date(),
    );

    expect(result).toBe(false);
  });

  // -------------------------
  // getHistoryByLot
  // -------------------------
  it('should return audit history by lot', async () => {
    const audits = [{ action: 'UPDATE' }, { action: 'CLOSE_DAY' }];

    auditModel.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(audits),
    } as any);

    const result = await service.getHistoryByLot(
      new Types.ObjectId().toHexString(),
    );

    expect(result).toEqual(audits);
  });
});
