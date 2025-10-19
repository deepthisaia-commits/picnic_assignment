import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, switchMap, catchError } from 'rxjs/operators';
import { ToteContentsResponse, ToteItem } from '../../../core/models/tote.models';
import { EnhancedToteService } from '../../../core/services/enhanced-tote.service';
import { ToteStateService } from '../../../core/state/tote.state.service';

@Component({
  selector: 'app-enhanced-tote-list',
  templateUrl: './enhanced-tote-list.component.html',
  styleUrls: ['./enhanced-tote-list.component.css']
})
export class EnhancedToteListComponent implements OnInit, OnDestroy {
  currentTote$ = this.stateService.currentTote$;
  loading$ = this.stateService.loading$;
  error$ = this.stateService.error$;
  scanHistory$ = this.stateService.scanHistory$;

  hasScannedBarcode = false;
  sortBy: 'name' | 'sku' | 'quantity' = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  filterText = '';
  showFilters = false;

  private destroy$ = new Subject<void>();

  constructor(
    private toteService: EnhancedToteService,
    private stateService: ToteStateService
  ) {}

  ngOnInit(): void {
    this.loadDefaultTote();
    this.setupErrorHandling();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onBarcodeScanned(barcode: string): void {
    this.hasScannedBarcode = true;
    this.filterText = '';
    this.loadTote(barcode);
  }

  loadTote(toteId: string): void {
    this.toteService.getToteContents(toteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log(`Successfully loaded tote: ${toteId}`);
        },
        error: (err) => {
          console.error(`Failed to load tote: ${toteId}`, err);
        }
      });
  }

  retry(): void {
    const state = this.stateService.getState();
    if (state.lastScannedId) {
      this.loadTote(state.lastScannedId);
    }
  }

  refreshTote(): void {
    const state = this.stateService.getState();
    if (state.lastScannedId) {
      this.toteService.clearCache(state.lastScannedId);
      this.loadTote(state.lastScannedId);
    }
  }

  sortItems(items: ToteItem[]): ToteItem[] {
    if (!items) {
      return [];
    }

    const sorted = [...items].sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'sku':
          comparison = a.sku.localeCompare(b.sku);
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }

  filterItems(items: ToteItem[]): ToteItem[] {
    if (!items || !this.filterText) {
      return items;
    }

    const searchTerm = this.filterText.toLowerCase().trim();
    return items.filter(item =>
      item.name.toLowerCase().includes(searchTerm) ||
      item.sku.toLowerCase().includes(searchTerm)
    );
  }

  toggleSort(field: 'name' | 'sku' | 'quantity'): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  clearFilter(): void {
    this.filterText = '';
  }

  exportToCSV(tote: ToteContentsResponse): void {
    const headers = ['SKU', 'Name', 'Quantity'];
    const rows = tote.items.map(item => [
      item.sku,
      `"${item.name}"`,
      item.quantity
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tote-${tote.toteId}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  printTote(): void {
    window.print();
  }

  trackByItemId(index: number, item: ToteItem): string {
    return item.id;
  }

  getTotalQuantity(items: ToteItem[]): number {
    if (!items) {
      return 0;
    }
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }

  private loadDefaultTote(): void {
    this.loadTote('demo-tote-1');
  }

  private setupErrorHandling(): void {
    this.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        if (error.hasError) {
          console.error('Tote loading error:', error);
        }
      });
  }
}
