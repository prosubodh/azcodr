# Database Integrity, Constraints & Defensive Design

> **Core Mandate:** Enforce data integrity via explicit foreign key delete semantics, domain CHECK constraints, interval exclusion constraints, and partial unique indexes for soft deletes.

---

## 1. Foreign Key `ON DELETE` Semantics

- **Default to `RESTRICT`**: For critical domain entities, tenant records, and financial ledgers to prevent accidental cascade destruction.
- **Use `CASCADE` Strictly**: For direct, owned child records (e.g. `OrderItem` owned by `Order`).
- **Use `SET NULL`**: When foreign relations are optional.

---

## 2. Domain CHECK Constraints & Interval Exclusion

- **Domain Invariants**:
  ```sql
  ALTER TABLE "Invoice" ADD CONSTRAINT chk_invoice_positive_amount CHECK (amount >= 0);
  ALTER TABLE "Subscription" ADD CONSTRAINT chk_sub_dates CHECK (end_date >= start_date);
  ```
- **Prevent Overlapping Reservations**:
  ```sql
  CREATE EXTENSION IF NOT EXISTS btree_gist;
  ALTER TABLE "RoomReservation" ADD CONSTRAINT no_overlapping_reservations
    EXCLUDE USING gist (room_id WITH =, reservation_period WITH &&);
  ```

---

## 3. Soft Delete Unique Constraint Trap

A standard `UNIQUE(email)` constraint fails when an active user signs up with the email of a soft-deleted record.
- **Mandatory Standard**: Always use partial unique indexes for soft-deleted tables:
  ```sql
  CREATE UNIQUE INDEX idx_users_email_active ON "User"(email) WHERE deleted_at IS NULL;
  ```

---

## 4. Relational Foreign Key Invariants & UI Mapping

- **Mandatory Existence Validation:** The application and domain layers must defensively assert foreign key target existence prior to child entity persistence. If a referenced parent entity does not exist, return an RFC 7807 problem detail (`400 Bad Request` or `404 Not Found`).
- **No Raw Identifier Text Inputs:** User interfaces must never expose raw string or UUID input fields for foreign key references. Associations must be selected via accessible dropdown selectors (`shadcn/ui` `<Select>`) displaying human-readable contextual metadata (names, labels, numbers, pricing).
- **Complete Lifecycle CRUD:** All relational entities must provide complete CRUD functionality (Create, Read/Detail, Update/Transition, Delete/Archive) before being considered feature-complete.

---

## 5. Invariants, DO's & DONT's

### DO's:
- **DO:** Default foreign keys to `RESTRICT` for root aggregates and financial ledgers to prevent accidental cascading data loss.
- **DO:** Enforce foreign key validation in use cases before persistence, returning RFC 7807 problem details if referenced records do not exist.
- **DO:** Render foreign key associations using relational selectors (`shadcn/ui` `<Select>`) showing human-readable business metadata (names, labels, numbers, emails).
- **DO:** Ensure every entity/feature implements full lifecycle CRUD (Create, Read/Detail, Update/Status Transition, Delete/Archive) before considering it complete.
- **DO:** Use partial unique indexes (`WHERE deleted_at IS NULL`) on tables utilizing soft deletes.

### DONT's:
- **DONT:** Never expose raw string text inputs for foreign key identifiers in the user interface.
- **DONT:** Never consider a feature complete if it only implements creation or listing without update, transition, or deletion capabilities.
- **DONT:** Never allow cascading deletes on master entities with dependent transactional history.
