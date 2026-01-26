# 🎲 TTRPG Random Table Dashboard

A web application for curating and rolling on random tables for tabletop role-playing games. Built with SvelteKit and optimized for iPad use.

## Features

- 📊 **Curated Dashboards**: Organize related tables into themed dashboards
- 🎲 **Quick Rolling**: Touch-friendly interface for rolling on tables
- 💾 **Local Storage**: Your tables and dashboards persist in the browser
- 📱 **Mobile Optimized**: Great experience on iPad and other tablets
- 🚀 **Static Site**: Deployable to GitHub Pages

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

## Building for Production

```bash
npm run build
```

This creates a static build in the `build` directory.

## Deploying to GitHub Pages

### Option 1: Automatic Deployment with GitHub Actions

1. Go to your GitHub repository settings
2. Navigate to **Settings > Pages**
3. Under "Build and deployment", select **Source: GitHub Actions**
4. Push to the `main` branch - the site will automatically deploy

### Option 2: Manual Deployment

```bash
npm run deploy
```

**Important**: Update the `base` path in `svelte.config.js` to match your repository name:

```javascript
paths: {
  base: process.env.NODE_ENV === 'production' ? '/your-repo-name' : ''
}
```

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   └── TableCard.svelte      # Table display and rolling component
│   ├── types.ts                  # TypeScript type definitions
│   ├── stores.ts                 # Svelte stores for data management
│   ├── utils.ts                  # Dice rolling and utility functions
│   └── sampleData.ts             # Example tables and dashboards
├── routes/
│   ├── +layout.svelte            # App layout and navigation
│   ├── +page.svelte              # Dashboard view (home page)
│   └── tables/
│       └── +page.svelte          # All tables view
├── app.html                      # HTML template
└── app.css                       # Global styles
```

## Usage

### Rolling on Tables

1. Navigate to a dashboard from the home page
2. Click the "🎲 Roll" button on any table card
3. The result will appear in the card

### Sample Data

The app comes with sample tables including:
- Weather Table
- NPC Personality Traits
- Tavern Events

Sample data loads automatically if the app detects no existing data.

## Customization

### Adding Tables

Tables are stored in localStorage. You can:
- Edit `src/lib/sampleData.ts` to change initial tables
- Future updates will include UI for creating/editing tables

### Theming

Color scheme is defined in CSS variables in `src/app.css`:

```css
:root {
  --primary: #7c3aed;
  --bg: #0f172a;
  /* ... */
}
```

## Technologies

- **SvelteKit** - Full-stack framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **@sveltejs/adapter-static** - Static site generation

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a pull request.