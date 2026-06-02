# Architecture

## Current stack

- Vite
- React
- TypeScript
- LocalStorage
- No backend

## Main modules

src/lib/scoring.ts
- Calculates total score and rating label.

src/lib/storage.ts
- Saves, loads, and deletes snapshots from localStorage.

src/templates/
- Generates snapshot and outreach copy.

src/components/
- Reusable UI pieces.

## Data model

Snapshot:
- id
- createdAt
- businessName
- websiteUrl
- city
- niche
- mainService
- notes
- weakness
- competitorNote
- tone
- ctaStyle
- scores
- generated outputs

## Design principles

- Mobile-first
- Fast to use on Android
- Copy buttons everywhere
- No fragile dependencies
- Easy to upgrade into PDF reports later
