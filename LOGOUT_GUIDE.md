# Logout Functionality Guide

Complete guide untuk menggunakan logout functionality di POS System.

## 📋 Table of Contents

1. [Overview](#overview)
2. [API Endpoint](#api-endpoint)
3. [Client-Side Hook](#client-side-hook)
4. [Components](#components)
5. [Usage Examples](#usage-examples)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Overview

Logout functionality mencakup:
- ✅ API endpoint untuk logout
- ✅ Revoke session dari database
- ✅ Clear NextAuth session cookie
- ✅ Audit logging
- ✅ Client-side hooks
- ✅ Reusable components
- ✅ Logout from all devices
- ✅ Confirmation dialogs
- ✅ Custom redirects

## API Endpoint

### POST /api/auth/logout

Logout user dan revoke sessions.

**Request:**
```typescript
POST /api/auth/logout
Content-Type: application/json

{
  "revokeAll": false  // Optional: logout from all devices
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "revokedSessions": 1
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Failed to logout"
}
```

### Features

- **Current Session Only**: Default behavior, logout dari device saat ini
- **Revoke All Sessions**: Logout dari semua device
- **Audit Logging**: Semua logout dicatat di audit log
- **Database Cleanup**: Revoke session tokens dari database

## Client-Side Hook

### useLogout()

React hook untuk logout functionality.

```typescript
import { useLogout } from "@/hooks/useLogout";

function Component() {
  const { logout, isLoggingOut, error } = useLogout();

  const handleLogout = async () => {
    const result = await logout();

    if (result.success) {
      console.log("Logged out successfully");
    }
  };

  return (
    <button onClick={handleLogout} disabled={isLoggingOut}>
      {isLoggingOut ? "Logging out..." : "Logout"}
    </button>
  );
}
```

### Hook API

```typescript
const {
  logout,              // Main logout function
  logoutCurrent,       // Logout current device
  logoutAll,           // Logout all devices (with confirmation)
  quickLogout,         // Logout without confirmation
  logoutWithConfirm,   // Logout with custom confirmation
  isLoggingOut,        // Loading state
  error,               // Error message
} = useLogout();
```

### Logout Options

```typescript
interface LogoutOptions {
  revokeAll?: boolean;           // Logout from all devices
  redirectTo?: string;           // Redirect URL
  callbackUrl?: string;          // Callback URL
  confirm?: boolean;             // Show confirmation
  confirmMessage?: string;       // Custom confirmation message
}
```

## Components

### 1. LogoutButton

Basic logout button.

```typescript
import { LogoutButton } from "@/components/auth/LogoutButton";

<LogoutButton>Sign Out</LogoutButton>
```

**With Options:**
```typescript
<LogoutButton
  options={{
    confirm: true,
    confirmMessage: "Are you sure?",
    redirectTo: "/goodbye",
  }}
>
  Logout
</LogoutButton>
```

**With Callbacks:**
```typescript
<LogoutButton
  onLogoutSuccess={() => console.log("Success!")}
  onLogoutError={(error) => console.error(error)}
>
  Logout
</LogoutButton>
```

### 2. LogoutAllButton

Logout dari semua device.

```typescript
import { LogoutAllButton } from "@/components/auth/LogoutButton";

<LogoutAllButton>
  Logout from All Devices
</LogoutAllButton>
```

### 3. QuickLogoutButton

Logout tanpa konfirmasi.

```typescript
import { QuickLogoutButton } from "@/components/auth/LogoutButton";

<QuickLogoutButton />
```

### 4. LogoutLink

Logout sebagai link (bukan button).

```typescript
import { LogoutLink } from "@/components/auth/LogoutButton";

<LogoutLink>Sign out</LogoutLink>
```

### 5. LogoutMenuItem

Untuk dropdown menu.

```typescript
import { LogoutMenuItem } from "@/components/auth/LogoutButton";

<div className="dropdown-menu">
  <a href="/profile">Profile</a>
  <a href="/settings">Settings</a>
  <LogoutMenuItem>Logout</LogoutMenuItem>
</div>
```

### 6. LogoutWithIcon

Dengan icon support.

```typescript
import { LogoutWithIcon } from "@/components/auth/LogoutButton";

<LogoutWithIcon icon={<LogOutIcon />}>
  Logout
</LogoutWithIcon>
```

## Usage Examples

### Example 1: Simple Logout

```typescript
import { LogoutButton } from "@/components/auth/LogoutButton";

export function Header() {
  return (
    <header>
      <nav>
        <a href="/">Home</a>
        <LogoutButton>Sign Out</LogoutButton>
      </nav>
    </header>
  );
}
```

### Example 2: User Dropdown Menu

```typescript
import { LogoutMenuItem } from "@/components/auth/LogoutButton";
import { useSession } from "next-auth/react";

export function UserMenu() {
  const { data: session } = useSession();

  return (
    <div className="user-menu">
      <button className="user-avatar">
        {session?.user.name}
      </button>

      <div className="dropdown">
        <a href="/profile">My Profile</a>
        <a href="/settings">Settings</a>
        <a href="/sessions">Active Sessions</a>
        <hr />
        <LogoutMenuItem>Logout</LogoutMenuItem>
      </div>
    </div>
  );
}
```

### Example 3: Logout with Confirmation

```typescript
import { LogoutButton } from "@/components/auth/LogoutButton";

export function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>

      <section>
        <h2>Account</h2>
        <LogoutButton
          options={{
            confirm: true,
            confirmMessage: "Are you sure you want to logout?",
          }}
          className="btn btn-danger"
        >
          Logout
        </LogoutButton>
      </section>
    </div>
  );
}
```

### Example 4: Logout from All Devices

```typescript
import { LogoutAllButton } from "@/components/auth/LogoutButton";

export function SecuritySettings() {
  return (
    <div>
      <h2>Active Sessions</h2>
      <p>You are currently logged in on 3 devices.</p>

      <LogoutAllButton>
        Sign Out from All Devices
      </LogoutAllButton>
    </div>
  );
}
```

### Example 5: Programmatic Logout

```typescript
import { useLogout } from "@/hooks/useLogout";

export function CustomLogout() {
  const { logout, isLoggingOut } = useLogout();

  const handleCustomLogout = async () => {
    // Save user preferences before logout
    await saveUserPreferences();

    // Clear local storage
    localStorage.clear();

    // Perform logout
    await logout({
      redirectTo: "/goodbye",
      revokeAll: false,
    });
  };

  return (
    <button onClick={handleCustomLogout} disabled={isLoggingOut}>
      {isLoggingOut ? "Saving and logging out..." : "Logout"}
    </button>
  );
}
```

### Example 6: Auto Logout on Inactivity

```typescript
import { useEffect } from "react";
import { useLogout } from "@/hooks/useLogout";

export function AutoLogout() {
  const { quickLogout } = useLogout();

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeout);
      // Auto logout after 30 minutes of inactivity
      timeout = setTimeout(() => {
        alert("You have been logged out due to inactivity");
        quickLogout("/auth/signin?reason=inactivity");
      }, 30 * 60 * 1000);
    };

    // Reset timer on user activity
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keypress", resetTimer);
    window.addEventListener("click", resetTimer);

    resetTimer();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keypress", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, [quickLogout]);

  return null;
}
```

### Example 7: Logout with Navigation Guard

```typescript
import { useRouter } from "next/navigation";
import { useLogout } from "@/hooks/useLogout";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { logout } = useLogout();

  const handleUnauthorized = async () => {
    alert("Your session has expired. Please login again.");
    await logout({
      redirectTo: "/auth/signin?reason=expired",
    });
  };

  // Use in API calls
  const fetchProtectedData = async () => {
    const response = await fetch("/api/protected");

    if (response.status === 401) {
      handleUnauthorized();
      return;
    }

    return response.json();
  };

  return <>{children}</>;
}
```

### Example 8: Logout Button with Toast

```typescript
import { LogoutButton } from "@/components/auth/LogoutButton";
import { toast } from "react-toastify"; // or your toast library

export function NavBar() {
  return (
    <nav>
      <LogoutButton
        onLogoutSuccess={() => {
          toast.success("Logged out successfully");
        }}
        onLogoutError={(error) => {
          toast.error(`Logout failed: ${error}`);
        }}
      >
        Logout
      </LogoutButton>
    </nav>
  );
}
```

### Example 9: Multiple Logout Options

```typescript
import {
  LogoutButton,
  LogoutAllButton,
  QuickLogoutButton,
} from "@/components/auth/LogoutButton";

export function LogoutOptions() {
  return (
    <div className="logout-options">
      <h3>Logout Options</h3>

      <div className="button-group">
        <QuickLogoutButton>
          Quick Logout
        </QuickLogoutButton>

        <LogoutButton options={{ confirm: true }}>
          Logout with Confirmation
        </LogoutButton>

        <LogoutAllButton>
          Logout from All Devices
        </LogoutAllButton>
      </div>
    </div>
  );
}
```

### Example 10: Standalone Logout Function

```typescript
import { logoutUser, logoutAllDevices } from "@/hooks/useLogout";

// In a utility function or event handler
export async function handleEmergencyLogout() {
  try {
    await logoutAllDevices();
    console.log("Emergency logout successful");
  } catch (error) {
    console.error("Emergency logout failed:", error);
  }
}

// In a server action or API handler
export async function serverLogout() {
  await logoutUser({
    revokeAll: true,
    redirectTo: "/",
  });
}
```

## Best Practices

### 1. Always Show Confirmation for Logout All

```typescript
// ✅ Good - with confirmation
<LogoutAllButton>Logout from All Devices</LogoutAllButton>

// ❌ Bad - no confirmation
<LogoutButton options={{ revokeAll: true }}>
  Logout All
</LogoutButton>
```

### 2. Handle Errors Gracefully

```typescript
// ✅ Good - handle errors
<LogoutButton
  onLogoutError={(error) => {
    console.error(error);
    alert("Failed to logout. Please try again.");
  }}
>
  Logout
</LogoutButton>
```

### 3. Clear Local Data on Logout

```typescript
const { logout } = useLogout();

const handleLogout = async () => {
  // Clear local storage
  localStorage.clear();
  sessionStorage.clear();

  // Clear any cached data
  clearCache();

  // Perform logout
  await logout();
};
```

### 4. Provide Feedback to User

```typescript
// ✅ Good - show loading state
<LogoutButton showLoading={true} loadingText="Signing out...">
  Logout
</LogoutButton>

// ✅ Good - show success message
<LogoutButton
  onLogoutSuccess={() => toast.success("Logged out successfully")}
>
  Logout
</LogoutButton>
```

### 5. Use Appropriate Component

```typescript
// In navigation bar
<LogoutLink>Sign out</LogoutLink>

// In dropdown menu
<LogoutMenuItem>Logout</LogoutMenuItem>

// Standalone button
<LogoutButton>Logout</LogoutButton>

// Quick action
<QuickLogoutButton />
```

## Troubleshooting

### Issue: Logout tidak redirect

**Solusi:**
```typescript
// Pastikan redirectTo diset
<LogoutButton
  options={{
    redirectTo: "/auth/signin",
  }}
>
  Logout
</LogoutButton>
```

### Issue: Session masih ada setelah logout

**Solusi:**
```typescript
// Clear browser cache dan cookies
// Atau gunakan logout all devices
<LogoutAllButton>Logout from All Devices</LogoutAllButton>
```

### Issue: Error "Not authenticated"

**Solusi:**
```typescript
// User sudah logout atau session expired
// Redirect ke login page
const { logout } = useLogout();

if (error === "Not authenticated") {
  router.push("/auth/signin");
}
```

### Issue: Logout terlalu lama

**Cek:**
1. Network connection
2. Database response time
3. Jumlah sessions yang di-revoke

```typescript
// Monitor logout duration
const start = Date.now();
await logout();
console.log(`Logout took ${Date.now() - start}ms`);
```

## Security Notes

1. **Always revoke sessions on logout** - Mencegah session hijacking
2. **Clear sensitive data** - Remove dari localStorage/sessionStorage
3. **Audit logging** - Track semua logout events
4. **Handle expired sessions** - Auto logout jika session expired
5. **Confirm logout all** - Always confirm sebelum logout dari semua device

## API Reference

### useLogout Hook

```typescript
const {
  logout: (options?: LogoutOptions) => Promise<LogoutResult>,
  logoutCurrent: () => Promise<LogoutResult>,
  logoutAll: () => Promise<LogoutResult>,
  quickLogout: (redirectTo?: string) => Promise<LogoutResult>,
  logoutWithConfirm: (message?: string) => Promise<LogoutResult>,
  isLoggingOut: boolean,
  error: string | null,
} = useLogout();
```

### LogoutOptions

```typescript
interface LogoutOptions {
  revokeAll?: boolean;
  redirectTo?: string;
  callbackUrl?: string;
  confirm?: boolean;
  confirmMessage?: string;
}
```

### LogoutResult

```typescript
interface LogoutResult {
  success: boolean;
  error?: string;
  revokedSessions?: number;
}
```

## Related Documentation

- [Session Management Guide](./SESSION_MANAGEMENT.md)
- [JWT Configuration](./JWT_CONFIGURATION.md)
- [RBAC Guide](./RBAC_GUIDE.md)
- [Type Definitions](./TYPE_DEFINITIONS_SUMMARY.md)

## Examples

Lihat file lengkap dengan 15+ contoh:
- [Logout Examples](./src/components/auth/LogoutExamples.tsx)
