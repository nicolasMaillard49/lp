# Landing page — Acquisition clients artisans (Google Ads)

Landing page Next.js : une vidéo de présentation au centre, peu de texte,
chaleureuse & premium, animée et optimisée mobile.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:3000
```

## Personnaliser

Tout le contenu (textes, liens, vidéo) est dans **un seul fichier** :

```
config/site.ts
```

- `name` — ton nom / nom de l'offre (en-tête + footer)
- `ctaHref` — lien des boutons (Calendly, formulaire, mailto…)
- `hero`, `method`, `proof`, `finalCta` — les textes de chaque section
- `video.src` / `video.poster` — chemins de tes médias dans `/public`

## Ajouter ta vidéo

Dépose `presentation.mp4` (et `poster.jpg` si tu veux) dans `/public`.
Sans vidéo, un dégradé ambré s'affiche à la place — la page reste impeccable.

## Stack & design

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 — tokens **OKLCH**, fond blanc pur, l'ambre porte la chaleur
- `motion` pour les animations (respecte `prefers-reduced-motion`)
- Polices : **Fraunces** (display serif) + **Manrope** (sans), via `next/font`

## Déployer

```bash
npm i -g vercel
vercel        # preview
vercel --prod # production
```
