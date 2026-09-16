# Multi-Tenant Schema Extensibility & Virtual Entities

> **Core Mandate:** Enforce dynamic schema extensibility via hybrid relational columns and validated PostgreSQL JSONB, prohibiting sparse nullable columns and branch-specific migrations in shared databases.

---

## 1. Hybrid Core + JSONB Extensibility with JSON Schema

Store universal relational attributes in standard columns. Store tenant-specific custom fields in a `custom_attributes JSONB` column governed by tenant-scoped JSON Schemas:

```sql
CREATE TABLE "Customer" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  custom_attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "TenantSchemaDefinition" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  entity_name VARCHAR(50) NOT NULL,
  json_schema JSONB NOT NULL,
  version INT NOT NULL DEFAULT 1,
  UNIQUE(tenant_id, entity_name)
);
```

### Runtime Validation via `ajv`
```typescript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, removeAdditional: false });
addFormats(ajv);

export class DynamicSchemaValidator {
  static validateCustomAttributes(schema: object, data: Record<string, unknown>): { valid: boolean; errors?: string[] } {
    const validate = ajv.compile(schema);
    const valid = validate(data);
    if (!valid) {
      return {
        valid: false,
        errors: validate.errors?.map(err => `${err.instancePath} ${err.message}`) ?? ['Validation failed']
      };
    }
    return { valid: true };
  }
}
```

---

## 2. Meta-Schema Catalog for Virtual Custom Entities

When tenants define completely custom entities/tables (e.g. `EquipmentAsset`):

```sql
CREATE TABLE "TenantEntity" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  name VARCHAR(64) NOT NULL,
  display_name VARCHAR(128) NOT NULL,
  schema_definition JSONB NOT NULL,
  UNIQUE(tenant_id, name)
);

CREATE TABLE "TenantRecord" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES "TenantEntity"(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3. PostgreSQL JSONB Indexing

1. **GIN Index for Arbitrary JSON Paths:**
   ```sql
   CREATE INDEX idx_customer_custom_attrs ON "Customer" USING GIN (custom_attributes jsonb_path_ops);
   ```
2. **Expression B-Tree Index for High-Traffic Tenant Fields:**
   ```sql
   CREATE INDEX idx_customer_vat_number ON "Customer" (((custom_attributes->>'vat_number')::text))
     WHERE custom_attributes ? 'vat_number';
   ```
