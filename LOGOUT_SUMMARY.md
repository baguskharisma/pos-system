# Logout Functionality - Quick Reference

Quick reference untuk logout functionality di POS System.

## 🚀 Quick Start

### 1. Simple Logout Button

```typescript
import { LogoutButton } from "@/components/auth/LogoutButton";

<LogoutButton>Sign Out</LogoutButton>
```

### 2. Logout Hook

```typescript
import { useLogout } from "@/hooks/useLogout";

const { logout, isLoggingOut } = useLogout();

<button onClick={() => logout()} disabled={isLoggingOut}>
  Logout
</button>
```

### 3. Standalone Function

```typescript
import { logoutUser } from "@/hooks/useLogout";

await logoutUser();
```

## 📦 Components

| Component | Description | Usage |
|-----------|-------------|-------|
| `LogoutButton` | Basic logout button | `<LogoutButton>Logout</LogoutButton>` |
| `LogoutAllButton` | Logout all devices | `<LogoutAllButton />` |
| `QuickLogoutButton` | No confirmation | `<QuickLogoutButton />` |
| `LogoutLink` | Link style | `<LogoutLink>Sign out</LogoutLink>` |
| `LogoutMenuItem` | For menus | `<LogoutMenuItem>Logout</LogoutMenuItem>` |
| `LogoutWithIcon` | With icon | `<LogoutWithIcon icon={<Icon />} />` |

## ⚙️ Options

```typescript
interface LogoutOptions {
  revokeAll?: boolean;        // Logout all devices
  redirectTo?: string;        // Redirect URL
  callbackUrl?: string;       // Callback URL
  confirm?: boolean;          // Show confirmation
  confirmMessage?: string;    // Custom message
}
```

## 📝 Common Patterns

### With Confirmation

```typescript
<LogoutButton
  options={{
    confirm: true,
    confirmMessage: "Are you sure?",
  }}
>
  Logout
</LogoutButton>
```

### Logout All Devices

```typescript
<LogoutAllButton>
  Sign Out from All Devices
</LogoutAllButton>
```

### Custom Redirect

```typescript
<LogoutButton
  options={{
    redirectTo: "/goodbye",
  }}
>
  Logout
</LogoutButton>
```

### With Callbacks

```typescript
<LogoutButton
  onLogoutSuccess={() => console.log("Success")}
  onLogoutError={(err) => console.error(err)}
>
  Logout
</LogoutButton>
```

### Programmatic Logout

```typescript
const { logout } = useLogout();

const handleLogout = async () => {
  const result = await logout({
    revokeAll: false,
    redirectTo: "/",
  });

  if (result.success) {
    console.log("Logged out");
  }
};
```

## 🎯 Use Cases

### Navigation Bar

```typescript
<nav>
  <a href="/">Home</a>
  <LogoutLink>Sign out</LogoutLink>
</nav>
```

### User Menu

```typescript
<div className="user-menu">
  <a href="/profile">Profile</a>
  <a href="/settings">Settings</a>
  <LogoutMenuItem>Logout</LogoutMenuItem>
</div>
```

### Settings Page

```typescript
<section>
  <h2>Account</h2>
  <LogoutButton options={{ confirm: true }}>
    Logout
  </LogoutButton>
  <LogoutAllButton>
    Logout from All Devices
  </LogoutAllButton>
</section>
```

### Emergency Logout

```typescript
import { logoutAllDevices } from "@/hooks/useLogout";

// Force logout from all devices
await logoutAllDevices();
```

## 🔧 Hook API

```typescript
const {
  logout,              // Main function
  logoutCurrent,       // Current device only
  logoutAll,           // All devices (with confirm)
  quickLogout,         // No confirmation
  logoutWithConfirm,   // Custom confirmation
  isLoggingOut,        // Loading state
  error,               // Error message
} = useLogout();
```

## 📡 API Endpoint

```typescript
POST /api/auth/logout
Content-Type: application/json

{
  "revokeAll": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "revokedSessions": 1
}
```

## ✅ Best Practices

1. **Always confirm for logout all**
   ```typescript
   <LogoutAllButton>Logout All</LogoutAllButton>
   ```

2. **Show loading state**
   ```typescript
   <LogoutButton showLoading={true} />
   ```

3. **Handle errors**
   ```typescript
   <LogoutButton onLogoutError={(err) => alert(err)} />
   ```

4. **Clear local data**
   ```typescript
   const handleLogout = async () => {
     localStorage.clear();
     await logout();
   };
   ```

5. **Provide feedback**
   ```typescript
   <LogoutButton
     onLogoutSuccess={() => toast.success("Logged out")}
   />
   ```

## 🐛 Common Issues

### Logout tidak redirect
```typescript
// Set redirectTo
<LogoutButton options={{ redirectTo: "/auth/signin" }} />
```

### Session masih ada
```typescript
// Clear browser cache atau logout all
<LogoutAllButton />
```

### Error "Not authenticated"
```typescript
// User sudah logout, redirect ke login
router.push("/auth/signin");
```

## 📁 File Locations

```
src/
├── app/api/auth/logout/
│   └── route.ts              # API endpoint
├── hooks/
│   └── useLogout.ts          # Logout hook
└── components/auth/
    ├── LogoutButton.tsx      # Components
    └── LogoutExamples.tsx    # 15+ examples
```

## 🔗 Related

- [Complete Guide](./LOGOUT_GUIDE.md)
- [Session Management](./SESSION_MANAGEMENT.md)
- [JWT Configuration](./JWT_CONFIGURATION.md)

## 📊 Features

- ✅ Logout current device
- ✅ Logout all devices
- ✅ Session revocation
- ✅ Audit logging
- ✅ Confirmation dialogs
- ✅ Custom redirects
- ✅ Loading states
- ✅ Error handling
- ✅ Multiple components
- ✅ Flexible API
- ✅ TypeScript support
- ✅ NextAuth integration

Quick reference siap digunakan! 🚀
