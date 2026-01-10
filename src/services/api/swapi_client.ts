import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponseSchema } from '../../models/page_response_schema';
import { Starship } from '../../models/starship';

@Injectable({ providedIn: 'root' })
export class SwapiClient {
    private http = inject(HttpClient);

    private readonly baseUrl = 'https://swapi.dev/api';

    /**
     * Gets a page of starships using the SWAPI server-side pagination.
     */
    getStarshipsPage(page: number): Observable<PageResponseSchema> {
        const params = new HttpParams().set("page", String(page));
        return this.http.get<PageResponseSchema>(`${this.baseUrl}/starships`, { params });
    }

    /**
     * API call to edit a starship's name.
     * It's a placeholder in the current implementation.
     */
    patchName(startshipId: string, updatedName: string): Observable<Starship> {
        return this.http.get<Starship>(`${this.baseUrl}/starships/9/`);
    }

}