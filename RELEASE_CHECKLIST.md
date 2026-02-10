## 🔐 ENFORCED RELEASE CHECKLIST (CONTROL ROOM STANDARD)

This checklist defines declarative release gates. Every item is enforced by CI and must pass before any merge/deploy.

### 1. Type Authority Gate (MANDATORY)

**Rule:** No admin, slot, or placement logic may ship with `any`.

**CI checks:**
- `tsc --noEmit`
- ESLint rule: `@typescript-eslint/no-explicit-any` set to `error`

**Hard requirements:**
- All Supabase queries must use the generated `Database` types.
- `Slot.metadata` must conform to a strict interface (no `Record<string, any>`).
- Admin mode state must be a discriminated union:
  ```ts
  type AdminMode = "tour" | "conductor" | "read-only";
  ```

**Fail if:**
- `Record<string, any>` appears in admin/slot files.
- `as any` is used outside of test mocks.

### 2. Admin Authority Gate (MANDATORY)

**Rule:** Admin overrides always beat onboarding.

**Tests required:**
- Switching from Tour → Conductor clears any tour state.
- Conductor Mode bypasses onboarding guards.
- Capability checks evaluate before any tour logic.

**CI checks:**
- `vitest run src/**/admin*.test.ts`
- Snapshot coverage of admin mode transitions.

**Fail if:**
- Conductor mode cannot be entered when `canConduct === true`.
- Tour state persists after admin override.

### 3. Slot Resolution Gate (MANDATORY)

**Rule:** Slots must resolve deterministically.

**Tests required:**
- Priority ordering
- Device filtering
- Graceful empty state handling
- Error fallback behavior

**CI checks:**
- `vitest run src/**/slot*.test.ts`

**Fail if:**
- Slot rendering relies on implicit ordering or missing metadata validation.

### 4. TODO / FIXME Gate (MANDATORY)

**Rule:** No TODOs in runtime paths.

**CI checks:**
```bash
grep -R "TODO:" src/components src/hooks src/pages && exit 1
```

**Allowed locations:** `/tests`, `/docs`

**Fail if:** Any TODO is present in admin, slot, or routing code.

### 5. Documentation Gate (MANDATORY)

**Required docs:**
- `docs/slots.md`
- `docs/admin-control-room.md`

Each document must cover:
- Source-of-truth tables
- Authority rules and guardrails
- Mode transition rules
- Supabase policy interactions

**CI checks:**
- File existence
- Minimum heading structure

**Fail if:** Docs are missing or outdated relative to the current schema/behavior.

### 6. CI Enforcement (NON-OPTIONAL)

**GitHub Actions must run on every PR:**
- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:integration`

Deployment is blocked unless all checks pass. No overrides.

## ⚙️ NEXT SHARP MOVE

*Optional but powerful:* Turn these gates into a CI status badge and a required PR template checklist so the system teaches contributors how to behave without extra reminders.
