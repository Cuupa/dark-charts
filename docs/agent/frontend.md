# Frontend, UI & Accessibility

Stack: Next.js 16 App Router, React 19, Tailwind v4 (PostCSS), Framer Motion, Lenis, Recharts, Phosphor/Lucide icons, Radix primitives.

## CI colors (exact hex)

| Token | Hex | Use |
|-------|-----|-----|
| background | `oklch(0.02 0 0)` / `rgb(16,16,16)` | Page background |
| foreground | `#ffffff` | Primary text |
| card | `#292929` | Cards, modals, surfaces |
| primary / accent | `#493687` | CTAs, active nav, focus, glow |
| secondary | `#7e1e37` | Secondary actions, promo |
| border | `#383838` | Borders, inputs |

Defined in `app/globals.css` `:root`. `tailwind.config.js` is IDE-only for token names; runtime tokens live in CSS.

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

Public UI copy lives in `src/i18n/messages.ts` (de default, en). `t(key, vars)` from `useLanguage()` (client) or `getTranslator()` (RSC). Language cookie `lang`. No hardcoded UI strings; no `isEn ? '…' : '…'`. Club-announcer voice: short, imperative, no formulas on the public surface. Legal pages: `src/lib/legal-content.ts`; operator data from `NEXT_PUBLIC_LEGAL_*`.

## Class names & layout

- Always `cn()` from `@/lib/utils` — never template-literal class merging.
- Mobile-first; fluid widths; skeletons match loaded layout (zero CLS).
- Public pages use the `app/(main)` layout group with `MainLayoutClient`; admin uses `AdminPageShell`.

## Visual effects

`PublicEffects` / `NavHidingWrapper` on public routes can layer atmospheric effects. Keep them from harming readability; respect reduced motion.
