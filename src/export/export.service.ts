import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExportService {
  async exportRecordsToExcel(records: any[], filename = 'export.xlsx') {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Registros');

    // Encabezados
    ws.columns = [
      { header: 'OrderNumber', key: 'orderNumber', width: 12 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Kilograms', key: 'kilograms', width: 12 },
      { header: 'Bolson', key: 'bolsonNumber', width: 10 },
      { header: 'LoteNumber', key: 'loteNumber', width: 12 },
      { header: 'TruckPlate', key: 'truckPlate', width: 15 },
      { header: 'TruckDriver', key: 'truckDriver', width: 20 },
      { header: 'Tolvero', key: 'tolvero', width: 20 },
      { header: 'Controller', key: 'controller', width: 20 },
      { header: 'Cereal', key: 'cereal', width: 15 },
      { header: 'CreatedBy', key: 'createdBy', width: 25 },
    ];

    records.forEach((r) => {
      ws.addRow({
        orderNumber: r.orderNumber,
        date: r.date,
        kilograms: r.kilograms,
        bolsonNumber: r.bolsonNumber,
        loteNumber: r.loteNumber,
        truckPlate: r.truckPlate,
        truckDriver: r.truckDriver,
        tolvero: r.tolvero,
        controller: r.controller,
        cereal: r.cereal,
        createdBy: r.createdBy,
      });
    });

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }
}
