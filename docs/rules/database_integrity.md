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
