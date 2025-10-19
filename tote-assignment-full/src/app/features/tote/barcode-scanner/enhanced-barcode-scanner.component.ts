import { Component, EventEmitter, Output, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Subject, fromEvent, merge } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, filter, tap, map } from 'rxjs/operators';
import { BarcodeValidators, getValidationErrorMessage } from '../../../core/validators/barcode.validators';
import { VALIDATION_RULES, ScanStatus } from '../../../core/models/tote.models';
import { ToteStateService } from '../../../core/state/tote.state.service';
import { EnhancedToteService } from '../../../core/services/enhanced-tote.service';

@Component({
  selector: 'app-enhanced-barcode-scanner',
  templateUrl: './enhanced-barcode-scanner.component.html',
  styleUrls: ['./enhanced-barcode-scanner.component.css']
})
export class EnhancedBarcodeScannerComponent implements OnInit, OnDestroy {
  @Output() barcodeScanned = new EventEmitter<string>();
  @ViewChild('barcodeInput', { static: false }) barcodeInput!: ElementRef<HTMLInputElement>;

  barcodeControl = new FormControl('', {
    validators: [
      Validators.required,
      BarcodeValidators.minLength(VALIDATION_RULES.MIN_LENGTH),
      BarcodeValidators.maxLength(VALIDATION_RULES.MAX_LENGTH),
      BarcodeValidators.pattern(),
      BarcodeValidators.noWhitespace(),
      BarcodeValidators.sanitizeInput()
    ],
    updateOn: 'change'
  });

  scanStatus$ = this.stateService.scanStatus$;
  lastScannedId$ = this.stateService.lastScannedId$;
  isLoading$ = this.stateService.isLoading$;

  scanHistory: string[] = [];
  showHistory = false;
  scanCount = 0;
  lastScanTime: number | null = null;
  isRateLimited = false;

  private destroy$ = new Subject<void>();
  private scanCooldown$ = new Subject<void>();
  private readonly MAX_SCAN_RATE = 5;
  private readonly RATE_LIMIT_WINDOW_MS = 10000;
  private readonly COOLDOWN_MS = VALIDATION_RULES.SCAN_COOLDOWN;

  readonly ScanStatus = ScanStatus;

  constructor(
    private stateService: ToteStateService,
    private toteService: EnhancedToteService
  ) {}

  ngOnInit(): void {
    this.setupBarcodeStream();
    this.setupKeyboardShortcuts();
    this.setupRateLimiting();
    this.loadScanHistory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.scanCooldown$.complete();
  }

  private setupBarcodeStream(): void {
    this.barcodeControl.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(VALIDATION_RULES.DEBOUNCE_TIME),
        distinctUntilChanged(),
        map(value => value?.trim() || ''),
        filter(value => value.length >= VALIDATION_RULES.MIN_LENGTH)
      )
      .subscribe(barcode => {
        if (this.barcodeControl.valid) {
          this.prefetchTote(barcode);
        }
      });
  }

  private setupKeyboardShortcuts(): void {
    if (typeof document !== 'undefined') {
      merge(
        fromEvent<KeyboardEvent>(document, 'keydown').pipe(
          filter(event => event.ctrlKey && event.key === 'k')
        ),
        fromEvent<KeyboardEvent>(document, 'keydown').pipe(
          filter(event => event.key === 'F3')
        )
      )
        .pipe(takeUntil(this.destroy$))
        .subscribe(event => {
          event.preventDefault();
          this.focusInput();
        });
    }
  }

  private setupRateLimiting(): void {
    this.scanCooldown$
      .pipe(
        takeUntil(this.destroy$),
        tap(() => {
          this.isRateLimited = true;
        }),
        debounceTime(this.COOLDOWN_MS)
      )
      .subscribe(() => {
        this.isRateLimited = false;
      });
  }

  onScanClick(): void {
    if (this.canScan()) {
      this.processBarcode();
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (this.canScan()) {
        this.processBarcode();
      }
    }
  }

  private canScan(): boolean {
    if (this.isRateLimited) {
      console.warn('Scan rate limited. Please wait.');
      return false;
    }

    if (this.barcodeControl.invalid) {
      this.barcodeControl.markAsTouched();
      return false;
    }

    if (!this.checkRateLimit()) {
      alert('Too many scans. Please wait a moment.');
      return false;
    }

    return true;
  }

  private processBarcode(): void {
    const barcode = this.barcodeControl.value?.trim();
    if (!barcode) {
      return;
    }

    this.recordScan();
    this.scanCooldown$.next();

    this.addToHistory(barcode);
    this.barcodeScanned.emit(barcode);

    setTimeout(() => {
      this.barcodeControl.reset();
      this.focusInput();
    }, 300);
  }

  private prefetchTote(barcode: string): void {
    this.toteService.prefetchTote(barcode);
  }

  clearInput(): void {
    this.barcodeControl.reset();
    this.stateService.clearError();
    this.focusInput();
  }

  focusInput(): void {
    setTimeout(() => {
      this.barcodeInput?.nativeElement?.focus();
    }, 100);
  }

  toggleHistory(): void {
    this.showHistory = !this.showHistory;
  }

  selectFromHistory(barcode: string): void {
    this.barcodeControl.setValue(barcode);
    this.showHistory = false;
    this.processBarcode();
  }

  clearHistory(): void {
    this.scanHistory = [];
    this.saveScanHistory();
    this.stateService.clearHistory();
  }

  getErrorMessage(): string {
    const errors = this.barcodeControl.errors;
    return errors ? getValidationErrorMessage(errors) : '';
  }

  private addToHistory(barcode: string): void {
    this.scanHistory = [barcode, ...this.scanHistory.filter(b => b !== barcode)].slice(0, 10);
    this.saveScanHistory();
  }

  private loadScanHistory(): void {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('scanHistory');
      if (stored) {
        try {
          this.scanHistory = JSON.parse(stored);
        } catch (e) {
          console.error('Failed to load scan history', e);
        }
      }
    }
  }

  private saveScanHistory(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('scanHistory', JSON.stringify(this.scanHistory));
      } catch (e) {
        console.error('Failed to save scan history', e);
      }
    }
  }

  private recordScan(): void {
    this.scanCount++;
    this.lastScanTime = Date.now();
  }

  private checkRateLimit(): boolean {
    const now = Date.now();

    if (!this.lastScanTime || now - this.lastScanTime > this.RATE_LIMIT_WINDOW_MS) {
      this.scanCount = 0;
      return true;
    }

    return this.scanCount < this.MAX_SCAN_RATE;
  }
}
