# Development TODOs — Mobile Logo & Responsive Behavior

Completed
- Mobile PNG renders at 56×56 with object-contain; desktop uses SVG at 96×96
- Mobile img has onError fallback to SVG to avoid missing logo
- Code refs: [Navbar.tsx](file:///Users/nineel/Documents/street-politics-feed-main/src/components/Navbar.tsx), [use-mobile.tsx](file:///Users/nineel/Documents/street-politics-feed-main/src/hooks/use-mobile.tsx)

Pending
- Trim mobile PNG to remove excess transparent margins; re-export final asset and update import
- Evaluate mobile logo container size (56×56 vs 64×64) and adopt final spec
- Compress mobile asset (PNG/WebP) for performance while preserving clarity; target < 120 kB
- Cross-device verification: iOS Safari, Android Chrome, desktop Chrome/Firefox; confirm no distortion at breakpoints
- Document asset policy in code comments: mobile uses PNG (object-contain), desktop uses SVG (object-contain)

Notes
- Breakpoints: mobile (<768px) shows PNG; desktop (≥768px) shows SVG
- Primary locations: Navbar logo block; mobile detection via useIsMobile; Tailwind breakpoints in tailwind.config.ts

Validation
- Run `npm run dev`; verify mobile (< md) PNG, desktop (≥ md) SVG, and fallback behavior on mobile
