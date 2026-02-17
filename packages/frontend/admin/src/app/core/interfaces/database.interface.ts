export interface Column {
  name: string;
  type: string;
  required: boolean;
  editable: boolean;
}

export interface ColumnMetadata {
  name: string;
  type: string;
  required: boolean;
  editable: boolean;
}

export interface TableMetadata {
  category: string;
  name: string;
  displayName: string;
  tableName: string;
  columns: Column[];
  actions?: {
    create?: boolean;
    update?: boolean;
    delete?: boolean;
  };
}

export interface Schema {
  [category: string]: TableMetadata[];
}

export interface ProfileForm {
  firstName: string;
  lastName: string;
}
