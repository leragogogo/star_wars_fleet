# Star Wars Fleet

Single‑page Angular app that displays Starships from SWAPI in a data grid with infinite scroll, editing, and search functionality.

The app is available at https://leragogogo.github.io/star_wars_fleet/.

---

## Important Notes
The SWAPI(https://swapi.dev) doesn’t have a valid certificate anymore. To run this app, you need to start a browser session without certificate verification rules. I couldn’t use another API since all of the ones that I found do not have server-side pagination, which is required by the task.

Please find the browser setup instructions for Windows, MacOS, and Linux that are needed to run my app both locally and from the deployed site:

### Windows Instruction 
Run this command in the console:
```console
"C:\Program Files\Google\Chrome\Application\chrome.exe" --ignore-certificate-errors
```
Now you can run a local server or a deployed site in this browser session.

### MacOs Instruction
Run this command in the console:
```console
open -na "Google Chrome" --args --ignore-certificate-errors --user-data-dir=/tmp/chrome-insecure
```
Now you can run a local server or a deployed site in this browser session.

### Linux
Run this command in the console:
```console
google-chrome --ignore-certificate-errors --user-data-dir=/tmp/chrome-insecure
```
Now you can run a local server or a deployed site in this browser session.

---

## SWAPI resource

This project uses the **Starships** resource:

- Endpoint: `https://swapi.dev/api/starships?page=<n>`


---

## Getting started

### Prerequisites
- Node.js + npm

### Clone repository
```console
git clone https://github.com/leragogogo/star_wars_fleet.git
cd star_wars_fleet
```

### Install
```console
npm install
```

### Run the app
```console
npm start
# or: ng serve
```
---

## Tests

Run unit tests with Jest:

```console
npm test
```

Minimal required tests are provided:
- **Service test**: pagination/combining pages and search filtering
- **Component test**: cells editing

(see `*.spec.ts` files).

---

## Infinite scroll

- The component places a **sentinel element** (`#bottom`) at the bottom of the table.
- An **IntersectionObserver** watches the sentinel.
- When the sentinel becomes visible, `starshipsService.loadNextPage()` is called.

See `src/app/app.ts` and `src/services/starships.service.ts`.

---

## Search

- Search input is above the grid.
- Filtering is **client-side** over the already loaded rows.
- Query is **debounced** (`150ms`) and filtering is case‑insensitive.
- When the query is non-empty and no rows match, a **“No matches found”** overlay is displayed.

See `src/services/starships.service.ts` (`searchQuery$`, `filteredStarships$`) and `src/app/app.html`.

---

## Editable cells

- **Editable column:** `Name`
- Editing is activated via the edit icon (grid cell widget).
- Draft value is stored locally in the component (`nameDraft`).
- The edit is committed on Enter

There is also a service method (`editName(...)`) and a placeholder API method (`patchName(...)`) to make it easy to replace for an actual API call later on.

---

## Column resizing

- Header cells have a drag handle (`cursor-col-resize` span).
- Resizing is implemented with `pointerdown`, `pointermove`, and `pointerup` listeners.
- Column widths are stored in a `signal` (`colWidths`).
- Widths are applied through a `<colgroup>` and the table’s total width is computed (`tableWidth`).
- The table is wrapped in `overflow-x-auto` so horizontal scrolling appears when needed.

See `src/app/app.ts` (`startResize`, `colWidths`, `tableWidth`) and `src/app/app.html`.

---

## Trade-offs / limitations

- **Caching pages:** Once a page is loaded, it is stored locally and never revalidated during infinite scroll. Therefore, if the backend data changes for rows that were already loaded, the UI will continue showing the old values until the user reloads the app.

---

## Third‑party packages used

- `@angular/aria/grid` — grid primitives and editable cell widget
- Tailwind CSS — styling utilities
- Jest — tests
