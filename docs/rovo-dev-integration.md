# Rovo Dev Integration Strategy

**Last Updated**: 2025-10-30
**Purpose**: Document Rovo Dev usage for "Best Apps Built Using Rovo Dev" bonus prize ($2,000)

## What is Rovo Dev?

### Overview
Rovo Dev is Atlassian's AI-powered development assistant that helps with the entire software development lifecycle (SDLC):
- **Code Planning**: Turns Jira tickets into technical plans
- **Code Generation**: Writes code based on specifications
- **Code Review**: Reviews code and suggests improvements
- **Deployment**: Assists with deployment processes

### Performance
- **SWE-bench Score**: 41.98% (highest on leaderboard for 2,294 tasks)
- **Impact**: Atlassian engineers report 45% reduction in PR cycle time
- **Success Rate**: 60% higher than open-source alternatives

## Rovo Dev in Forge CLI

### 1. Rovo Assistant (Experimental)

**Available in Forge CLI**: `forge assistant` command

#### Enable Rovo Assistant
```bash
forge assistant on rovo
```

#### Disable Rovo Assistant
```bash
forge assistant off
```

#### What It Does
- **Error Analysis**: When Forge commands fail, error details are sent to Rovo agent
- **Issue Resolution**: Rovo helps understand and resolve errors
- **Real-time Help**: Provides contextual assistance during development

**Status**: ⚠️ Experimental feature (as of Forge CLI 10.8.0+)

### 2. Rovo Agent Templates

**Available in Forge CLI 10.8.0+**

#### Creating a Rovo Agent
```bash
forge create
# Select "Rovo Agent and action" category
# Select "rovo-agent" template
```

#### Template Structure
```
app-name/
├── manifest.yml    # Agent configuration
├── package.json    # Dependencies
└── src/
    └── index.js    # Action handlers
```

## How We're Using Rovo Dev

### ✅ Current Usage (Documented for Bonus)

#### 1. **Rovo Agent Template** (Task 1.1)
- Used `forge create` with "rovo-agent-rovo" template
- Generated initial app structure with Rovo agent scaffolding
- Created hello-world agent with action handlers

**Screenshot Needed**: 📸 Template selection during `forge create`

#### 2. **Manifest Configuration** (Task 1.1, 1.2)
- Configured `rovo:agent` module in manifest.yml
- Defined agent prompt, description, conversation starters
- Linked actions to Forge functions

**Current Agent Configuration**:
```yaml
modules:
  rovo:agent:
    - key: ai-native-core-hello-world-agent
      name: ai-native-core
      description: An agent for testing Forge agent functionality
      prompt: >
        You are a simple agent that helps Forge developers build their first
        Rovo agent.
      conversationStarters:
        - Log a message to Forge logs
      actions:
        - hello-world-logger
```

### 🟡 Planned Usage (Task 1.3)

#### 3. ** Orchestrator Agent** (Coming in Task 1.3)
Will use Rovo Dev best practices for:
- **Role Definition**: "You are an AI-powered  orchestrator..."
- **Capability Listing**: Operation forecasting, inventory optimization, etc.
- **Action Invocation**: When to call MCP handlers
- **Output Formatting**: How to present insights to users

#### 4. **Prompt Engineering** (Task 1.3)
Following Rovo best practices:
- Clear role definition
- Structured instructions with delimiters (---)
- Action invocation guidelines
- Output format specifications with emojis

**Example Prompt Structure**:
```yaml
prompt: >
  You are an expert  AI orchestrator for business teams.

  You can help with the following jobs:
  A. Forecasting procurement needs
  B. Optimizing inventory levels
  C. Analyzing budget utilization

  ---
  A. Forecasting procurement needs
  When asked, retrieve historical data and predict future needs.

  To do this, follow these steps:
  1. Use the forecast-procurement action to analyze historical data
  2. Present predictions with confidence intervals
  3. Suggest actionable recommendations

  Output Format:
  📊 - Use chart emoji for data insights
  ⚠️ - Use warning emoji for risks
  ✅ - Use checkmark emoji for recommendations
```

### ⏳ Future Usage (Tasks 1.4+)

#### 5. **Rovo Assistant for Error Handling** (All Tasks)
```bash
# Enable during development
forge assistant on rovo

# Let Rovo help with deployment errors
forge deploy  # If errors occur, Rovo analyzes them

# Let Rovo help with installation issues
forge install
```

**Documentation Needed**:
- Screenshots of Rovo assistant providing error analysis
- Examples of how Rovo helped resolve issues
- Time savings from using Rovo vs manual debugging

#### 6. **Conversation Starters** (Task 1.3)
Implement engaging conversation starters:
```yaml
conversationStarters:
  - Forecast next quarter's procurement needs
  - Check inventory optimization opportunities
  - Analyze current budget utilization
  - Show me high-risk purchase orders
```

## Rovo Dev Best Practices (For Implementation)

### Prompt Engineering Guidelines

#### 1. Define Agent Role
```
You are an [role] tasked with [purpose].
```

#### 2. Outline Capabilities
```
You can help with the following jobs:
A. [Capability 1]
B. [Capability 2]
C. [Capability 3]
```

#### 3. Structure with Delimiters
```
---
A. [Job Title]
When asked, you can help with [job description].

To do this, follow these steps:
1. [Step 1]
2. [Step 2]
---
B. [Next Job]
...
```

#### 4. Define Action Invocation
```
1. Retrieve data using the [action-name] action
2. Process the results
3. Present findings with [format]
```

#### 5. Specify Output Format
```
* Use emoji to highlight:
  🔴 - High priority/risk
  🟡 - Medium priority/risk
  🟢 - Low priority/risk
```

### Action Development Guidelines

#### Context Object
Actions receive a `context` object with:
```javascript
{
  "context": {
    "confluence": {
      "url": "...",
      "resourceType": "page",
      "contentId": "...",
      "spaceKey": "...",
      "spaceId": "..."
    },
    "jira": {
      "issueKey": "...",
      "projectKey": "..."
    },
    "cloudId": "...",
    "moduleKey": "..."
  }
}
```

#### Action Implementation Pattern
```javascript
export function actionHandler(payload) {
  // 1. Log inputs for debugging
  console.log(`Input: ${JSON.stringify(payload)}`);

  // 2. Extract context
  const { context } = payload;

  // 3. Perform action logic
  const result = performBusinessLogic(payload.inputParam, context);

  // 4. Return result for Rovo to present
  return `Formatted result: ${result}`;
}
```

## Documentation for Bonus Prize Submission

### Required Evidence

#### 1. Screenshots to Capture
- [ ] `forge create` template selection showing Rovo options
- [ ] Rovo Assistant enabled (`forge assistant on rovo`)
- [ ] Rovo Assistant providing error analysis (if encountered)
- [ ] Chat interface with working Rovo agent
- [ ] Agent responding to conversation starters
- [ ] Action execution in Forge logs

#### 2. Code Examples to Highlight
- [ ] Manifest.yml with structured prompt following best practices
- [ ] Action handlers with context usage
- [ ] Conversation starters implementation
- [ ] Prompt engineering with role, capabilities, and formatting

#### 3. Social Media Post (Required for Bonus)

**Template**:
```
🚀 Building AI-Native  with @Atlassian Rovo Dev!

Using Rovo agents to help business teams with:
📊 Operation forecasting
📦 Inventory optimization
💰 Budget analysis

Rovo's structured prompts and action handlers make it easy to create intelligent, context-aware agents. The 45% reduction in dev time is real!

#AtlassianRovo #ForgeApps #Codegeist2025 #AIAgents
```

**Include**:
- Screenshot of working agent in Chat
- Link to Codegeist submission (when ready)
- Mention of specific Rovo features used

#### 4. Writeup for Submission

**Sections to Include**:
1. **How We Used Rovo Dev**
   - Template scaffolding
   - Prompt engineering with best practices
   - Action handler development
   - (Optional) Rovo Assistant for error handling

2. **Impact on Development**
   - Time saved on agent setup
   - Quality of generated scaffolding
   - Ease of prompt iteration
   - Developer experience improvements

3. **Unique Rovo Features Leveraged**
   - Structured prompt format
   - Context object for Confluence/Jira integration
   - Conversation starters for UX
   - Action invocation patterns

4. **Challenges and Solutions**
   - Any issues encountered with Rovo
   - How Rovo's documentation helped
   - Lessons learned about agent design

## Integration Checklist

### Pre-Development (Task 1.1) ✅
- [x] Used Rovo agent template via `forge create`
- [x] Studied Rovo agent manifest structure
- [x] Understood action-to-function mapping

### Task 1.3: Rovo Agent Implementation ⏳
- [ ] Enable Rovo Assistant: `forge assistant on rovo`
- [ ] Implement  orchestrator agent prompt (following best practices)
- [ ] Define conversation starters for business users
- [ ] Create action handlers with context usage
- [ ] Add emoji-based output formatting
- [ ] Test agent in Rovo Chat
- [ ] **📸 Capture screenshots for bonus submission**

### Task 1.4: Storage Integration ⏳
- [ ] Use Rovo Assistant for debugging storage issues
- [ ] Document any Rovo-assisted problem solving
- [ ] Test agent with real  data queries

### Final Submission 🎯
- [ ] Collect all Rovo Dev screenshots
- [ ] Write social media post about experience
- [ ] Create writeup for bonus prize submission
- [ ] Include Rovo Dev section in demo video
- [ ] Highlight in Codegeist submission form

## References

### Forge Documentation
- [Build a Hello World Rovo Agent](https://developer.atlassian.com/platform/forge/build-a-hello-world-rovo-agent/)
- [Rovo Agent Manifest Reference](https://developer.atlassian.com/platform/forge/manifest-reference/modules/rovo-agent/)
- [Forge CLI Assistant Command](https://developer.atlassian.com/platform/forge/cli-reference/assistant/)

### External Resources
- [Rovo Dev CLI Announcement](https://www.atlassian.com/blog/announcements/rovo-dev-command-line-interface)
- [Atlassian Rovo for Developers](https://www.atlassian.com/solutions/devops/ai-innovation)

---

**Note for Implementation**: When working on Task 1.3, remember to:
1. Enable Rovo Assistant before starting: `forge assistant on rovo`
2. Take screenshots throughout the development process
3. Document any times Rovo Assistant helps with errors
4. Follow the prompt engineering best practices documented above
5. Test thoroughly in Rovo Chat before deploying
