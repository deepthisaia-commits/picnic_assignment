
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ToteService } from './tote.service';

describe('ToteService', () => {
  let service: ToteService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ToteService]
    });
    service = TestBed.inject(ToteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('fetches tote contents', (done) => {
    const mock = { toteId: 'demo-tote-1', items: [], updatedAt: new Date().toISOString() };
    service.getToteContents('demo-tote-1').subscribe(resp => {
      expect(resp.toteId).toBe('demo-tote-1');
      done();
    });

    const req = httpMock.expectOne('/api/totes/demo-tote-1');
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });
});
