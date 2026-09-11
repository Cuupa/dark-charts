# Frontend, UI & Accessibility

Stack: Next.js 16 App Router, React 19, Tailwind v4 (PostCSS), Framer Motion, Lenis, Recharts, Phosphor/Lucide icons, Radix primitives.

## CI colors (exact hex)

Live darkTunes.com palette. Keep Dark Charts on the same CI.

| Token | Hex | Use |
|-------|-----|-----|
| background | `#0d0d1a` | Page background |
| foreground | `#f3f0ff` | Primary text |
| card / muted | `#1a1a2e` | Cards, modals, surfaces |
| primary / accent / ring | `#6d28d9` | CTAs, active nav, focus, glow |
| secondary | `#9333ea` | Secondary actions, promo |
| border / input | `#2d2d4e` | Borders, inputs |

Defined in `app/globals.css` `:root` and `src/config/defaultTheme.ts`. `tailwind.config.js` is IDE-only for token names; runtime tokens live in CSS. Admin → Colors can override; reset to defaults to restore this CI.

Fonts: **Exo 2** (body) and **Orbitron** (headings / `.display-font`) via `next/font/google` in `app/layout.tsx`.

## Theme

- `ThemeLoader` (`app/_components/ThemeLoader.tsx`) + `ThemeStyleInjector` inject the active theme server-side (no FOUC).
- Runtime color overrides in **Admin → Colors**. `theme.json` holds the active theme palette.

## Providers

`app/providers.tsx` → `ErrorBoundary` → `LenisProvider` → `AppProviders`, plus `CookieConsentBanner` and `Toaster` (`sonner`, dark). Do **not** mount a second `LenisProvider` or add CSS `scroll-behavior: smooth`.

## Lenis smooth scroll

Single `LenisProvider` in `app/providers.tsx`. Import `useLenis` from `@/components/animations/LenisProvider`. Keep wheel feel continuous; do not set both `lerp` and `duration` on the instance (steppy on Windows). `syncTouch: false` so phones keep native touch scroll.

## Images

Use `getSquareThumbnail()` / `getOptimizedImageUrl()` from `src/lib/imageUtils.ts`. Use `next/image` where practical; respect `sizes` on `fill` images and `priority` on above-the-fold LCP candidates.

## Recharts

Chart visuals use Recharts inside client leaves (`ChartShellClient`, `HomeChartsView`). Heavy chart modules are lazy-loaded; the parent RSC fetches data and passes it down.

## Accessibility (WCAG 2.1 AA — mandatory)

- Skip link → `#main-content` in `app/layout.tsx`
- Semantic landmarks; icons-only controls carry `aria-label`
- `focus-visible:ring-2` — never bare `focus:outline-none`
- Touch targets: `min-w-[44px] min-h-[44px]` on icon-only controls (public UI)
- `useReducedMotion()` in animated components
- Toggle buttons: `aria-pressed`; external links: `rel="noopener noreferrer"`
- Contrast: 4.5:1 normal text

## i18n / legal

Public UI copy lives in `src/i18n/messages.ts` (de default, en). `t(key, vars)` from `useLanguage()` (client) or `getTranslator()` (RSC). Language cookie `lang`. No hardcoded UI strings; no `isEn ? '…' : '…'`. Voice: warm, human, scene-authentic, easy to understand. Names: Fan charts, Club charts, Overall charts, Streaming. Explain how voting and ranking work in plain language — no quadratic/Sybil/formula jargon, no clipped club-announcer bark. Legal pages: `src/lib/legal-content.ts`; operator data from `NEXT_PUBLIC_LEGAL_*`.

## Class names & layout

- Always `cn()` from `@/lib/utils` — never template-literal class merging.
- Mobile-first; fluid widths; skeletons match loaded layout (zero CLS).
- Public pages use the `app/(main)` layout group with `MainLayoutClient`: one `#main-content`, `max-w-7xl px-4 py-8 md:px-8 pb-28`. Do not add a second `main` or extra page `px-4 py-8`. Admin uses `AdminPageShell`. Header/footer are hidden on `/admin` and `/login`.

## Visual effects

`PublicEffects` / `NavHidingWrapper` on public routes can layer a light grain/vignette. Do **not** enable CRT scanlines or chromatic hover on public chart rows. Keep effects from harming readability; respect reduced motion.
