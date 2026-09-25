# Database Integrity, Constraints & Defensive Design

> **Core Mandate:** Enforce data integrity via explicit foreign key delete semantics, domain CHECK constraints, interval exclusion constraints, partial unique indexes for soft deletes, and Universal Total Audit accountability.

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

## 5. Mandatory Universal Audit Columns

Every stateful entity across all relational schemas, ORMs, and persistence layers must maintain strict audit accountability.

### The Canonical 6 Total Audit Fields:
All mutable database tables, domain entities, and models must define the total audit suite:
1. **`createdAt` / `created_at`** (`TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP`): Immutable timestamp when the record was initially created.
2. **`createdBy` / `created_by`** (`VARCHAR/TEXT NOT NULL DEFAULT 'SYSTEM'`): The user ID (`User.id`) of the authenticated actor who created the record, or `'SYSTEM'` for automated background tasks, seeds, or system bootstrap.
3. **`updatedAt` / `updated_at`** (`TIMESTAMP WITH TIME ZONE NOT NULL`): Timestamp automatically updated on every record mutation.
4. **`updatedBy` / `updated_by`** (`VARCHAR/TEXT NOT NULL DEFAULT 'SYSTEM'`): The user ID (`User.id`) of the authenticated actor who performed the most recent mutation, or `'SYSTEM'` for automated workflows.
5. **`deletedAt` / `deleted_at`** (`TIMESTAMP WITH TIME ZONE NULL`): Timestamp when the record was soft-deleted/archived. Null for active records.
6. **`deletedBy` / `deleted_by`** (`VARCHAR/TEXT NULL`): The user ID (`User.id`) of the authenticated actor who performed or authorized deletion, or `'SYSTEM'`.

All queries for active records MUST filter `WHERE deletedAt IS NULL` (or ORM equivalent). Paired with partial unique indexes `WHERE deleted_at IS NULL` where uniqueness constraints apply.

### Append-Only Immutable Ledgers / Log Streams:
Pure financial ledgers (e.g. `PaymentLedgerEntry`, `JournalEntry`) and event outbox streams are strictly immutable. They require:
- **`createdAt` / `created_at`** (`NOT NULL DEFAULT CURRENT_TIMESTAMP`)
- **`createdBy` / `created_by`** (`NOT NULL DEFAULT 'SYSTEM'`)
- *Mutations and soft-deletes are prohibited*: `updatedAt`, `updatedBy`, `deletedAt`, and `deletedBy` are omitted because records are append-only. Financial adjustments must be recorded as offsetting ledger entries.

---

## 6. Semi-Structured Evolution & Cryptographic Audit Trails

- **Non-Destructive Schema Evolution via JSON**: For contractual covenants, dynamic conditions, or variable metadata subject to rapid domain iteration, employ semi-structured JSON fields (`termsJson`, `metadataJson`) validated against JSON Schema rather than premature table migrations.
- **Cryptographic Electronic Signatures & Execution Auditing**: Legal agreements and execution records require defensible evidence beyond a boolean `isSigned` flag. All executed agreements must capture:
  1. Typed signer legal name and designated role.
  2. ISO 8601 UTC execution timestamp.
  3. Authenticated actor ID (`userId`).
  4. Client network IP address and User-Agent string.
  5. Deterministic cryptographic checksum / hash of the executed terms.
