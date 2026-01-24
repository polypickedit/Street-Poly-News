Based on your description ("logo becomes distorted or looks like there's multiple renderings overlapping" on "phone in portrait mode specifically"), I've analyzed the codebase and identified the likely cause.

**The Problem:**
1.  **Portrait vs. Landscape:** Phones in portrait mode fall under the mobile breakpoint (`md:hidden`), displaying the "Mobile Logo" implementation. In landscape, they often hit the desktop breakpoint (`hidden md:flex`), showing the "Desktop Logo". Since the issue is specific to portrait, the bug lies in the Mobile Logo code.
2.  **Rendering Artifact:** The mobile logo container uses `filter drop-shadow-lg`. The desktop logo uses `shadow-lg` (box-shadow).
    *   `drop-shadow` is a CSS filter that is computationally expensive and known to cause rendering artifacts (ghosting, blurring, or clipping issues) on mobile browsers (especially iOS Safari) when combined with `overflow-hidden`, `border-radius`, and parent transforms (like the `hover:scale` on the link).
    *   The `Link` component has a `hover:scale-[1.02]` effect. On touch devices, the "hover" state often sticks after a tap, triggering the transform and exacerbating the filter glitch.

**The Solution:**
Switch the mobile logo to use standard `box-shadow` (`shadow-lg`) instead of the filter `drop-shadow`. This matches the desktop implementation, is more performant, and avoids the rendering bugs associated with filters on transformed elements.

**Proposed Change in `src/components/Navbar.tsx`:**

```typescript
// Line 51
// Before:
<div className="md:hidden bg-white rounded-full flex items-center justify-center w-16 h-16 shrink-0 filter drop-shadow-lg border-2 border-white overflow-hidden">

// After:
<div className="md:hidden bg-white rounded-full flex items-center justify-center w-16 h-16 shrink-0 shadow-lg border-2 border-white overflow-hidden">
```
*Note: I will remove `filter` and `drop-shadow-lg` and replace them with `shadow-lg`.*
