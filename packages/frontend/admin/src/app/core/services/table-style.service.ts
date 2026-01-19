import { Injectable } from '@angular/core';

export interface ColumnStyleConfig {
  headerClass: string;
  cellClass: string;
  alignment: 'left' | 'center' | 'right';
  width?: string;
  minWidth?: string;
}

/**
 * Centralized Table Styling Service
 * 
 * This service provides consistent column styling across all tables in the application.
 * It automatically determines the best styling based on column type and name.
 */
@Injectable({
  providedIn: 'root'
})
export class TableStyleService {

  // Column type-based styling rules
  private readonly typeStyles: Record<string, ColumnStyleConfig> = {
    'boolean': {
      headerClass: 'header-boolean',
      cellClass: 'cell-boolean',
      alignment: 'center',
      width: '100px',
      minWidth: '80px'
    },
    'number': {
      headerClass: 'header-number',
      cellClass: 'cell-number',
      alignment: 'right',
      width: '120px',
      minWidth: '100px'
    },
    'integer': {
      headerClass: 'header-number',
      cellClass: 'cell-number',
      alignment: 'right',
      width: '120px',
      minWidth: '100px'
    },
    'string': {
      headerClass: 'header-text',
      cellClass: 'cell-text',
      alignment: 'left',
      minWidth: '150px'
    },
    'text': {
      headerClass: 'header-text',
      cellClass: 'cell-text',
      alignment: 'left',
      minWidth: '200px'
    },
    'email': {
      headerClass: 'header-email',
      cellClass: 'cell-email',
      alignment: 'left',
      width: '250px',
      minWidth: '200px'
    },
    'date': {
      headerClass: 'header-date',
      cellClass: 'cell-date',
      alignment: 'center',
      width: '140px',
      minWidth: '120px'
    },
    'datetime': {
      headerClass: 'header-date',
      cellClass: 'cell-date',
      alignment: 'center',
      width: '180px',
      minWidth: '160px'
    }
  };

  // Special column name-based styling rules (overrides type-based rules)
  private readonly nameStyles: Record<string, ColumnStyleConfig> = {
    'id': {
      headerClass: 'header-id',
      cellClass: 'cell-id',
      alignment: 'center',
      width: '80px',
      minWidth: '60px'
    },
    'email': {
      headerClass: 'header-email',
      cellClass: 'cell-email',
      alignment: 'left',
      width: '250px',
      minWidth: '200px'
    },
    'profileImageUrl': {
      headerClass: 'header-image',
      cellClass: 'cell-image',
      alignment: 'center',
      width: '120px',
      minWidth: '100px'
    },
    'actions': {
      headerClass: 'header-actions',
      cellClass: 'cell-actions',
      alignment: 'right',
      width: '120px',
      minWidth: '100px'
    }
  };

  /**
   * Get styling configuration for a column
   */
  getColumnStyle(columnName: string, columnType: string): ColumnStyleConfig {
    // Check for name-specific styles first
    if (this.nameStyles[columnName]) {
      return this.nameStyles[columnName];
    }

    // Fall back to type-based styles
    if (this.typeStyles[columnType]) {
      return this.typeStyles[columnType];
    }

    // Default style for unknown types
    return {
      headerClass: 'header-default',
      cellClass: 'cell-default',
      alignment: 'left',
      minWidth: '120px'
    };
  }

  /**
   * Get header classes for a column
   */
  getHeaderClasses(columnName: string, columnType: string): string {
    const style = this.getColumnStyle(columnName, columnType);
    return `${style.headerClass} text-${style.alignment}`;
  }

  /**
   * Get cell classes for a column
   */
  getCellClasses(columnName: string, columnType: string): string {
    const style = this.getColumnStyle(columnName, columnType);
    return `${style.cellClass} text-${style.alignment}`;
  }

  /**
   * Get inline styles for a column
   */
  getColumnStyles(columnName: string, columnType: string): Record<string, string> {
    const style = this.getColumnStyle(columnName, columnType);
    const styles: Record<string, string> = {};
    
    if (style.width) {
      styles['width'] = style.width;
    }
    if (style.minWidth) {
      styles['min-width'] = style.minWidth;
    }
    
    return styles;
  }

  /**
   * Register custom column styling
   */
  registerColumnStyle(columnName: string, config: ColumnStyleConfig): void {
    this.nameStyles[columnName] = config;
  }

  /**
   * Register custom type styling
   */
  registerTypeStyle(typeName: string, config: ColumnStyleConfig): void {
    this.typeStyles[typeName] = config;
  }
}