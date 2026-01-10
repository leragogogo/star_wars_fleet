import { Component, ElementRef, ViewChild, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';

import { StarshipsService } from '../services/starships.service';


@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: 'app.html',
  styleUrl: 'app.css',
  imports: [FormsModule, AsyncPipe],
})

export class App {
  starshipsService = inject(StarshipsService);

  // Initial widths for the columns
  colWidths = signal<number[]>([40, 150, 150, 150, 150, 150, 150, 150, 150]);

  // Calculate total table width based on column widths
  tableWidth = computed(() => {
    return this.colWidths().reduce((sum: number, width: number) => sum + width, 0);
  });

  private resizingIndex: number | null = null;
  private startX = 0;
  private startWidth = 0;

  private minWidth = 100;

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

  startResize(event: PointerEvent, index: number) {
    // Calculate key resizing values for the current column
    this.resizingIndex = index;
    this.startX = event.clientX;
    this.startWidth = this.colWidths()[this.resizingIndex];

    // Capture pointer so dragging works outside the header cell
    (event.target as HTMLElement).setPointerCapture(event.pointerId);

    const onMove = (e: PointerEvent) => {
      if (this.resizingIndex === null) return;
      const dx = e.clientX - this.startX;

      this.colWidths.update((w: number[]) => {
        const copy = w.slice();
        copy[index] = Math.max(this.minWidth, this.startWidth + dx);
        return copy;
      });
    }

    const onUp = (e: PointerEvent) => {
      this.resizingIndex = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }
}

