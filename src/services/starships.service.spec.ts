import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';

import { StarshipsService } from './starships.service';
import { SwapiClient } from './api/swapi_client';
import { Starship } from '../models/starship';
import { PageResponseSchema } from '../models/page_response_schema';

describe('StarshipsService (Jest)', () => {
  let service: StarshipsService;

  const page1: PageResponseSchema = {
    count: 2,
    next: 'https://swapi.dev/api/starships/?page=2',
    previous: null,
    results: [
      {
        name: 'Millennium Falcon',
        model: 'YT-1300 light freighter',
        manufacturer: 'Corellian Engineering Corporation',
        crew: '4',
        passengers: '6',
        hyperdrive_rating: '0.5',
        cargo_capacity: '100000',
        consumables: '2 months',
      } as unknown as Starship,
      {
        name: 'X-wing',
        model: 'T-65 X-wing',
        manufacturer: 'Incom Corporation',
        crew: '1',
        passengers: '0',
        hyperdrive_rating: '1.0',
        cargo_capacity: '110',
        consumables: '1 week',
      } as unknown as Starship,
    ],
  } as unknown as PageResponseSchema;

  const page2: PageResponseSchema = {
    count: 1,
    next: null,
    previous: 'https://swapi.dev/api/starships/?page=1',
    results: [
      {
        name: 'Star Destroyer',
        model: 'Imperial I-class Star Destroyer',
        manufacturer: 'Kuat Drive Yards',
        crew: '47060',
        passengers: '0',
        hyperdrive_rating: '2.0',
        cargo_capacity: '36000000',
        consumables: '2 years',
      } as unknown as Starship,
    ],
  } as unknown as PageResponseSchema;

  beforeEach(() => {
    const swapiClientMock: Partial<SwapiClient> = {
      getStarshipsPage: jest.fn((page: number) => {
        if (page === 1) return of(page1);
        if (page === 2) return of(page2);
        return of({ count: 3, next: null, previous: null, results: [] } as unknown as PageResponseSchema);
      }),
      patchName: jest.fn(() => of({} as Starship)),
    };

    TestBed.configureTestingModule({
      providers: [
        StarshipsService,
        { provide: SwapiClient, useValue: swapiClientMock },
      ],
    });

    service = TestBed.inject(StarshipsService);
  });

  it('loads paginated data and appends results; stops when there is no next page', () => {
    const swapi = TestBed.inject(SwapiClient) as unknown as { getStarshipsPage: jest.Mock };

    let latest: Starship[] = [];
    service.starships$.subscribe((v) => (latest = v));

    // Page 1
    service.loadNextPage();
    expect(swapi.getStarshipsPage).toHaveBeenCalledTimes(1);
    expect(swapi.getStarshipsPage).toHaveBeenCalledWith(1);
    expect(latest.map((s) => s.name)).toEqual(['Millennium Falcon', 'X-wing']);

    // Page 2
    service.loadNextPage();
    expect(swapi.getStarshipsPage).toHaveBeenCalledTimes(2);
    expect(swapi.getStarshipsPage).toHaveBeenLastCalledWith(2);
    expect(latest.map((s) => s.name)).toEqual(['Millennium Falcon', 'X-wing', 'Star Destroyer']);

    // No more pages -> must not call API again
    service.loadNextPage();
    expect(swapi.getStarshipsPage).toHaveBeenCalledTimes(2);
  });

  it('filters rows by name using the debounced search query', fakeAsync(() => {
    let latestFiltered: Starship[] = [];
    service.filteredStarships$.subscribe((v) => (latestFiltered = v));

    // Seed data directly
    (service as any).starshipsSubject.next([
      { name: 'Millennium Falcon' } as Starship,
      { name: 'X-wing' } as Starship,
      { name: 'Star Destroyer' } as Starship,
    ]);

    // Let the initial debounced empty query flow through
    tick(200);
    expect(latestFiltered.length).toBe(3);

    // Search is case-insensitive + trimmed
    service.setSearchQuery('  Falcon');
    tick(200);
    expect(latestFiltered.map((s) => s.name)).toEqual(['Millennium Falcon']);

    // Clearing search shows everything again
    service.setSearchQuery('');
    tick(200);
    expect(latestFiltered.length).toBe(3);
  }));
});