import { Injectable, CRUD_TABLE_METADATA_KEY, CrudRepository, CrudTableOptions, RepositoryEntry } from '@config/libs';

@Injectable()
export class RepositoryManager {
  private repositories = new Map<string, RepositoryEntry>();

  registerRepository (repository: CrudRepository, repositoryClass: object): void {
    const metadata = Reflect.getMetadata(CRUD_TABLE_METADATA_KEY, repositoryClass) as CrudTableOptions | undefined;
    if (!metadata) return;
    const key = `${metadata.category}:${metadata.name}`;
    this.repositories.set(key, { repository, metadata });
  }

  getRepository (key: string): RepositoryEntry | undefined {
    return this.repositories.get(key);
  }

  getAllRepositories (): Map<string, RepositoryEntry> {
    return this.repositories;
  }
}
