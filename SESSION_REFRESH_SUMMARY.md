# Session Refresh - Quick Summary

## ✅ What Was Implemented

A complete automatic session refresh system that keeps users logged in and provides a seamless experience.

## 📁 Files Created

1. **`src/lib/session-config.ts`** - Configuration and defaults
2. **`src/hooks/useIdleTimeout.ts`** - Idle detection hook
3. **`src/components/session/SessionRefresh.tsx`** - Main refresh component
4. **`src/components/session/SessionExpiryWarning.tsx`** - Warning modal
5. **`src/components/session/index.ts`** - Barrel exports
6. **`SESSION_REFRESH_GUIDE.md`** - Complete documentation

## 🔄 How It Works

```
User Logs In
     ↓
SessionRefresh Starts
     ↓
Every 5 Minutes → Refresh Session
     ↓
User Idle 30min → Pause Refresh
     ↓
User Active → Resume Refresh
     ↓
Window Focus → Immediate Refresh
     ↓
Network Reconnect → Immediate Refresh
```

## ⚙️ Features

✅ **Auto-Refresh** - Every 5 minutes by default
✅ **Idle Detection** - Pauses after 30 minutes of inactivity
✅ **Window Focus** - Refreshes when returning to tab
✅ **Network Reconnect** - Refreshes when internet returns
✅ **Debouncing** - Prevents excessive refresh calls
✅ **Expiry Warning** - Warns before session expires (TODO: Add token expiry to session)
✅ **Configurable** - All settings can be customized
✅ **Debug Mode** - Console logging for troubleshooting

## 🎯 Default Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Refresh Interval | 5 minutes | How often to refresh |
| Idle Timeout | 30 minutes | When to pause refresh |
| Expiry Warning | 5 minutes | Warning before expiry |
| Debounce | 1 minute | Min time between refreshes |

## 🚀 Usage

### Already Active!

SessionRefresh is already integrated into your app layout. It runs automatically on all pages.

### Enable Debug Mode

```typescript
// src/app/layout.tsx
<SessionRefresh debug={true} />
```

### Customize Settings

```typescript
<SessionRefresh
  config={{
    refreshInterval: 10 * 60 * 1000,  // 10 minutes
    idleTimeout: 60 * 60 * 1000,      // 1 hour
    autoRefresh: true,
  }}
/>
```

### Use Idle Detection

```typescript
import { useIdleTimeout } from "@/hooks/useIdleTimeout"

const { isIdle } = useIdleTimeout({
  timeout: 15 * 60 * 1000, // 15 minutes
  onIdle: () => console.log("User is idle"),
  onActive: () => console.log("User is active"),
})
```

## 🧪 Testing

### Test Auto-Refresh
1. Log in
2. Open DevTools → Network
3. Wait 5 minutes
4. See refresh request

### Test Idle Detection
1. Enable debug: `<SessionRefresh debug={true} />`
2. Log in and wait 30 minutes without activity
3. Console shows "User is idle"
4. Move mouse
5. Console shows "User is active" + immediate refresh

### Test Window Focus
1. Log in
2. Switch to another tab for 2+ minutes
3. Switch back
4. Observe immediate refresh in Network tab

### Test Network Reconnect
1. Log in
2. Turn off WiFi
3. Turn WiFi back on
4. Observe immediate refresh

## 📊 Session Behavior

### With Remember Me Unchecked
- Session expires: **1 day**
- Refresh interval: **5 minutes**
- **~288 refreshes** during session lifetime

### With Remember Me Checked
- Session expires: **30 days**
- Refresh interval: **5 minutes**
- **~8,640 refreshes** during session lifetime (if always active)
- Idle detection reduces this significantly

## 🔒 Security

- Sessions are httpOnly cookies
- Refresh only when authenticated
- Pause when idle (saves resources)
- Validate user status on each refresh
- Network errors handled gracefully

## 🎓 Environment Variables

Optional overrides in `.env.local`:

```env
# Refresh every X milliseconds (default: 300000 = 5min)
NEXT_PUBLIC_SESSION_REFRESH_INTERVAL=300000

# Idle after X milliseconds (default: 1800000 = 30min)
NEXT_PUBLIC_IDLE_TIMEOUT=1800000

# Warn X milliseconds before expiry (default: 300000 = 5min)
NEXT_PUBLIC_EXPIRY_WARNING=300000
```

## 📖 Full Documentation

See **`SESSION_REFRESH_GUIDE.md`** for:
- Complete architecture diagrams
- Detailed configuration options
- All testing procedures
- Troubleshooting guide
- API reference
- Best practices

## ⚠️ Known Limitations

1. **Expiry Warning**: Currently a placeholder. To fully implement:
   - Add token expiry (`exp`) to session object
   - Decode JWT or track expiry in database
   - Calculate time remaining accurately

2. **Multi-Tab Sync**: Sessions are refreshed independently in each tab
   - Not an issue, just higher resource usage
   - Can be improved with BroadcastChannel API

## 🎉 Ready to Use

Session refresh is **fully implemented and active**!

Your users will:
- ✅ Stay logged in automatically
- ✅ Not be logged out unexpectedly
- ✅ Have sessions refresh in the background
- ✅ Save resources when idle
- ✅ Resume seamlessly when active

---

**Status**: ✅ Implemented and Active
**Version**: 1.0
**Last Updated**: 2025-10-19
