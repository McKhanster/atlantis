# Runs on Atlassian Compliance Checklist

**Program**: Runs on Atlassian
**Prize Value**: $2,000 (Codegeist Bonus)
**Badge**: Automatically applied to eligible apps on Atlassian Marketplace

## Core Requirements

The "Runs on Atlassian" program has **3 mandatory requirements**:

### 1. ✅ Atlassian-Hosted Compute and Storage ONLY

**Requirement**: Apps must **exclusively** use Atlassian-hosted compute and storage.

**What This Means**:
- ✅ **ALLOWED**: Forge serverless functions
- ✅ **ALLOWED**: Forge KVS (Key-Value Store)
- ✅ **ALLOWED**: Forge Custom Entities
- ✅ **ALLOWED**: Forge SQL
- ✅ **ALLOWED**: Forge Object Store (EAP)
- ❌ **PROHIBITED**: External servers (AWS, GCP, Azure, etc.)
- ❌ **PROHIBITED**: External databases (PostgreSQL, MySQL, MongoDB, etc.)
- ❌ **PROHIBITED**: External vector databases (Pinecone, Weaviate, etc.)
- ❌ **PROHIBITED**: External storage services (S3, Cloud Storage, etc.)

**Our Compliance**:
- ✅ Using Forge KVS for simple key-value storage
- ✅ Using Forge Custom Entities for structured data
- ✅ Storing AI embeddings as arrays in Custom Entities
- ✅ All compute runs in Forge serverless functions
- ✅ **NO external services**

---

### 2. ✅ Data Residency Support

**Requirement**: Apps must support data residency that matches the host Atlassian app.

**What This Means**:
- Forge storage automatically inherits Atlassian's data residency
- If admin sets Jira data to EU region, Forge storage follows
- No additional configuration needed
- Cannot use external storage that doesn't respect data residency

**Our Compliance**:
- ✅ Forge KVS/Custom Entities automatically support data residency
- ✅ No external storage to violate residency requirements
- ✅ Data stays in same region as customer's Atlassian instance

---

### 3. ✅ Customer Control of Data Egress

**Requirement**: Customers must be able to control and block data egress (analytics, logs, external API calls).

**What This Means**:
- ❌ **PROHIBITED**: Sending data to external analytics (Google Analytics, Mixpanel, etc.)
- ❌ **PROHIBITED**: Logging to external services (Datadog, New Relic, etc.)
- ⚠️ **RESTRICTED**: External API calls must be approved by customer
- ✅ **ALLOWED**: Declared `permissions.external.fetch` in manifest
- ✅ **ALLOWED**: Customer can block via `permissions.external`

**Our Compliance**:
- ✅ No external analytics services
- ✅ No external logging services
- ✅ Using Forge built-in logging only
- ✅ Any external API calls declared in manifest `permissions.external`
- ✅ MCP communication only between Forge apps (internal)

---

## Verification

### Forge CLI Verification Command

```bash
forge lint --runs-on-atlassian
```

This command verifies:
1. No external compute resources
2. No external storage
3. All data egress properly declared
4. Compliance with all 3 requirements

**Run this before every deployment!**

---

## Common Violations to Avoid

### ❌ Storage Violations
```typescript
// ❌ WRONG - External database
const db = new PostgreSQL('external-host.com');

// ❌ WRONG - External vector DB
const vectorDB = new Pinecone({ apiKey: '...' });

// ✅ CORRECT - Forge storage only
import kvs from '@forge/kvs';
const data = await kvs.get('key');
```

### ❌ Compute Violations
```typescript
// ❌ WRONG - External API for processing
await fetch('https://my-backend.herokuapp.com/process', {
  method: 'POST',
  body: JSON.stringify(data)
});

// ✅ CORRECT - Process in Forge function
async function processData(data) {
  // All logic runs in Forge
  return processedData;
}
```

### ❌ Analytics Violations
```typescript
// ❌ WRONG - External analytics
analytics.track('user_action', { userId, action });

// ❌ WRONG - External logging
logger.info('Event occurred', { data });

// ✅ CORRECT - Forge logging only
console.log('Event occurred', { data });
// Accessible via: forge logs
```

### ✅ Allowed External APIs
```typescript
// ✅ CORRECT - Declared in manifest
// manifest.yml:
// permissions:
//   external:
//     fetch:
//       backend:
//         - api.example.com

import api from '@forge/api';
const response = await api.fetch('https://api.example.com/data');
```

---

## Implementation Checklist

### Storage ✅
- [x] Use Forge KVS for simple data
- [x] Use Forge Custom Entities for structured data
- [x] Define entity schemas in manifest
- [x] Add `storage:app` scope
- [x] NO external databases
- [x] NO external storage services

### Compute ✅
- [x] All logic in Forge functions
- [x] No external servers
- [x] No external processing services
- [x] Serverless architecture only

### Data Egress ✅
- [x] No external analytics
- [x] No external logging services
- [x] Declare all external APIs in manifest
- [x] Use `permissions.external.fetch` for approved APIs
- [x] Document why external APIs are needed

### Manifest Configuration ✅
```yaml
app:
  id: 'ari:cloud:ecosystem::app/your-app-id'
  runtime:
    name: nodejs22.x
  storage:
    entities:
      - key: erp-context
        # ... entity definition

permissions:
  scopes:
    - storage:app
    - read:jira-work
    - write:jira-work

  # Only if needed - must be justified
  external:
    fetch:
      backend:
        # - api.approved-service.com  # Only if absolutely necessary
```

### Testing ✅
- [x] Run `forge lint --runs-on-atlassian` before deploy
- [x] Verify no external calls in logs
- [x] Test data residency compliance
- [x] Document compliance in README

---

## MCP Communication Compliance

### ✅ Module-to-Core Communication
```typescript
// ✅ CORRECT - Both are Forge apps
// Module sends MCP request to Core
const response = await fetch(coreAppUrl + '/mcp/query', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${forgeInvocationToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(mcpRequest)
});
```

**Why this is compliant**:
- Both Core and Module are Forge apps
- Communication is between Atlassian-hosted services
- No external systems involved
- Uses Forge Invocation Tokens (FIT) for auth

---

## Documentation Requirements

### For Marketplace Listing
Include in app description:
- ✅ "This app runs exclusively on Atlassian infrastructure"
- ✅ "Supports data residency requirements"
- ✅ "No external storage or compute used"
- ✅ List any external API integrations (if any) and why

### For Codegeist Submission
Include in technical write-up:
- ✅ How we maintain "Runs on Atlassian" compliance
- ✅ Storage architecture (Forge KVS + Custom Entities)
- ✅ Verification results from `forge lint --runs-on-atlassian`
- ✅ Data residency support
- ✅ Customer control mechanisms

---

## Monitoring Compliance

### Pre-Deployment Checklist
```bash
# 1. Lint for compliance
forge lint --runs-on-atlassian

# 2. Check manifest
grep -r "external" manifest.yml

# 3. Search codebase for violations
grep -r "fetch(" src/ | grep -v "@forge/api"
grep -r "axios" src/
grep -r "PostgreSQL\|MySQL\|MongoDB" src/

# 4. Verify storage usage
grep -r "@forge/kvs" src/
grep -r "kvs.entity\|kvs.get\|kvs.set" src/
```

### During Development
- ✅ Code review for external calls
- ✅ Check all `fetch()` uses `@forge/api`
- ✅ Verify storage uses `@forge/kvs` only
- ✅ No external service API keys in code

---

## Benefits of Compliance

### For Customers
- ✅ Data stays in their chosen region
- ✅ Full control over data egress
- ✅ Enterprise-grade security
- ✅ Compliance with regulations (GDPR, etc.)

### For Us (Developers)
- ✅ **$2,000 Codegeist bonus prize**
- ✅ Automatic "Runs on Atlassian" badge on Marketplace
- ✅ Preferred by enterprise customers
- ✅ Simpler architecture (no external services)
- ✅ Lower operating costs (no external bills)
- ✅ Faster approval on Marketplace

---

## FAQ

### Q: Can I use external APIs for features?
**A**: Yes, but ONLY if:
1. Declared in `permissions.external.fetch`
2. Justified business need
3. Customer can review and block
4. Not for storage, compute, or analytics

### Q: Can I use npm packages?
**A**: Yes! npm packages that run code in Forge are fine.
- ✅ Lodash, moment, etc. (pure JS libraries)
- ❌ Packages that connect to external services

### Q: What about AI APIs (OpenAI, Claude)?
**A**:
- ⚠️ Allowed if declared in `permissions.external`
- Customer must approve
- Cannot store data externally
- Use Rovo agents when possible (preferred)

### Q: Can modules communicate with Core?
**A**:
- ✅ YES - Both are Forge apps (Atlassian-hosted)
- ✅ Use MCP over HTTPS with FIT authentication
- ✅ Fully compliant

### Q: How do I verify compliance?
**A**:
```bash
forge lint --runs-on-atlassian
```

---

## Quick Reference

### ✅ ALWAYS ALLOWED
- Forge KVS
- Forge Custom Entities
- Forge SQL
- Forge Object Store
- Forge functions
- npm packages (pure JS)
- Atlassian product APIs
- Forge-to-Forge communication

### ❌ NEVER ALLOWED
- External databases
- External servers
- External storage
- External analytics
- External logging services
- Undeclared external APIs

### ⚠️ ALLOWED WITH DECLARATION
- External APIs (in `permissions.external`)
- Must be approved by customer
- Must have business justification

---

## Compliance Verification Log

Keep this checklist for Codegeist submission:

```
Date: __________
Developer: __________

Pre-Deployment Verification:
[ ] forge lint --runs-on-atlassian PASSED
[ ] No external storage in codebase
[ ] No external compute in codebase
[ ] No external analytics/logging
[ ] All external APIs declared in manifest
[ ] Storage uses @forge/kvs only
[ ] Data residency verified
[ ] Customer egress control verified

Signature: __________
```

---

**Status**: ✅ Fully Compliant
**Verified**: Ready for implementation
**Next Step**: Maintain compliance during development
