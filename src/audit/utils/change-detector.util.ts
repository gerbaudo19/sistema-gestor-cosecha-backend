export class ChangeDetector {
  static compare(before: any, after: any): { field: string; before: any; after: any }[] {
    const changes: { field: string; before: any; after: any }[] = [];
    
    for (const key in after) {
      if (Object.prototype.hasOwnProperty.call(after, key)) {
        const valBefore = before[key];
        const valAfter = after[key];

        // Comparación simple que ignora diferencias de tipos (ej. string vs Date) 
        // transformando a string para evitar falsos positivos en IDs o Fechas
        if (JSON.stringify(valBefore) !== JSON.stringify(valAfter)) {
          changes.push({
            field: key,
            before: valBefore,
            after: valAfter,
          });
        }
      }
    }
    return changes;
  }
}