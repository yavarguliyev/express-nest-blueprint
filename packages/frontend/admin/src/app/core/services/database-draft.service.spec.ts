import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DatabaseDraftService } from './database-draft.service';
import { DatabaseOperation, BulkOperationResponse } from '../interfaces/database-bulk.interface';
import { API_ENDPOINTS } from '../constants/api-endpoints';

describe('DatabaseDraftService', () => {
  let service: DatabaseDraftService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DatabaseDraftService]
    });
    service = TestBed.inject(DatabaseDraftService);
    httpMock = TestBed.inject(HttpTestingController);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty drafts', () => {
    expect(service.draftCount()).toBe(0);
    expect(service.hasDrafts()).toBe(false);
    expect(service.affectedTables()).toEqual([]);
  });

  it('should create a draft without changes initially', () => {
    const operation: DatabaseOperation = {
      type: 'update',
      table: 'users',
      category: 'User Management',
      recordId: 1
    };
    const originalData = { id: 1, name: 'John', email: 'john@example.com' };

    service.createDraft(operation, originalData);

    expect(service.draftCount()).toBe(0); // No changes yet
    expect(service.hasDrafts()).toBe(false);
    
    const draft = service.getDraftForRecord('User Management', 'users', 1);
    expect(draft).toBeTruthy();
    expect(draft?.hasChanges).toBe(false);
  });

  it('should detect changes when updating draft data', () => {
    const operation: DatabaseOperation = {
      type: 'update',
      table: 'users',
      category: 'User Management',
      recordId: 1
    };
    const originalData = { id: 1, name: 'John', email: 'john@example.com' };

    service.createDraft(operation, originalData);
    const draftId = 'User Management:users:1';
    
    // Update with different data
    service.updateDraft(draftId, { id: 1, name: 'Jane', email: 'john@example.com' });

    expect(service.draftCount()).toBe(1);
    expect(service.hasDrafts()).toBe(true);
    expect(service.affectedTables()).toEqual(['users']);
    
    const draft = service.getDraft(draftId);
    expect(draft?.hasChanges).toBe(true);
    expect(draft?.draftData['name']).toBe('Jane');
  });

  it('should remove draft when changes are reverted', () => {
    const operation: DatabaseOperation = {
      type: 'update',
      table: 'users',
      category: 'User Management',
      recordId: 1
    };
    const originalData = { id: 1, name: 'John', email: 'john@example.com' };

    service.createDraft(operation, originalData);
    const draftId = 'User Management:users:1';
    
    // Make changes
    service.updateDraft(draftId, { id: 1, name: 'Jane', email: 'john@example.com' });
    expect(service.draftCount()).toBe(1);
    
    // Revert changes
    service.updateDraft(draftId, originalData);
    expect(service.draftCount()).toBe(0);
    expect(service.hasDrafts()).toBe(false);
  });

  it('should publish drafts and clear successful ones', () => {
    const operation: DatabaseOperation = {
      type: 'update',
      table: 'users',
      category: 'User Management',
      recordId: 1
    };
    const originalData = { id: 1, name: 'John', email: 'john@example.com' };

    service.createDraft(operation, originalData);
    const draftId = 'User Management:users:1';
    service.updateDraft(draftId, { id: 1, name: 'Jane', email: 'john@example.com' });

    expect(service.draftCount()).toBe(1);

    const mockResponse: BulkOperationResponse = {
      success: true,
      results: [{
        operation: {
          type: 'update',
          table: 'users',
          category: 'User Management',
          recordId: 1
        },
        success: true,
        data: { id: 1, name: 'Jane', email: 'john@example.com' }
      }],
      summary: { total: 1, successful: 1, failed: 0 }
    };

    service.publishDrafts().subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(service.draftCount()).toBe(0);
      expect(service.hasDrafts()).toBe(false);
    });

    const req = httpMock.expectOne(`${API_ENDPOINTS.ADMIN.BASE}/bulk-operations`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeDefined();
    expect((req.request.body as { operations: unknown[] }).operations.length).toBe(1);
    req.flush(mockResponse);
  });

  it('should reset all drafts', () => {
    const operation: DatabaseOperation = {
      type: 'update',
      table: 'users',
      category: 'User Management',
      recordId: 1
    };
    const originalData = { id: 1, name: 'John', email: 'john@example.com' };

    service.createDraft(operation, originalData);
    const draftId = 'User Management:users:1';
    service.updateDraft(draftId, { id: 1, name: 'Jane', email: 'john@example.com' });

    expect(service.draftCount()).toBe(1);

    service.resetDrafts();

    expect(service.draftCount()).toBe(0);
    expect(service.hasDrafts()).toBe(false);
    expect(service.affectedTables()).toEqual([]);
  });

  it('should handle complex data changes correctly', () => {
    const operation: DatabaseOperation = {
      type: 'update',
      table: 'users',
      category: 'User Management',
      recordId: 1
    };
    const originalData = { 
      id: 1, 
      name: 'John', 
      tags: ['admin', 'user'],
      metadata: { role: 'admin', active: true },
      createdAt: new Date('2024-01-01')
    };

    service.createDraft(operation, originalData);
    const draftId = 'User Management:users:1';
    
    // Update with different array
    service.updateDraft(draftId, { 
      ...originalData, 
      tags: ['admin', 'user', 'manager'] 
    });
    expect(service.hasDraftChanges(draftId)).toBe(true);

    // Update with different object
    service.updateDraft(draftId, { 
      ...originalData, 
      metadata: { role: 'user', active: true } 
    });
    expect(service.hasDraftChanges(draftId)).toBe(true);

    // Revert to original
    service.updateDraft(draftId, originalData);
    expect(service.hasDraftChanges(draftId)).toBe(false);
  });

  it('should get drafts by table and category', () => {
    // Create drafts for different tables
    service.createDraft({
      type: 'update',
      table: 'users',
      category: 'User Management',
      recordId: 1
    }, { id: 1, name: 'John' });

    service.createDraft({
      type: 'update',
      table: 'notifications',
      category: 'System',
      recordId: 2
    }, { id: 2, message: 'Hello' });

    // Make changes to both
    service.updateDraft('User Management:users:1', { id: 1, name: 'Jane' });
    service.updateDraft('System:notifications:2', { id: 2, message: 'Hi' });

    // Check that drafts were created
    expect(service.draftCount()).toBe(2);
    expect(service.hasDrafts()).toBe(true);
    
    // Check affected tables and categories
    const affectedTables = service.affectedTables();
    const affectedCategories = service.affectedCategories();
    
    expect(affectedTables).toContain('users');
    expect(affectedTables).toContain('notifications');
    expect(affectedCategories).toContain('User Management');
    expect(affectedCategories).toContain('System');
  });

  describe('Local Storage Persistence', () => {
    it('should persist drafts to localStorage', () => {
      const operation: DatabaseOperation = {
        type: 'update',
        table: 'users',
        category: 'User Management',
        recordId: 1
      };
      const originalData = { id: 1, name: 'John', email: 'john@example.com' };

      service.createDraft(operation, originalData);
      const draftId = 'User Management:users:1';
      service.updateDraft(draftId, { id: 1, name: 'Jane', email: 'john@example.com' });

      // Check that data was saved to localStorage
      const stored = localStorage.getItem('database-drafts');
      expect(stored).toBeTruthy();
      
      const parsedStorage = JSON.parse(stored!) as {
        version: string;
        metadata: { totalChanges: number };
        drafts: Record<string, unknown>;
      };
      expect(parsedStorage.version).toBe('1.0.0');
      expect(parsedStorage.metadata.totalChanges).toBe(1);
      expect(parsedStorage.drafts[draftId]).toBeTruthy();
    });

    it('should load drafts from localStorage on initialization', () => {
      // Manually set localStorage data
      const mockStorage = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        drafts: {
          'User Management:users:1': {
            id: 'User Management:users:1',
            tableName: 'users',
            category: 'User Management',
            recordId: 1,
            operation: 'update',
            originalData: { id: 1, name: 'John' },
            draftData: { id: 1, name: 'Jane' },
            hasChanges: true,
            timestamp: new Date().toISOString()
          }
        },
        metadata: {
          totalChanges: 1,
          affectedTables: ['users'],
          lastModified: new Date().toISOString()
        }
      };

      localStorage.setItem('database-drafts', JSON.stringify(mockStorage));

      // Create new service instance to trigger loading
      const newService = TestBed.inject(DatabaseDraftService);
      
      expect(newService.draftCount()).toBe(1);
      expect(newService.hasDrafts()).toBe(true);
      expect(newService.affectedTables()).toEqual(['users']);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      // Set invalid JSON data
      localStorage.setItem('database-drafts', 'invalid-json');

      // Create new service instance
      const newService = TestBed.inject(DatabaseDraftService);
      
      expect(newService.draftCount()).toBe(0);
      expect(newService.hasDrafts()).toBe(false);
      
      // Should have cleared the corrupted data
      expect(localStorage.getItem('database-drafts')).toBeNull();
    });

    it('should handle version mismatch by clearing old data', () => {
      const mockStorage = {
        version: '0.9.0', // Old version
        timestamp: new Date().toISOString(),
        drafts: {},
        metadata: {
          totalChanges: 0,
          affectedTables: [],
          lastModified: new Date().toISOString()
        }
      };

      localStorage.setItem('database-drafts', JSON.stringify(mockStorage));

      // Create new service instance
      const newService = TestBed.inject(DatabaseDraftService);
      
      expect(newService.draftCount()).toBe(0);
      expect(localStorage.getItem('database-drafts')).toBeNull();
    });

    it('should handle localStorage operations safely', () => {
      const operation: DatabaseOperation = {
        type: 'update',
        table: 'users',
        category: 'User Management',
        recordId: 1
      };
      const originalData = { id: 1, name: 'John', email: 'john@example.com' };

      service.createDraft(operation, originalData);
      service.updateDraft('User Management:users:1', { id: 1, name: 'Jane', email: 'john@example.com' });

      expect(service.draftCount()).toBe(1);
      expect(localStorage.getItem('database-drafts')).toBeTruthy();
    });
  });
});