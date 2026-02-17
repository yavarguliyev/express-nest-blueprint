import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PaginationService {
  calculateTotalPages (total: number, limit: number): number {
    return Math.ceil(total / limit);
  }

  generatePageNumbers (currentPage: number, totalPages: number): number[] {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    let start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    if (end === totalPages) start = Math.max(1, totalPages - 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  isValidPageChange (newPage: number, totalPages: number): boolean {
    return newPage >= 1 && newPage <= totalPages;
  }
}
