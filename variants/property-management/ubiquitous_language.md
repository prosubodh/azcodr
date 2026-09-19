# Property Management Ubiquitous Language Glossary

> **Source of Truth:** Authoritative domain terminology dictionary for the Property Management variant profile, based on verified production domain models.

---

## Bounded Context: Property Management & Leasing

| Canonical Term | Business Definition | Bounded Context | Forbidden Synonyms | Code & Database Identifiers |
|---|---|---|---|---|
| **Portfolio** | A collection of properties and units owned or managed by an organization/landlord. Acts as the multi-tenant isolation boundary. | Infrastructure & Core Domain | Account, Workspace, Company, Org, TenantGroup | `Portfolio`, `portfolioId`, `portfolios` table |
| **Property** | A physical real estate asset consisting of one or more rentable units. | Property Management | Building, RealEstate, Complex | `Property`, `propertyId`, `properties` table |
| **Unit** | An individual rentable space within a property (e.g. apartment, suite, room). | Property Management | Room, Space, Flat, Apartment | `Unit`, `unitId`, `units` table |
| **Renter** | An individual or party leasing and occupying a unit. | Leasing & Tenancy | Tenant (in occupant context), Resident, Customer, Lessee | `Renter`, `renterUserId`, `renterId` |
| **Landlord** | The owner or managing agent authorized to issue leases, invite members, and collect rent. | Operations & Auth | Owner, Lessor, Host | `Role.LANDLORD`, `Landlord` |
| **Lease** | The legally binding contractual agreement between a Landlord and a Renter for a specific Unit. | Leasing | Contract, RentalAgreement, TenancyAgreement | `Lease`, `leaseId`, `leases` table |
| **Rental Application** | A formal prospective application submitted by an applicant seeking to rent a Unit. | Vetting & Onboarding | Candidate, LeadSubmission, Inquiry | `RentalApplication`, `applicationId`, `rental_applications` table |
| **Payment Ledger Entry** | An immutable financial audit record detailing a rent, deposit, or fee transaction. | Finance & Accounting | TransactionRow, MoneyLog, BillEntry | `PaymentLedgerEntry`, `paymentId`, `payment_ledger` table |
| **Tenant Workspace** | The architectural multi-tenancy partition key (derived from `Portfolio`). | Multi-Tenancy Architecture | Tenant (when ambiguous with Renter) | `tenantId`, `x-tenant-id` header |

---

## Linguistic Conflict Resolutions (ADR Reference)
- **Renter vs Tenant**: In this domain, "Tenant" is strictly reserved for the architectural multi-tenancy boundary (`tenantId` / `portfolioId`). The human occupant residing in and leasing a property is universally designated as "Renter" (`renterUserId`). Never use "tenant" to describe an occupant.
