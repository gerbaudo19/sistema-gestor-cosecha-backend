import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExportService {
  async exportRecordsToExcel(records: any[], filename = 'export.xlsx') {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Registros');

    // Encabezados en español
    ws.columns = [
      { header: 'Número de Orden', key: 'orderNumber', width: 15 },
      { header: 'Fecha', key: 'date', width: 20 },
      { header: 'Kilogramos', key: 'kilograms', width: 12 },
      { header: 'Bolson', key: 'bolsonNumber', width: 10 },
      { header: 'Número de Lote', key: 'loteNumber', width: 15 },
      { header: 'Patente Camión', key: 'truckPlate', width: 15 },
      { header: 'Chofer', key: 'truckDriver', width: 20 },
      { header: 'Tolvero', key: 'tolvero', width: 20 },      // Header en Excel = "Tolvero"
      { header: 'Controlador', key: 'controller', width: 20 }, // Header en Excel = "Controlador"
      { header: 'Cereal', key: 'cereal', width: 15 },
      { header: 'Creado Por', key: 'createdBy', width: 25 },
    ];

    // Agregar filas
    records.forEach((r) => {
      ws.addRow({
        orderNumber: r.orderNumber,
        date: r.date ? new Date(r.date) : null,
        kilograms: r.kilograms,
        bolsonNumber: r.bolsonNumber,
        loteNumber: r.loteNumber,
        truckPlate: r.truckPlate,
        truckDriver: r.truckDriver,
        tolvero: r.tolvero, // debe coincidir con key 'tolvero'
        controller: r.controller, // debe coincidir con key 'controller'
        cereal: r.cereal,
        createdBy: r.createdBy,
      });
    });

    // Formato de fecha
    ws.getColumn('date').numFmt = 'yyyy-mm-dd HH:mm';

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
