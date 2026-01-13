# Phase 3: Real-time Features

**Priority:** Medium
**Status:** Complete
**Completed:** 2026-01-13

## Overview

Add real-time log streaming and auto-refresh for status updates.

## Features

### Log Streaming
- SSE/WebSocket connection to Dokploy API
- Stream deployment logs in real-time
- Scrollable log panel with auto-scroll
- Toggle auto-scroll on/off

### Auto-refresh
- Poll app status every 5s (configurable)
- Update status indicators
- Show "last updated" timestamp

### Log Panel
- Full-height log viewer
- Timestamp + log line format
- Color-coded log levels (error=red, warn=yellow)
- Copy log line to clipboard

## Files to Create

| File | Purpose |
|------|---------|
| `src/tui/hooks/use-log-stream.ts` | SSE/WebSocket log connection |
| `src/tui/hooks/use-auto-refresh.ts` | Polling interval hook |
| `src/tui/components/log-viewer.tsx` | Scrollable log panel |
| `src/lib/log-stream.ts` | Log streaming API client |

## Technical Considerations

- Check Dokploy API for log streaming endpoint
- Fallback to polling if SSE unavailable
- Virtualize long logs for performance
- Handle reconnection on disconnect

## Success Criteria

- [ ] Logs stream in real-time during deploy
- [ ] Auto-refresh updates status
- [ ] Log viewer scrolls smoothly
- [ ] Reconnect on connection loss
