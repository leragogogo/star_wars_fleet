import { Starship } from "./starship";

export interface PageResponseSchema{
    count: number;
    next: string | null;
    previous: string | null;
    results: Starship[];
}