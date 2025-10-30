# AIMS Documentation Index

**AI-Native ERP Modular Suite (AIMS)** - Documentation Hub

## Quick Navigation

### 📋 Planning Documents
1. **[phase1-implementation-plan.md](./phase1-implementation-plan.md)** (PRIMARY)
   - Complete Phase 1 roadmap (60+ pages)
   - Week-by-week breakdown
   - Architecture diagrams
   - All deliverables and timelines
   - **Start here for overview**

2. **[phase1-detailed-tasks.md](./phase1-detailed-tasks.md)** (REFERENCE)
   - Step-by-step task breakdowns
   - Code examples and commands
   - Acceptance criteria for each subtask
   - Troubleshooting guides
   - **Use during implementation**

### 🎯 Competition Requirements
3. **[rules.md](./rules.md)**
   - Codegeist 2025 official rules
   - Submission requirements
   - Deadline: December 22, 2025

4. **[codegeist.md](./codegeist.md)**
   - Codegeist resources
   - Forge documentation links
   - Community support

### 📐 Original Specification
5. **[spec.md](./spec.md)**
   - Original project specification
   - MCP protocol design
   - Architecture vision

### ✅ Compliance Documents
6. **[runs-on-atlassian-compliance.md](./runs-on-atlassian-compliance.md)** (CRITICAL)
   - "Runs on Atlassian" requirements
   - 3 mandatory compliance rules
   - Verification checklist
   - **Review before every deployment**

7. **[storage-compliance-update.md](./storage-compliance-update.md)**
   - Forge-hosted storage requirements
   - Implementation examples
   - Migration from original plan
   - AI embedding storage strategy

### 💬 Session Logs
8. **[convo1029.txt](./convo1029.txt)**
   - Planning session conversation
   - Decision rationale
   - Q&A history

---

## Document Relationships

```
spec.md (Original Vision)
    ↓
phase1-implementation-plan.md (Strategy)
    ↓
phase1-detailed-tasks.md (Tactics)
    ↓
Implementation (Code)
    ↓
runs-on-atlassian-compliance.md (Verification)
```

---

## Implementation Workflow

### Before Starting Development
1. ✅ Read `phase1-implementation-plan.md` for overview
2. ✅ Review `runs-on-atlassian-compliance.md` for constraints
3. ✅ Check `phase1-detailed-tasks.md` for current task

### During Development
1. Follow subtasks in `phase1-detailed-tasks.md`
2. Verify against acceptance criteria
3. Run quality gates: `npm run ci`
4. Check compliance: `forge lint --runs-on-atlassian`

### Before Deployment
1. Complete task checklist
2. Run all tests: `npm run test:coverage`
3. Verify manifest: `forge lint`
4. Check compliance: `forge lint --runs-on-atlassian`
5. Document changes

---

## Key Principles

### Architecture
- **Layered DDD**: domain → resolvers → infrastructure → frontend
- **Type Safety**: TypeScript strict mode, zero `any` types
- **Testing**: 70%+ coverage, co-located tests

### Storage
- **Forge-hosted ONLY**: KVS + Custom Entities
- **NO external databases**: Violates "Runs on Atlassian"
- **AI embeddings**: Arrays in Custom Entity attributes

### Communication
- **MCP Protocol**: Module ↔ Core communication
- **Hybrid Approach**: npm libraries + custom implementation
- **FIT Authentication**: Forge Invocation Tokens

### Quality
- **ESLint**: Zero errors, zero warnings
- **TypeScript**: Strict mode, no compilation errors
- **Tests**: Jest with ts-jest, 70%+ coverage
- **Compliance**: `forge lint --runs-on-atlassian` must pass

---

## Quick Commands Reference

```bash
# Development
npm run ci              # Full validation (lint + type-check + test)
npm run lint            # ESLint
npm run type-check      # TypeScript compilation
npm test                # Run tests
npm run test:coverage   # Coverage report

# Forge
forge lint                          # Validate manifest
forge lint --runs-on-atlassian     # Compliance check
forge deploy -e development         # Deploy
forge tunnel                        # Debug logs

# Project
tree src -L 3           # View structure
npm run clean           # Clean build artifacts
```

---

## Status Tracking

### Phase 1 Progress
- **Week 1**: Core App Foundation - [IN PROGRESS]
  - Task 1.1: Project Setup ⏳
  - Task 1.2: MCP Layer ⬜
  - Task 1.3: Rovo Agent ⬜
  - Task 1.4: Storage ⬜

- **Week 2**: Module Template + Module 1 - [PENDING]
- **Week 3**: Module 2 + Cross-Module - [PENDING]
- **Week 4**: Polish + Submission - [PENDING]

### Compliance Status
- ✅ Forge-hosted storage only
- ✅ No external databases
- ✅ No external analytics/logging
- ⬜ Performance < 3s (to be verified)
- ⬜ Security audit (Week 4)

---

## Need Help?

### During Implementation
1. Check `phase1-detailed-tasks.md` for step-by-step guide
2. Review `CLAUDE.md` in project root for patterns
3. Use Forge knowledge MCP tools for API details

### Compliance Questions
1. See `runs-on-atlassian-compliance.md`
2. Run `forge lint --runs-on-atlassian`
3. Check storage decision in `storage-compliance-update.md`

### Forge Questions
1. Use MCP tool: `mcp__forge-knowledge__search-forge-docs`
2. Check Forge docs: https://developer.atlassian.com/platform/forge/
3. Community: https://community.developer.atlassian.com/

---

## Documentation Standards

### When Creating New Docs
- Use Markdown format
- Include table of contents for long docs
- Add code examples with syntax highlighting
- Include verification commands
- Cross-reference related documents

### When Updating Docs
- Update "Last Updated" date
- Note version changes
- Update cross-references
- Keep index synchronized

---

**Last Updated**: October 29, 2025
**Phase**: Week 1 - Core Foundation
**Next Review**: Weekly on Fridays
