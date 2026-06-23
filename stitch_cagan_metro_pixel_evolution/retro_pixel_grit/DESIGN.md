---
name: Retro Pixel Grit
colors:
  surface: '#fbf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#54433a'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0f0'
  outline: '#877369'
  outline-variant: '#dac2b6'
  surface-tint: '#934b19'
  primary: '#6c2f00'
  on-primary: '#ffffff'
  primary-container: '#8b4513'
  on-primary-container: '#ffc29f'
  inverse-primary: '#ffb68c'
  secondary: '#36684d'
  on-secondary: '#ffffff'
  secondary-container: '#b5ecc9'
  on-secondary-container: '#3a6d51'
  tertiary: '#705d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c9a900'
  on-tertiary-container: '#4c3e00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbc9'
  primary-fixed-dim: '#ffb68c'
  on-primary-fixed: '#321200'
  on-primary-fixed-variant: '#753401'
  secondary-fixed: '#b8efcc'
  secondary-fixed-dim: '#9dd3b1'
  on-secondary-fixed: '#002111'
  on-secondary-fixed-variant: '#1c5036'
  tertiary-fixed: '#ffe16d'
  tertiary-fixed-dim: '#e9c400'
  on-tertiary-fixed: '#221b00'
  on-tertiary-fixed-variant: '#544600'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
typography:
  headline-lg:
    fontFamily: Space Mono
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -1px
  headline-md:
    fontFamily: Space Mono
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Space Mono
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Courier Prime
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
spacing:
  pixel-unit: 4px
  gutter: 16px
  margin-mobile: 24px
  margin-desktop: 48px
  container-max: 800px
---

## Brand & Style

This design system draws inspiration from the 8-bit era of handheld and home consoles, specifically leveraging a **Retro/Brutalism** hybrid. The brand personality is irreverent, high-energy, and unashamedly digital. By utilizing chunky pixel densities and a "thick-stroke" aesthetic, the interface evokes the nostalgia of the NES while maintaining the functional clarity of modern UI.

The style is defined by physical pixel architecture—every border, shadow, and icon is treated as a construction of blocks rather than smooth vectors. This creates a tactile, "clicky" atmosphere that rewards interaction through high-contrast state changes and exaggerated depth.

## Colors

The palette uses a high-contrast "Mint & Cocoa" foundation. 
- **Primary (#8B4513):** Used for structural elements, heavy borders, and thematic "brown" assets.
- **Background (#A0D6B4):** A soft mint that provides a restful canvas for the high-intensity foreground colors.
- **Text & UI Stroke (#2F2F2F):** A charcoal used for all pixel-outlines and readable text.
- **Accents:** Gold, Silver, and Bronze are reserved strictly for achievement-based elements and high-priority call-to-actions to maintain their perceived value.

## Typography

While the interface suggests an 8-bit look, readability remains paramount. We use **Space Mono** as the primary driver to simulate the fixed-width grid of retro games while ensuring cross-platform legibility. 

- **Headlines:** Must be set in all-caps for a "shouting" arcade effect.
- **Body:** Uses a generous line height to prevent the monospaced characters from feeling cramped.
- **Labels:** Small labels use **Courier Prime** to provide a subtle "typewriter" or "manual" aesthetic, fitting for data-heavy sections like leaderboards.

## Layout & Spacing

The design system operates on a **4px Pixel Grid**. All margins, paddings, and element dimensions must be multiples of 4 to ensure that the pixel art remains "on-grid" and avoids sub-pixel blurring.

- **Grid:** A 12-column fluid grid is used, but content is often contained within fixed-width floating panels to mimic game menus.
- **Breakpoints:** On mobile, the 12-column grid collapses to a single column with 24px side margins.
- **Rhythm:** Elements are spaced aggressively to allow the heavy "chunky" borders room to breathe without overlapping visually.

## Elevation & Depth

This system rejects soft shadows in favor of **Hard-Step Depth**. 
- **Depth Levels:** Depth is created by a 4px or 8px solid offset in a darker shade of the surface color (or the charcoal neutral).
- **Floating Panels:** Panels utilize a "double-border" technique: a 4px inner light highlight and an 8px outer dark shadow.
- **Layering:** Elements "higher" in the stack have a larger solid-offset shadow. There are no blurs; every shadow is a hard, opaque rectangle.

## Shapes

The design system is strictly **Sharp (0)**. True circles are prohibited. Any "rounded" appearance must be achieved through a "staircase" pixel effect (e.g., a 4x4 square removed from the corner of a panel). This reinforces the technical limitations of the retro inspiration.

## Components

### Buttons
Buttons are 3D-extruded. In their default state, they have a thick 4px bottom shadow. On `hover`, the shadow grows. On `active` (click), the button shifts down by 4px and the shadow disappears, simulating a physical press.

### Floating Panels
Containers for the character preview and leaderboard. These must have a "bezel" look—a Primary Color (#8B4513) frame with Charcoal (#2F2F2F) outlines.

### Progress Bars (Strength)
The track is a dark Charcoal. The fill is a vibrant Primary Brown. The fill must be segmented into "blocks" (pips) rather than a continuous smooth bar, representing 10% increments.

### Character Preview Area
A strictly square container with a "crosshair" or grid-paper background pattern in a slightly darker Mint than the background.

### Leaderboard
Rows alternate between the Background Mint and a slightly lighter tint. Medal icons (Gold, Silver, Bronze) are 16x16 pixel sprites placed to the left of the player name.

### Input Fields
Rectangular boxes with a 4px inset shadow to create a "sunken" feel, contrasting against the "extruded" buttons.