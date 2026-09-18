# Multi-Tenant Schema Extensibility & Virtual Entities

> **Core Mandate:** Enforce dynamic schema extensibility via hybrid relational columns and validated JSON Schema (Draft 2020-12), prohibiting sparse nullable columns and branch-specific migrations in shared databases.

---

## 1. Hybrid Core + JSON/Document Extensibility

Store universal relational attributes in standard typed columns. Store tenant-specific custom fields in a semi-structured `custom_attributes` column governed by tenant-scoped JSON Schemas:

```sql
CREATE TABLE customers (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  custom_attributes TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tenant_schema_definitions (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  entity_name VARCHAR(50) NOT NULL,
  json_schema TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  UNIQUE(tenant_id, entity_name)
);
```

### Runtime Validation Contract (JSON Schema Draft 2020-12)
Validate all inbound custom attribute payloads at runtime against the tenant's compiled JSON Schema before persisting mutations:

```
┌────────────────────────────────────────────────────────┐
│ Dynamic Schema Validator Contract (Agnostic)           │
├────────────────────────────────────────────────────────┤
│ validateCustomAttributes(schemaDef, data):             │
│   compiledValidator = compileJsonSchema(schemaDef)     │
│   result = compiledValidator.validate(data)           │
│   if !result.isValid:                                  │
│     return Failure(ValidationError(result.errors))     │
│   return Success(data)                                 │
└────────────────────────────────────────────────────────┘
```
Supported natively by open-source engines in every major language (`valico` in Rust, `gojsonschema` in Go, `jsonschema` in Python, `networknt` in Java, `ajv` in Node).

---

## 2. Meta-Schema Catalog for Virtual Custom Entities

When tenants define completely custom entities/tables dynamically without deploying code:

```sql
CREATE TABLE tenant_entities (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  name VARCHAR(64) NOT NULL,
  display_name VARCHAR(128) NOT NULL,
  schema_definition TEXT NOT NULL,
  UNIQUE(tenant_id, name)
);

CREATE TABLE tenant_records (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  entity_id VARCHAR(64) NOT NULL REFERENCES tenant_entities(id) ON DELETE CASCADE,
  data TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Indexing Strategies for Dynamic Custom Attributes

1. **Virtual / Generated Columns**: For high-throughput queried fields inside dynamic attributes, project them into virtual/generated columns and attach standard B-tree indexes:
   ```sql
   ALTER TABLE customers ADD COLUMN vat_number VARCHAR(64) 
     GENERATED ALWAYS AS (custom_attributes->>'vat_number') STORED;
   CREATE INDEX idx_customers_vat ON customers (tenant_id, vat_number);
   ```
2. **Functional / Expression Indexes**: Index specific nested attributes directly on engines that support expression indexes:
   ```sql
   CREATE INDEX idx_customers_po ON customers (tenant_id, ((custom_attributes->>'po_number')::text));
   ```
3. **Inverted Indexes**: Use generalized inverted indexing (e.g. GIN in PostgreSQL) for arbitrary key-value path searches.
