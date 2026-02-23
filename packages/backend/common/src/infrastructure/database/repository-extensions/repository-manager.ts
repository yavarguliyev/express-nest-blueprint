import { CRUD_TABLE_METADATA_KEY } from '../../../core/decorators/crud.decorator';
import { Injectable } from '../../../core/decorators/injectable.decorator';
import { CrudTableOptions, RepositoryEntry } from '../../../domain/interfaces/database/database-common.interface';
import { CrudRepository } from '../../../domain/types/database/database.type';

@Injectable()
export class RepositoryManager {
  private repositories = new Map<string, RepositoryEntry>();

  getRepository = (key: string): RepositoryEntry | undefined => this.repositories.get(key);
  getAllRepositories = (): Map<string, RepositoryEntry> => this.repositories;

  registerRepository(repository: CrudRepository, repositoryClass: object): void {
    const metadata = Reflect.getMetadata(CRUD_TABLE_METADATA_KEY, repositoryClass) as CrudTableOptions | undefined;
    if (!metadata) return;
    const key = `${metadata.category}:${metadata.name}`;
    this.repositories.set(key, { repository, metadata });
  }
}
