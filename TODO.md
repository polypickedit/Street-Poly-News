# Development TODOs — Mobile Logo & Responsive Behavior

## Logo Completed

- Mobile PNG renders at 56×56 with object-contain; desktop uses SVG at 96×96
- Mobile img has onError fallback to SVG to avoid missing logo
- Code refs: [Navbar.tsx](file:///Users/nineel/Documents/street-politics-feed-main/src/components/Navbar.tsx), [use-mobile.tsx](file:///Users/nineel/Documents/street-politics-feed-main/src/hooks/use-mobile.tsx)

## Logo Pending

- Trim mobile PNG to remove excess transparent margins; re-export final asset and update import
- Evaluate mobile logo container size (56×56 vs 64×64) and adopt final spec
- Compress mobile asset (PNG/WebP) for performance while preserving clarity; target < 120 kB
- Cross-device verification: iOS Safari, Android Chrome, desktop Chrome/Firefox; confirm no distortion at breakpoints
- Document asset policy in code comments: mobile uses PNG (object-contain), desktop uses SVG (object-contain)

## Ad Placement & Rendering

### Ad Completed

- Implemented "New Music Mondays" ad in sidebar slot
- Switched image rendering to `object-contain` to prevent cropping (sides/bottom)
- Integrated "Don Trip - Trauma Bond" ad as alternating middle ad in the post feed
- Implemented ad rotation logic (Iron Mike every 7 posts, Don Trip every 14 posts)
- Added debug logs to track ad rendering and type selection in the feed

### Ad Pending

- Verify ad visibility and aspect ratio fit within 180x600 container
- Adjust container background if letterboxing occurs
- Cross-device verification of ad rendering

## Sidebar Ad Specifications

- **Dimensions**: 260px (width) x 600px (height)
- **Format**: PNG, JPG, or WebP (solid opacity preferred)
- **Safe Zone**: Keep text/logos at least 24px from edges to avoid cropping from zoom/object-cover
- **Behavior**: Images are rendered with `object-cover` and slight zoom (`scale-110` or `scale-105`) to remove white borders.
- **Reference**: [AdSidebar.tsx](file:///Users/nineel/Documents/street-politics-feed-main/src/components/AdSidebar.tsx)

## Notes

- Breakpoints: mobile (<768px) shows PNG; desktop (≥768px) shows SVG
- Primary locations: Navbar logo block; mobile detection via useIsMobile; Tailwind breakpoints in tailwind.config.ts
- Ad location: [AdSidebar.tsx](file:///Users/nineel/Documents/street-politics-feed-main/src/components/AdSidebar.tsx)

## Validation

- Run `npm run dev`; verify mobile (< md) PNG, desktop (≥ md) SVG, and fallback behavior on mobile
- Check sidebar ad for full visibility
