# PANTRYOS — ROLES, PERMISSIONS & BRANCH RBAC SPECIFICATION
**Version:** 1.0 | **Date:** 17 November 2026 | **Status:** Phase 0 Approved

---

## 1. System Personas & Role Matrix
Every user in PantryOS belongs to an Organization, has access to one or more Branches, and holds one or more Roles.

| Role Code | Role Name | Primary Responsibilities | Target Device | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| `SUPER_ADMIN` | Platform Admin | Organization setup, billing, global settings, integration keys | Desktop | Global / Multi-branch |
| `BRANCH_MANAGER`| Store / Pantry Manager| Live orders, stock alerts, staff shifts, overrides, reports | Desktop / Phone | Branch Scoped |
| `CHEF` | Head / Line Cook | Batch production, cooking tasks, stove timers, safety checks | Android Tablet (KDS) | Branch Kitchen |
| `KITCHEN_ASSISTANT`| Prep & Helper | Ingredient prep, chopping, vegetable cleaning, dishwashing | Tablet / Phone | Branch Kitchen |
| `PACKER` | Packing Operator | Parcel assembly, packaging stock checklist, handoff shelves | Tablet / Phone | Branch Pass |
| `CASHIER` | Cashier / Front Desk | Order punching, payment receipt, cash shift reconciliation | Desktop / Tablet | Branch Counter |
| `WAITER` | Floor Captain | Table status, serving food, requesting bills | Mobile Phone | Branch Dining |
| `CUSTOMER` | Diner | Browse photo menu, self-order via table QR, track status | Mobile Phone (PWA) | Table Session Only |

---

## 2. Granular Permissions (Enforced in Fastify Backend)
* `inventory:read`, `inventory:receive`, `inventory:adjust`, `inventory:waste`
* `recipes:read`, `recipes:create`, `recipes:approve` (Chef / Manager only)
* `batches:plan`, `batches:cook`, `batches:quality_signoff` (Chef only)
* `equipment:lock`, `equipment:release`, `equipment:maintenance`
* `orders:create`, `orders:accept`, `orders:cancel`, `orders:override` (Manager override logs reason)
* `payments:charge`, `payments:refund`, `shifts:reconcile` (Cashier / Manager)
* `reports:view_sales`, `reports:view_variance`, `reports:export_csv`
* `integrations:manage_ondc`, `integrations:test_mock`

Every privileged override (e.g. canceling an in-flight order, applying a custom discount, overriding an expired batch) requires the actor's user ID, timestamp, and a mandatory audit reason.
