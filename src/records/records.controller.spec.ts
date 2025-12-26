import { Test, TestingModule } from '@nestjs/testing';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';
import { AuditService } from '../audit/audit.service';
import { ExportService } from '../export/export.service';

describe('RecordsController', () => {
  let controller: RecordsController;
  let recordsService: RecordsService;

  const recordsServiceMock = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    listByLot: jest.fn(),
    listByLotAndDay: jest.fn(),
    search: jest.fn(),
    exportByLot: jest.fn(),
  };

  const auditServiceMock = {
    getHistoryByLot: jest.fn(),
  };

  const exportServiceMock = {
    exportRecordsToExcel: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecordsController],
      providers: [
        { provide: RecordsService, useValue: recordsServiceMock },
        { provide: AuditService, useValue: auditServiceMock },
        { provide: ExportService, useValue: exportServiceMock },
      ],
    }).compile();

    controller = module.get<RecordsController>(RecordsController);
    recordsService = module.get<RecordsService>(RecordsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create record', async () => {
    recordsServiceMock.create.mockResolvedValue({ id: 1 });

    const result = await controller.create(
      { date: new Date() } as any,
      { lot: { lotId: 'lotId' } } as any,
    );

    expect(recordsService.create).toHaveBeenCalledWith(
      expect.any(Object),
      'lotId',
    );
    expect(result.id).toBe(1);
  });

  it('should update record', async () => {
    const recordMock = { _id: '123' };

    recordsServiceMock.update.mockResolvedValue(recordMock);

    const result = await controller.update(
        'id',
        {} as any,
        { lot: { lotId: 'lotId' } } as any,
    );

    expect(recordsServiceMock.update).toHaveBeenCalledWith(
        'id',
        {},
        'lotId',
    );
    expect(result).toBe(recordMock);
  });


  it('should delete record', async () => {
    recordsServiceMock.delete.mockResolvedValue({ message: 'ok' });

    const result = await controller.remove(
      'id',
      { user: { userId: 'admin' } } as any,
    );

    expect(result.message).toBe('ok');
  });

  it('should list records by lot', async () => {
    recordsServiceMock.listByLot.mockResolvedValue([{ id: 1 }]);

    const result = await controller.listMyLot({
      lot: { lotId: 'lotId' },
    } as any);

    expect(result).toHaveLength(1);
  });

  it('should export records', async () => {
    recordsServiceMock.exportByLot.mockResolvedValue([{ id: 1 }]);
    exportServiceMock.exportRecordsToExcel.mockResolvedValue(Buffer.from(''));

    const res: any = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    await controller.exportLot('lotId', res);

    expect(res.send).toHaveBeenCalled();
  });
});
