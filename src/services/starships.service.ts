import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { SwapiClient } from './api/swapi_client';
import { Starship } from '../models/starship';
import { PageResponseSchema } from '../models/page_response_schema';
import { inject } from '@angular/core';


@Injectable({ providedIn: 'root', })
export class StarshipsService {
    swapiClient = inject(SwapiClient);

    private starshipsSubject = new BehaviorSubject<Starship[]>([]);
    private loadingSubject = new BehaviorSubject<boolean>(false);
    private errorSubject = new BehaviorSubject<string | null>(null);
    private hasMoreSubject = new BehaviorSubject<boolean>(true);

    readonly starships$ = this.starshipsSubject.asObservable();
    readonly loading$ = this.loadingSubject.asObservable();
    readonly error$ = this.errorSubject.asObservable();
    readonly hasMore$ = this.hasMoreSubject.asObservable();

    private currentPage = 1

    /**
     * Loads next page of data. 
     * When there no more data, doesn't call API
     */
    loadNextPage(): void {
        // Don't proceed when the loading of previous page still running.
        if (this.loadingSubject.value) return;

        // Don't proceed when no more data.
        if (!this.hasMoreSubject.value) return;

        this.loadingSubject.next(true);
        this.errorSubject.next(null);

        this.swapiClient.getStarshipsPage(this.currentPage).pipe(
            tap((page: PageResponseSchema) => {
                // Add new data to a list of starships
                this.starshipsSubject.next([...this.starshipsSubject.value, ...page.results])

                this.hasMoreSubject.next(page.next !== null);

                this.currentPage += 1;
            }),
            catchError((err: HttpErrorResponse) => {
                this.errorSubject.next(err.message);
                return EMPTY;
            }
            ),
            finalize(() => this.loadingSubject.next(false))
        ).subscribe();
    }
}