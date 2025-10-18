
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ToteListComponent } from './tote-list.component';
import { ToteService } from '../../core/services/tote.service';
import { of, throwError } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('ToteListComponent', () => {
  let component: ToteListComponent;
  let fixture: ComponentFixture<ToteListComponent>;
  let toteServiceSpy: any;

  beforeEach(waitForAsync(() => {
    toteServiceSpy = {
      getToteContents: jasmine.createSpy('getToteContents').and.returnValue(of({
        toteId: 'demo-tote-1',
        items: [{ id: '1', sku: 'X', name: 'Test', quantity: 1 }],
        updatedAt: new Date().toISOString()
      }))
    };

    TestBed.configureTestingModule({
      imports: [MatCardModule, MatListModule, BrowserAnimationsModule],
      declarations: [ToteListComponent],
      providers: [{ provide: ToteService, useValue: toteServiceSpy }]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ToteListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render items', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-list-item')).toBeTruthy();
    expect(compiled.textContent).toContain('Test');
  });

  it('should show error when service fails', () => {
    toteServiceSpy.getToteContents.and.returnValue(throwError(() => ({ status: 500, message: 'oops' })));
    component.load();
    fixture.detectChanges();
    expect(component.error).toBe('oops');
  });
});
