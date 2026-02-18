import { Injectable } from '@angular/core';

import { ColumnStyleConfig } from '../../interfaces/common.interface';

@Injectable({
  providedIn: 'root'
})
export class TableStyleService {
  private readonly typeStyles: Record<string, ColumnStyleConfig> = {
    boolean: {
      headerClass: 'header-boolean',
      cellClass: 'cell-boolean',
      alignment: 'center',
      width: '100px',
      minWidth: '80px'
    },
    number: {
      headerClass: 'header-number',
      cellClass: 'cell-number',
      alignment: 'right',
      width: '120px',
      minWidth: '100px'
    },
    integer: {
      headerClass: 'header-number',
      cellClass: 'cell-number',
      alignment: 'right',
      width: '120px',
      minWidth: '100px'
    },
    string: {
      headerClass: 'header-text',
      cellClass: 'cell-text',
      alignment: 'left',
      minWidth: '150px'
    },
    text: {
      headerClass: 'header-text',
      cellClass: 'cell-text',
      alignment: 'left',
      minWidth: '200px'
    },
    email: {
      headerClass: 'header-email',
      cellClass: 'cell-email',
      alignment: 'left',
      width: '250px',
      minWidth: '200px'
    },
    date: {
      headerClass: 'header-date',
      cellClass: 'cell-date',
      alignment: 'center',
      width: '140px',
      minWidth: '120px'
    },
    datetime: {
      headerClass: 'header-date',
      cellClass: 'cell-date',
      alignment: 'center',
      width: '180px',
      minWidth: '160px'
    }
  };

  private readonly nameStyles: Record<string, ColumnStyleConfig> = {
    id: {
      headerClass: 'header-id',
      cellClass: 'cell-id',
      alignment: 'center',
      width: '80px',
      minWidth: '60px'
    },
    email: {
      headerClass: 'header-email',
      cellClass: 'cell-email',
      alignment: 'left',
      width: '250px',
      minWidth: '200px'
    },
    profileImageUrl: {
      headerClass: 'header-image',
      cellClass: 'cell-image',
      alignment: 'center',
      width: '120px',
      minWidth: '100px'
    },
    actions: {
      headerClass: 'header-actions',
      cellClass: 'cell-actions',
      alignment: 'right',
      width: '120px',
      minWidth: '100px'
    }
  };

  getColumnStyle (columnName: string, columnType: string): ColumnStyleConfig {
    if (this.nameStyles[columnName]) return this.nameStyles[columnName];
    if (this.typeStyles[columnType]) return this.typeStyles[columnType];

    return {
      headerClass: 'header-default',
      cellClass: 'cell-default',
      alignment: 'left',
      minWidth: '120px'
    };
  }

  getHeaderClasses (columnName: string, columnType: string): string {
    const style = this.getColumnStyle(columnName, columnType);
    return `${style.headerClass} text-${style.alignment}`;
  }

  getCellClasses (columnName: string, columnType: string): string {
    const style = this.getColumnStyle(columnName, columnType);
    return `${style.cellClass} text-${style.alignment}`;
  }

  getColumnStyles (columnName: string, columnType: string): Record<string, string> {
    const style = this.getColumnStyle(columnName, columnType);
    const styles: Record<string, string> = {};
    if (style.width) styles['width'] = style.width;
    if (style.minWidth) styles['min-width'] = style.minWidth;
    return styles;
  }

  registerColumnStyle (columnName: string, config: ColumnStyleConfig): void {
    this.nameStyles[columnName] = config;
  }

  registerTypeStyle (typeName: string, config: ColumnStyleConfig): void {
    this.typeStyles[typeName] = config;
  }
}
