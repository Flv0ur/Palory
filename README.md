# Palory task app starter

This repository is initialized with a Vite + React single page app. It now includes a Tailwind-styled task capture experience that saves data in `localStorage` so you can start iterating right away.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
   If your network blocks the public npm registry, point npm to your mirror or proxy first.
2. Launch the dev server:
   ```bash
   npm run dev
   ```
3. Lint the project:
   ```bash
   npm run lint
   ```
4. Build for production:
   ```bash
   npm run build
   ```

## Features
- React 18 + Vite 5 toolchain
- Tailwind CSS with PostCSS + Autoprefixer
- A focused task input with title, notes, recommended date, deadline, and completion toggles
- Tasks persist to `localStorage` under the `tasks` key so you can resume where you left off

Feel free to adapt the component into a larger app shell or extend the data model as you continue building out the task management experience.
