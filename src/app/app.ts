import { Component, ElementRef, ViewChild, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { Grid, GridRow, GridCell, GridCellWidget } from '@angular/aria/grid';
import { StarshipsService } from '../services/starships.service';
import { Starship } from '../models/starship';


@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: 'app.html',
  styleUrl: "app.css",
  imports: [FormsModule, AsyncPipe, Grid, GridRow, GridCell, GridCellWidget,],
})

export class App {
  // Column configuration
  columns: Array<{ key: keyof Starship; label: string, width: number }> = [
    { key: 'name', label: 'Name', width: 150 },
    { key: 'model', label: 'Model', width: 150 },
    { key: 'manufacturer', label: 'Manufacturer', width: 150 },
    { key: 'crew', label: 'Crew', width: 150 },
    { key: 'passengers', label: 'Passengers', width: 150 },
    { key: 'hyperdrive_rating', label: 'Hyperdrive Rating', width: 150 },
    { key: 'cargo_capacity', label: 'Cargo Capacity', width: 150 },
    { key: 'consumables', label: 'Consumables', width: 150 },
  ];

  // Returns a string value for a generic cell
  cellValue(starship: Starship, key: keyof Starship): string {
    return starship[key]
  }

  starshipsService = inject(StarshipsService);

  // Initial widths of the columns
  colWidths = signal<number[]>(this.columns.map(c => c.width));

  // Calculate total table width based on column widths
  tableWidth = computed(() => {
    return this.colWidths().reduce((sum: number, width: number) => sum + width, 0);
  });

  // Local store for name input
  nameDraft: string = '';

  private resizingIndex: number | null = null;
  private startX = 0;
  private startWidth = 0;

  private minWidth = 100;

  // The element that indicates that the scroll reaches bottom, 
  // and we need to fetch new portion of data
  @ViewChild('bottom') bottom!: ElementRef<HTMLElement>;

  private io?: IntersectionObserver;

  ngOnInit(): void {
    // Initial load of the first page
    this.starshipsService.loadNextPage();
  }

  ngAfterViewInit(): void {
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

  /**
   * Activates widget on click
   * @param widget Edit button
   */
  onClickEdit(widget: GridCellWidget) {
    if (widget.isActivated()) return;

    widget.activate();
  }

  /**
   * Starts editing for the "Name" cell
   * - Copies the current starship name into a local draft 
   * - Focuses the input
   * @param event Event emitted by the grid widget activation
   * @param starship The row object being edited
   * @param inputEl The <input> element inside the cell with focus
   */
  startEdit(
    event: KeyboardEvent | FocusEvent | undefined,
    starship: Starship,
    inputEl: HTMLInputElement,
  ): void {
    this.nameDraft = starship.name;

    inputEl.focus();

    if (!(event instanceof KeyboardEvent)) return;

    if (event.key.length === 1) {
      this.nameDraft = event.key;
    }
  }

  /**
   * Finishes editing when the widget deactivates
   * We only accept the edit when the user presses Enter
   * @param event Event emitted by the grid widget activation
   * @param starship The row object being edited
   */
  completeEdit(
    event: KeyboardEvent | FocusEvent | undefined,
    starship: Starship
  ): void {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }
    if (event.key === 'Enter') {
      starship.name = this.nameDraft;
    }

  }

}

