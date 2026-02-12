# Media OS QA Protocol

This document outlines the methodical verification of the Street Politics Media Engine. Every layer must be validated to ensure system integrity, forensic defensibility, and operational trust.

## Institutional Guardrails (Automated QA)
**Status:** 🛡️ **Automated via CI**

The following layers are now protected by automated guardrails in [db-integrity.yml](file:///Users/nineel/Documents/street-politics-feed-main/.github/workflows/db-integrity.yml). Every Pull Request and Push to `master` triggers a full environment rebuild and state machine validation.

| Layer | Guardrail Type | Script / Workflow |
| :--- | :--- | :--- |
| Layer 3 | State Machine Enforcement | `tests/sql/state_machine_validation.sql` |
| Layer 4 | Role Guard Validation | `tests/sql/state_machine_validation.sql` |
| Layer 5 | Ledger Consistency | `tests/sql/state_machine_validation.sql` (L5-01) |
| Layer 1-7 | Migration Integrity | GitHub Actions (Apply all migrations) |

---

## Layer 1: Route & Access Matrix (Role Matrix Verification)
**Goal:** Ensure zero-trust access to protected routes and data.

| Role   | Public Pages | Booking   | Dashboard | Submission Queue | Admin Dashboard |
| ------ | ------------ | --------- | --------- | ---------------- | --------------- |
| Guest  | ✅            | ❌/Partial | ❌         | ❌                | ❌               |
| User   | ✅            | ✅         | ✅         | ❌                | ❌               |
| Editor | ✅            | ✅         | ✅         | ✅                | Partial         |
| Admin  | ✅            | ✅         | ✅         | ✅                | ✅               |

| Test ID | Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| L1-01 | Logged out → `/admin` | Redirect to login | [ ] |
| L1-02 | User → `/admin` | Redirect to home/Access Denied | [ ] |
| L1-03 | Editor → `/admin` | Review Queue only visible | [ ] |
| L1-04 | Admin → `/admin` | Full visibility | [ ] |

---

## Layer 2: Form & Mutation Integrity (The "Can it desync?" Test)
**Goal:** Prevent malformed data or duplicate submissions.

### Test Case A — User Stripe Path
1. Submit booking → Confirm row created as `unpaid`.
2. Complete Stripe checkout → Confirm webhook moves state to `paid`.
3. Confirm auto transition to `pending_review`.

### Test Case B — Capability Path
1. Editor uses capability → Confirm RPC consumes capability.
2. Confirm submission created as `paid`.
3. Confirm transition to `pending_review`.

| Test ID | Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| L2-01 | Submit Booking (Stripe) | Row `unpaid` -> `paid` -> `pending_review` | [ ] |
| L2-02 | Submit Booking (Capability) | Row `paid` -> `pending_review` | [ ] |
| L2-03 | Concurrent Submissions | Single row created, no race conditions | [ ] |
| L2-04 | Empty Links/Massive Text | Blocked by UI or handled by JSONB | [ ] |

---

## Layer 3: State Machine Enforcement (The "Can it be bypassed?" Test)
**Goal:** Enforce database-level transition logic and RBAC.

| Test ID | Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| L3-01 | `unpaid` -> `approved` (Editor) | **FAIL** (Unauthorized) | [x] |
| L3-02 | `unpaid` -> `paid` (Admin) | **PASS** (Authorized) | [x] |
| L3-03 | `paid` -> `pending_review` (Admin) | **PASS** (Authorized) | [x] |
| L3-04 | `pending_review` -> `approved` (Editor) | **PASS** (Authorized) | [x] |
| L3-05 | `approved` -> `scheduled` (Editor) | **FAIL** (Unauthorized) | [x] |
| L3-06 | `approved` -> `scheduled` (Admin) | **PASS** (Authorized) | [x] |
| L3-07 | `pending_review` -> `approved` (User) | **FAIL** (Unauthorized) | [x] |
| L3-08 | Skip State (`unpaid` -> `published`) | **FAIL** (Must follow flow) | [ ] |

---

## Layer 4: Role Guard Validation (The "Can it be broken?" Test)
**Goal:** Verify RBAC enforcement via RLS and RPC.

| Test ID | Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| L4-01 | Direct RPC Call (User) | Access Denied | [ ] |
| L4-02 | RLS Bypass Attempt | Blocked by Supabase Policies | [ ] |
| L4-03 | Editor Approve Self | Blocked if policy enforced | [ ] |

---

## Layer 5: Event & Ledger Logging (The "Can it drift?" Test)
**Goal:** Verify forensic audit trails.

| Test ID | Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| L5-01 | Inspect `submission_status_history` | Complete timeline (Who, When, From/To) | [ ] |
| L5-02 | Inspect `admin_actions` | Matches history transitions | [ ] |
| L5-03 | Metadata Integrity | Role context correctly captured | [ ] |

---

## Layer 6: Payment & Webhook Trust (The "Can it lie?" Test)
**Goal:** Ensure idempotent and secure payment processing.

| Test ID | Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| L6-01 | Duplicate Webhook Event | Handled via `upsert` on `stripe_payment_intent_id` | [x] |
| L6-02 | Sequential Status Transition | `unpaid` -> `paid` -> `pending_review` | [x] |
| L6-03 | Missing Metadata | Event skipped with warning | [x] |
| L6-04 | Manual Event Simulation | Correct state resolution | [ ] |

---

## Layer 7: Observability & Metrics Accuracy (The "Visibility Layer" Test)
**Goal:** Zero-drift between UI and SQL truth.

| Test ID | Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| L7-01 | Total Submissions | `SELECT COUNT(*) FROM submissions` matches Dashboard | [x] |
| L7-02 | Conversion Rate | SQL Calculation matches Dashboard | [x] |
| L7-03 | Avg Lag Time | SQL Calculation matches Dashboard | [x] |
| L7-04 | File Storage Linkage | File exists in bucket AND linked in row | [x] |

---

## Layer 8: Edge Case Resilience (Resilience under Misuse)
**Goal:** Stability under weird inputs or failures.

| Test ID | Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| L8-01 | Empty Description/Links | Validation failure | [x] |
| L8-02 | Session closed mid-checkout | State remains `unpaid` | [x] |
| L8-03 | Duplicate Artist Email | Correct linkage to profile | [x] |
