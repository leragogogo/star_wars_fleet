import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, combineLatest } from 'rxjs';
import { catchError, finalize, tap, debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { SwapiClient } from './api/swapi_client';
import { Starship } from '../models/starship';
import { PageResponseSchema } from '../models/page_response_schema';
import { inject } from '@angular/core';

/**
 * Central state manager for the Starships table:
 * - paginated loading
 * - search filtering
 * - editing starship names
 */
@Injectable({ providedIn: 'root', })
export class StarshipsService {
    swapiClient = inject(SwapiClient);

    private starshipsSubject = new BehaviorSubject<Starship[]>([]);
    private loadingSubject = new BehaviorSubject<boolean>(false);
    private errorSubject = new BehaviorSubject<string | null>(null);
    private hasMoreSubject = new BehaviorSubject<boolean>(true);

    private editingErrorSubject = new BehaviorSubject<string | null>(null);

    private searchQuerySubject = new BehaviorSubject<string>('');

    readonly starships$ = this.starshipsSubject.asObservable();
    readonly loading$ = this.loadingSubject.asObservable();
    readonly error$ = this.errorSubject.asObservable();
    readonly hasMore$ = this.hasMoreSubject.asObservable();

    readonly editingError$ = this.editingErrorSubject.asObservable();

    // Debounced search query
    readonly searchQuery$ = this.searchQuerySubject.asObservable().pipe(
        map((q: string) => q.trim()),
        debounceTime(150),
        distinctUntilChanged(),
    );

    readonly filteredStarships$ = combineLatest([this.starships$, this.searchQuery$]).pipe(
        map(([starships, query]: [Starship[], string]) => {
            query = query.toLowerCase().trim();
            if (!query) return starships;

            const filtred = starships.filter(
                (starship) => {
                    return starship.name.toLowerCase().trim().includes(query);
                }
            )

            return filtred;
        })
    );

    readonly filteredCount$ = this.filteredStarships$.pipe(
        map((starships: Starship[]) => starships.length)
    );

    setSearchQuery(query: string) {
        this.searchQuerySubject.next(query);
    }

    private currentPage = 1

    /**
     * Loads next page of data. 
     * When there no more data, doesn't call API
     */
    loadNextPage(): void {
        // Don't proceed when the loading of previous page still running
        if (this.loadingSubject.value) return;

        // Don't proceed when no more data
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

    /**
    * Retry after an error
    */
    retry(): void {
        if (this.loadingSubject.value) return;

        this.errorSubject.next(null);

        // Try again with the same page number that previously failed
        this.loadNextPage();
    }

    /**
     * Handles starship's name editing 
     */
    editName(startshipName: string, updatedName: string): void {
        // Simulates API call
        this.swapiClient.patchName(startshipName, updatedName).pipe(
            tap(() => {
                const currentStarships = this.starshipsSubject.value;

                // Find updated starship
                const editedStarshipIndex = this.starshipsSubject.value.findIndex(
                    (starship: Starship) => starship.name == startshipName
                );

                // Update starship with a new name
                let editedStarship = this.starshipsSubject.value[editedStarshipIndex];
                editedStarship = { ...currentStarships[editedStarshipIndex], name: updatedName };

                // Update the list of starships
                this.starshipsSubject.next(
                    [
                        ...currentStarships.slice(0, editedStarshipIndex),
                        editedStarship,
                        ...currentStarships.slice(editedStarshipIndex + 1)
                    ]);
            }),
            catchError((err: HttpErrorResponse) => {
                this.editingErrorSubject.next(err.message);
                return EMPTY;
            }
            ),
        ).subscribe()
    }
}