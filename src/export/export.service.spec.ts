import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';

// NO importar ExcelJS directamente
jest.mock('exceljs', () => {
  const addRowMock = jest.fn();
  const getColumnMock = jest.fn().mockReturnValue({ numFmt: '' });

  const worksheetMock = {
    columns: [],
    addRow: addRowMock,
    getColumn: getColumnMock,
  };

  const writeBufferMock = jest.fn().mockResolvedValue(
    new Uint8Array([1, 2, 3]),
  );

  const workbookMock = {
    addWorksheet: jest.fn().mockReturnValue(worksheetMock),
    xlsx: {
      writeBuffer: writeBufferMock,
    },
  };

  return {
    Workbook: jest.fn(() => workbookMock),
  };
});

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExportService],
    }).compile();

    service = module.get<ExportService>(ExportService);
  });

  it('should export records to excel and return a buffer', async () => {
    const records = [
      {
        orderNumber: 1,
        date: '2024-01-01T10:00:00Z',
        kilograms: 1000,
        bolsonNumber: 2,
        loteNumber: 'L-01',
        truckPlate: 'ABC123',
        truckDriver: 'Juan',
        tolvero: 'Pedro',
        controller: 'Carlos',
        cereal: 'Soja',
        createdBy: 'admin',
      },
    ];

    const result = await service.exportRecordsToExcel(records);

    // Devuelve buffer
    expect(result).toBeInstanceOf(Buffer);
  });
});
