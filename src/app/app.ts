import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { Grid, GridRow, GridCell } from '@angular/aria/grid';

import { StarshipsService } from '../services/starships.service';


@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: 'app.html',
  styleUrl: 'app.css',
  imports: [Grid, GridRow, GridCell, FormsModule, AsyncPipe],
})

export class App {
  starshipsService = inject(StarshipsService);

  // The element that indicates that the scroll reaches bottom, 
  // and we need to fetch new portion of data
  @ViewChild('bottom') bottom!: ElementRef<HTMLElement>;

  private io?: IntersectionObserver;

  ngAfterViewInit(): void {
    // Initial load of the first page
    this.starshipsService.loadNextPage();

    // Load next page when intersections take place
    this.io = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        this.starshipsService.loadNextPage();
      }
    });

    // Connect the html element to IntersectionObserver
    this.io.observe(this.bottom.nativeElement);
  }


  ngOnDestroy(): void {
    this.io?.disconnect();
  }
}

