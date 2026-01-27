---
name: "ad-policy"
description: "Enforces 240x600px sidebar ad standards. Invoke when creating, modifying, or reviewing sidebar ads."
---

# Ad Policy Enforcement

This skill ensures all sidebar ads adhere to the strict 240x600px standard.

## Core Rules

1. **Sidebar Columns**: Both Left and Right sidebars must be **exactly 240px wide** on desktop.
2. **Ad Slot**: 
   - Width: 100% (of 240px)
   - Height: 600px
   - Overflow: hidden
   - Border-radius: 6px
3. **Image Behavior**:
   - Width: 100%
   - Height: 100%
   - Object-fit: cover
   - Object-position: center
   - **NO** stretching, guessing, or per-ad layout hacks.

## Communication Standard

When discussing ads with suppliers or users, use this exact phrasing:

> “All sidebar ads must be designed for **240×600**. Keep text at least 24px from edges.”

## Code Implementation Reference

```tsx
<aside className="w-[240px]">
  <div className="w-full h-[600px] overflow-hidden rounded-md">
    <img 
      src={adImage} 
      className="w-full h-full object-cover object-center" 
    />
  </div>
</aside>
```
