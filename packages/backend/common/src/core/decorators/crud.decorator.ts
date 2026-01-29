import { CrudTableOptions } from '../../domain/interfaces/database/database-common.interface';

export const CRUD_TABLE_METADATA_KEY = 'admin:crud_table';

export const CrudTable = (options: CrudTableOptions): ClassDecorator => {
  return (target: object) => {
    Reflect.defineMetadata(CRUD_TABLE_METADATA_KEY, options, target);
  };
};
