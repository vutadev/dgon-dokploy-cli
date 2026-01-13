# Brainstorm: TUI Integration for Dokploy CLI

**Date:** 2026-01-13
**Topic:** Integrating Terminal User Interface (TUI) for improved UX

---

## Problem Statement

Current `dokploy-cli` uses traditional CLI approach with:
- Commander.js for command parsing
- @inquirer/prompts for interactive prompts
- console-table-printer for table output
- ora for spinners
- picocolors for colored output

Users must memorize commands/IDs, navigate via subcommands (`dokploy app list`, `dokploy app deploy <id>`). No visual overview of projects/apps/deployments at a glance.

**Goal:** Evaluate TUI integration to make the CLI more user-friendly, enabling visual navigation, real-time status updates, and keyboard-driven workflows.

---

## Current Architecture Analysis

```
src/
├── index.ts              # Entry point, Commander setup
├── commands/             # Command handlers (auth, app, project, db, etc.)
├── lib/
│   ├── api.ts           # API client
│   ├── config.ts        # Config management
│   └── output.ts        # Output utilities (spinner, table, colors)
└── types/               # TypeScript types
```

**Dependencies:**
- commander: ^12.1.0
- @inquirer/prompts: ^7.2.1
- ora: ^8.1.1
- console-table-printer: ^2.12.1
- picocolors: ^1.1.1
- conf: ^13.0.1

**Current Flow:**
1. User types command → Commander parses → API call → Output result → Exit

---

## Evaluated Approaches

### Approach 1: Enhanced Prompts Only (Minimal Change)

**Description:** Replace @inquirer/prompts with @clack/prompts for prettier, more consistent UI. No full TUI.

**Implementation:**
- Swap `@inquirer/prompts` → `@clack/prompts`
- Add grouped prompts, spinners, styled messages
- Keep command-based architecture

**Pros:**
- Minimal code changes
- No new paradigm to learn
- Works well with existing Commander setup
- No React/build complexity
- Bun-compatible

**Cons:**
- Still command-driven, not visual
- No dashboard/overview capability
- No real-time monitoring
- Limited improvement in discoverability

**Effort:** Low
**Risk:** Low

---

### Approach 2: Ink (React-based TUI)

**Description:** Use Ink library to build React component-based terminal UI with dashboard, lists, and interactive panels.

**Implementation:**
- Add ink, ink-ui, react as dependencies
- Build TUI components (AppList, ProjectSelector, DeploymentStatus)
- Create `dokploy tui` or default interactive mode
- Keep existing CLI commands for scripting/CI

**Pros:**
- Full TUI with keyboard navigation
- Real-time updates possible
- React ecosystem (if familiar)
- Good TypeScript support
- Rich component library (ink-ui)

**Cons:**
- Requires React knowledge
- Additional build complexity (JSX transpilation)
- Heavier dependency footprint
- May have Bun compatibility issues
- Significant architectural change

**Example Structure:**
```tsx
// Interactive mode entry
<App>
  <Layout>
    <Sidebar><ServerList /></Sidebar>
    <Main>
      <ProjectList />
      <AppDetails />
    </Main>
    <StatusBar />
  </Layout>
</App>
```

**Effort:** High
**Risk:** Medium-High (React in CLI, Bun compat)

---

### Approach 3: Blessed/Neo-Blessed (Widget-based TUI)

**Description:** Use neo-blessed for traditional widget-based terminal UI with panels, scrollable lists, and keyboard shortcuts.

**Implementation:**
- Add neo-blessed as dependency
- Create widgets (List, Box, Log viewer)
- Implement k9s/lazydocker-style layout

**Pros:**
- Battle-tested for complex TUIs
- Widget-based thinking (not React)
- Great for multi-pane layouts
- Mouse support

**Cons:**
- Library is aging (limited maintenance)
- Steeper learning curve
- Complex API
- Less TypeScript support

**Effort:** High
**Risk:** Medium (maintenance concerns)

---

### Approach 4: Hybrid Approach (Recommended)

**Description:** Keep CLI commands + add `dokploy ui` (or just `dokploy` with no args) for interactive TUI mode using @clack/prompts for wizard flows.

**Phase 1 - Enhanced Prompts:**
- Replace @inquirer/prompts with @clack/prompts
- Add `dokploy` (no subcommand) → interactive menu
- Create wizard flows: "What do you want to do?" → "Select project" → "Select app" → "Deploy/View logs/etc."

**Phase 2 - Interactive Dashboard (Optional, Future):**
- Add `dokploy dashboard` or `dokploy --interactive`
- Use Ink for full TUI if needed
- Real-time log streaming, status monitoring

**Implementation (Phase 1):**
```typescript
// src/index.ts - Interactive mode when no args
if (process.argv.length === 2) {
  await interactiveMode(); // Launch menu-driven flow
} else {
  program.parse(); // Standard CLI
}

// src/interactive/menu.ts
async function interactiveMode() {
  p.intro('Welcome to Dokploy CLI');

  const action = await p.select({
    message: 'What would you like to do?',
    options: [
      { value: 'deploy', label: 'Deploy an application' },
      { value: 'apps', label: 'View applications' },
      { value: 'logs', label: 'View logs' },
      { value: 'projects', label: 'Manage projects' },
      { value: 'servers', label: 'Manage servers' },
    ]
  });

  // Route to specific wizard based on selection
  switch (action) {
    case 'deploy': await deployWizard(); break;
    case 'apps': await appsWizard(); break;
    // ...
  }
}
```

**Pros:**
- Incremental adoption
- No breaking changes
- CLI commands preserved for scripting
- @clack/prompts is Bun-compatible
- Beautiful UX without full TUI complexity
- Can evolve to Ink later if needed

**Cons:**
- Not a "real" TUI (no persistent screen)
- No real-time dashboard (Phase 1)
- Sequential navigation only

**Effort:** Low-Medium
**Risk:** Low

---

## Comparison Matrix

| Criteria | Approach 1 | Approach 2 (Ink) | Approach 3 (Blessed) | Approach 4 (Hybrid) |
|----------|------------|------------------|---------------------|---------------------|
| Learning curve | Low | High | High | Low |
| Dev effort | Low | High | High | Medium |
| Breaking changes | None | Significant | Significant | None |
| User experience | Minor improvement | Excellent | Excellent | Good → Great |
| Bun compatibility | Yes | Uncertain | Uncertain | Yes |
| Scriptability | Yes | Partial | Partial | Yes |
| Real-time capability | No | Yes | Yes | Phase 2 |
| Maintainability | Easy | Complex | Complex | Easy |

---

## Recommendation

**Go with Approach 4 (Hybrid)** in phases:

### Phase 1: Enhanced Interactive Mode (Immediate)
1. Replace `@inquirer/prompts` → `@clack/prompts`
2. Add interactive entry point (`dokploy` with no args)
3. Create wizard flows for common tasks
4. Keep all existing CLI commands unchanged

### Phase 2: Full TUI (Future, If Needed)
1. Evaluate Ink after Phase 1 adoption
2. Consider `dokploy dashboard` command
3. Add real-time log streaming
4. Build lazydocker-style interface

**Rationale:**
- YAGNI: Start simple, add complexity only if justified
- KISS: @clack/prompts provides 80% of UX benefit with 20% effort
- Maintains backward compatibility
- Aligns with Bun ecosystem
- Allows user feedback before heavy investment

---

## Implementation Considerations

### Package Changes
```diff
- "@inquirer/prompts": "^7.2.1"
+ "@clack/prompts": "^0.11.0"
```

### File Structure (Phase 1)
```
src/
├── index.ts                 # Add interactive mode check
├── interactive/
│   ├── menu.ts             # Main interactive menu
│   ├── deploy-wizard.ts    # Deploy flow
│   ├── apps-wizard.ts      # App management flow
│   └── projects-wizard.ts  # Project management flow
└── ... (existing structure)
```

### Key UX Patterns
- Arrow key navigation with vim support (j/k)
- Consistent color scheme across flows
- Searchable lists for large datasets
- Cancel handling (Ctrl+C) with graceful exit
- Clear breadcrumb/context display

---

## Success Metrics

1. User can complete common tasks without memorizing IDs
2. New users can discover features without docs
3. Existing CLI scripts continue working
4. No increase in bundle size > 50KB
5. Installation/first-run experience improved

---

## Next Steps

1. **Decision:** Confirm Approach 4 (Hybrid) is acceptable
2. **Create plan:** Detail Phase 1 implementation tasks
3. **Prototype:** Build interactive menu proof-of-concept
4. **Iterate:** Get user feedback before Phase 2

---

## Unresolved Questions

1. ~~Should `dokploy` (no args) launch interactive or show help?~~ → Launch TUI
2. Target terminal support (Windows cmd vs PowerShell vs Unix)?
3. Should we support mouse clicks in prompts?
4. Do we need offline mode / cached data for interactive menus?

---

## User Clarifications (2026-01-13)

**Requirements confirmed:**
1. **Real-time log streaming** - Yes, needed (like `tail -f`)
2. **Persistent dashboard** - Yes, must be persistent TUI (not just wizards)
3. **Primary use** - Interactive humans, but preserve CLI for CI/scripts/AI automation

**Impact:** These requirements favor **Ink (React-based TUI)** over @clack/prompts-only approach.

---

## Revised Recommendation: Ink TUI + CLI Dual Mode

Given the requirements, recommend **Approach 2 (Ink)** with CLI preservation:

### Architecture: Dual-Mode CLI

```
dokploy                    → Launch persistent TUI dashboard
dokploy --no-tui <cmd>     → Traditional CLI (for scripts/CI)
dokploy app list           → Traditional CLI (auto-detect non-interactive)
dokploy app deploy <id>    → Traditional CLI
```

**Auto-detection logic:**
```typescript
const isTTY = process.stdout.isTTY;
const hasSubcommand = process.argv.length > 2;
const forceNoTUI = process.argv.includes('--no-tui');

if (isTTY && !hasSubcommand && !forceNoTUI) {
  launchTUI();  // Ink dashboard
} else {
  program.parse();  // Commander CLI
}
```

### TUI Layout (lazydocker/k9s style)

```
┌─────────────────────────────────────────────────────────────────┐
│ Dokploy CLI v0.2.0                    [server: prod] [?] help   │
├──────────────┬──────────────────────────────────────────────────┤
│ PROJECTS     │  APPLICATIONS                                    │
│ ─────────    │  ─────────────                                   │
│ > my-saas    │  > frontend      running   deploy: 2m ago        │
│   backend    │    api-server    running   deploy: 5m ago        │
│   infra      │    worker        stopped   deploy: 1d ago        │
│              │                                                   │
│              ├──────────────────────────────────────────────────┤
│              │  LOGS (frontend) - streaming                      │
│              │  ────────────────────────────────────────────     │
│              │  [12:34:01] Server started on port 3000           │
│              │  [12:34:02] Connected to database                 │
│              │  [12:34:03] Ready to accept connections           │
│              │  [12:34:15] GET /api/health 200 12ms              │
│              │                                                   │
├──────────────┴──────────────────────────────────────────────────┤
│ [d]eploy [s]top [r]estart [l]ogs [e]nv [↑↓]navigate [q]uit      │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Phases (Revised)

**Phase 1: Foundation**
- Add Ink + React dependencies
- Create TUI entry point with layout skeleton
- Implement project/app list panels
- Keep existing CLI commands untouched

**Phase 2: Core Features**
- Real-time log streaming (SSE/WebSocket)
- Keyboard navigation (vim-style)
- App actions (deploy, stop, start, restart)
- Status auto-refresh

**Phase 3: Polish**
- Search/filter in lists
- Environment variable viewer/editor
- Database/service management
- Multi-server support in TUI

### Dependencies to Add

```json
{
  "ink": "^5.0.1",
  "ink-ui": "^0.2.0",
  "react": "^18.3.1",
  "@types/react": "^18.3.0"
}
```

### Bun Compatibility Note

Ink v5 uses React 18 which has known Bun compatibility. Need to verify:
1. JSX compilation with Bun
2. React reconciler in Bun runtime

**Mitigation:** If Bun issues arise, consider:
- Build step with esbuild/tsup for TUI components
- Or use Node.js runtime for TUI mode only

### File Structure (Revised)

```
src/
├── index.ts                    # Entry: detect TUI vs CLI mode
├── cli/                        # Traditional CLI (existing, renamed)
│   ├── commands/
│   └── ...
├── tui/                        # Ink TUI components
│   ├── app.tsx                 # Root TUI app
│   ├── components/
│   │   ├── layout.tsx          # Main layout with panels
│   │   ├── project-list.tsx    # Left sidebar
│   │   ├── app-list.tsx        # App table
│   │   ├── log-viewer.tsx      # Streaming log panel
│   │   ├── status-bar.tsx      # Bottom shortcuts
│   │   └── header.tsx          # Top bar with server info
│   ├── hooks/
│   │   ├── use-projects.ts     # Data fetching hook
│   │   ├── use-apps.ts
│   │   └── use-log-stream.ts   # SSE/WebSocket hook
│   └── utils/
│       └── keybindings.ts      # Keyboard handler
├── lib/                        # Shared (API, config, types)
│   ├── api.ts
│   ├── config.ts
│   └── output.ts
└── types/
```

### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Bun + React issues | Medium | High | Test early, fallback to Node |
| Complex state management | Medium | Medium | Keep state simple, avoid Redux |
| Log streaming perf | Low | Medium | Virtualize long logs |
| Bundle size increase | High | Low | Tree-shake, lazy load TUI |

### Success Metrics (Revised)

1. TUI launches in <500ms
2. Log streaming with <100ms latency
3. Keyboard navigation feels responsive (<50ms)
4. CI scripts work unchanged (`dokploy app deploy` in GitHub Actions)
5. Bundle size <2MB total

---

## Final Decisions (2026-01-13)

| Question | Decision |
|----------|----------|
| Terminal support | Unix first, Windows later |
| Mouse support | Keyboard only |
| Offline caching | Yes, cache project/app data |

### Confirmed Approach

**Ink TUI + CLI Dual Mode** with:
- Persistent lazydocker-style dashboard
- Real-time log streaming
- Vim-style keyboard navigation (j/k/↑↓)
- CLI commands preserved for CI/AI automation
- Unix terminal support (macOS/Linux)
- Local cache for faster TUI startup

### Implementation Ready

Brainstorm complete. Next step: Create implementation plan for Phase 1 (Foundation).

---

## Sources

- [Ink - React for CLIs](https://github.com/vadimdemedes/ink)
- [Clack Prompts](https://www.clack.cc/)
- [@clack/prompts npm](https://www.npmjs.com/package/@clack/prompts)
- [Lazydocker](https://github.com/jesseduffield/lazydocker)
- [K9s](https://github.com/derailed/k9s)
- [7 TUI libraries - LogRocket](https://blog.logrocket.com/7-tui-libraries-interactive-terminal-apps/)
- [Building Terminal Interfaces with Node.js](https://blog.openreplay.com/building-terminal-interfaces-nodejs/)
- [Ink UI Components](https://github.com/vadimdemedes/ink-ui)
