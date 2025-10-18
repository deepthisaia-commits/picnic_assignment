
import { Component, OnInit } from '@angular/core';
import { ToteService, ToteContentsResponse } from '../../core/services/tote.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-tote-list',
  templateUrl: './tote-list.component.html',
  styleUrls: ['./tote-list.component.css']
})
export class ToteListComponent implements OnInit {
  toteId = 'demo-tote-1';
  data$!: Observable<ToteContentsResponse>;
  loading = true;
  error: string | null = null;

  constructor(private toteService: ToteService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = null;
    this.data$ = this.toteService.getToteContents(this.toteId);
    this.data$.subscribe({
      next: () => (this.loading = false),
      error: (err) => {
        this.loading = false;
        this.error = err?.message || 'Something went wrong.';
      }
    });
  }

  trackByItemId(index: number, item: any) {
    return item.id;
  }
}
