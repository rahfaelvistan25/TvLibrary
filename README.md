# My TV & Movie Library (No Server)

A lightweight, offline, single‑page web app that auto‑builds a personal media library from your local folders using the browser’s folder picker. No backend, no Node.js — just open index.html, select your Movie and TV Series folders, and start watching. Your library and last watched positions are saved in your browser (localStorage) so it auto‑loads next time.

## Features

- Auto-scan local folders via folder picker; no manual coding of media lists
- Remembers your library and continue‑watching progress across sessions
- TV Series browser with seasons and episodes
- Movie grid with instant playback
- Search filter
- Poster support with automatic fallback to posters/placeholder.jpg
- Runs fully offline in modern browsers

## Folder Format

Follow this structure in your drive before importing.

- Top-level folders you will select:
  - Movie
  - TV Series

Movies:
- One folder per movie using “Title (Year)”
- Inside, one main video file with the same name

Example:
```
Movie/
  Inception (2010)/Inception (2010).mp4
  Interstellar (2014)/Interstellar (2014).mkv
  The Matrix (1999)/The Matrix (1999).mp4
```

TV Series:
- One folder per show
- Seasons named “Season 01”, “Season 02”, …
- Episode filenames include SxxExx (two digits)

Example:
```
TV Series/
  Friends/
    Season 01/
      Friends.S01E01.mkv
      Friends.S01E02.mp4
    Season 02/
      Friends.S02E01.mp4

  How To Get Away With Murder/
    Season 01/
      How.to.Get.Away.With.Murder.S01E01.mp4

  The Big Bang Theory/
    Season 07/
      The.Big.Bang.Theory.S07E03.mkv
```

Supported video extensions: mp4, mkv, webm, avi, mov

## Posters (Optional)

- Put poster images in the project’s posters/ folder (next to index.html)
- Naming rule: lowercase and spaces → dashes
  - Example show posters: posters/friends.jpg, posters/how-to-get-away-with-murder.jpg
  - Example movie posters: posters/inception-2010.jpg
- Fallback: posters/placeholder.jpg is used if a matching poster isn’t found (add your own placeholder.jpg)

## Getting Started

1) Download or clone this repository.

2) Ensure this project structure:
```
movie-website/
├─ index.html
├─ css/
│  └─ style.css
├─ js/
│  ├─ media_library.js
│  └─ app.js
└─ posters/
   └─ placeholder.jpg      (required for safe fallback)
```

3) Open index.html in a modern browser (Chrome, Edge, Firefox). No server required.

4) Click “Select Library Folders” and pick your Movie and TV Series folders (or their parent and select both).

5) The app scans your files and builds the library automatically. It saves everything in localStorage for next time.

6) Optional: Add custom posters to the posters/ folder using the naming rules above.

## Usage Tips

- Continue Watching: The app saves your last season/episode and timestamp per show.
- Refreshing the Library: If you add/remove files on disk, click “Select Library Folders” again to rescan and update.
- Episode Order: Include SxxExx in filenames (e.g., S01E03) for perfect ordering.
- Autoplay: Browsers may require a user click before playing audio/video.
- Privacy: Your file list and watch progress stay in your browser storage; the app does not upload anything.

## Troubleshooting

- Nothing appears after selecting folders:
  - Verify your folder names are exactly “Movie” and “TV Series” (case-insensitive is typically okay, but keep it consistent).
  - Ensure your files use supported video extensions.
- Episodes out of order:
  - Ensure filenames contain SxxExx (e.g., S02E07).
- Posters missing:
  - Confirm the poster file exists in posters/ with lowercase-dash naming, otherwise placeholder.jpg will be used.
- Changed files not reflected:
  - Re-click “Select Library Folders” to rebuild the saved library.

## Tech Overview

- Pure HTML/CSS/JavaScript
- Folder access via the browser’s directory picker input
- In-memory library based on FileList; persisted via localStorage
- Video playback via HTML5 <video> with blob: URLs generated from selected File objects
- No backend, no build step

## Security Note

Browsers do not allow automatic scanning of your disk for privacy reasons. The folder picker grants the app read access to the selected directories for that session; the app stores a representation of your library (names/paths) in localStorage so it can reload it next time without rescanning, but the actual file handles must be reselected when security constraints require it. In most cases, the saved library is sufficient for reopening and playback until the page is refreshed without prior permissions. If your browser restricts blob reuse across sessions, reselect the folders to rehydrate file handles.

## Roadmap (Optional Enhancements)

- Optional metadata scraping (title, year, synopsis) via user-provided JSON
- Subtitles picker (VTT/SRT sidecar files)
- Keyboard shortcuts overlay and configurable skip intervals
- Dark/light theme toggle

## License

MIT — do whatever you want, but no warranty. Enjoy your offline media library!
