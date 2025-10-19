"use client";

/**
 * Example implementations of logout functionality
 * These are example components showing different ways to use the logout system
 */

import {
  LogoutButton,
  LogoutAllButton,
  QuickLogoutButton,
  LogoutLink,
  LogoutMenuItem,
  LogoutWithIcon,
} from "./LogoutButton";
import { useLogout } from "@/hooks/useLogout";

/**
 * Example 1: Simple Logout Button
 */
export function Example1_SimpleLogout() {
  return (
    <div>
      <h3>Simple Logout</h3>
      <LogoutButton>Sign Out</LogoutButton>
    </div>
  );
}

/**
 * Example 2: Logout with Confirmation
 */
export function Example2_LogoutWithConfirmation() {
  return (
    <div>
      <h3>Logout with Confirmation</h3>
      <LogoutButton
        options={{
          confirm: true,
          confirmMessage: "Are you sure you want to logout?",
        }}
      >
        Logout
      </LogoutButton>
    </div>
  );
}

/**
 * Example 3: Logout from All Devices
 */
export function Example3_LogoutAllDevices() {
  return (
    <div>
      <h3>Logout from All Devices</h3>
      <LogoutAllButton>Sign Out from All Devices</LogoutAllButton>
    </div>
  );
}

/**
 * Example 4: Quick Logout (No Confirmation)
 */
export function Example4_QuickLogout() {
  return (
    <div>
      <h3>Quick Logout</h3>
      <QuickLogoutButton>Quick Logout</QuickLogoutButton>
    </div>
  );
}

/**
 * Example 5: Logout Link
 */
export function Example5_LogoutLink() {
  return (
    <div>
      <h3>Logout as Link</h3>
      <LogoutLink>Sign out</LogoutLink>
    </div>
  );
}

/**
 * Example 6: Logout with Custom Redirect
 */
export function Example6_CustomRedirect() {
  return (
    <div>
      <h3>Logout with Custom Redirect</h3>
      <LogoutButton
        options={{
          redirectTo: "/goodbye",
        }}
      >
        Logout
      </LogoutButton>
    </div>
  );
}

/**
 * Example 7: Logout with Callbacks
 */
export function Example7_WithCallbacks() {
  const handleSuccess = () => {
    console.log("Logout successful!");
    alert("You have been logged out");
  };

  const handleError = (error: string) => {
    console.error("Logout failed:", error);
    alert(`Logout failed: ${error}`);
  };

  return (
    <div>
      <h3>Logout with Callbacks</h3>
      <LogoutButton
        onLogoutSuccess={handleSuccess}
        onLogoutError={handleError}
      >
        Logout
      </LogoutButton>
    </div>
  );
}

/**
 * Example 8: Custom Styled Logout Button
 */
export function Example8_CustomStyled() {
  return (
    <div>
      <h3>Custom Styled Button</h3>
      <LogoutButton
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        options={{ confirm: true }}
      >
        Sign Out
      </LogoutButton>
    </div>
  );
}

/**
 * Example 9: Logout in Dropdown Menu
 */
export function Example9_DropdownMenu() {
  return (
    <div>
      <h3>Dropdown Menu</h3>
      <div className="dropdown">
        <button>Account Menu</button>
        <div className="dropdown-content">
          <a href="/profile">Profile</a>
          <a href="/settings">Settings</a>
          <hr />
          <LogoutMenuItem>Logout</LogoutMenuItem>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 10: Logout with Loading State
 */
export function Example10_WithLoading() {
  return (
    <div>
      <h3>With Loading State</h3>
      <LogoutButton
        showLoading={true}
        loadingText="Signing out..."
      >
        Logout
      </LogoutButton>
    </div>
  );
}

/**
 * Example 11: Programmatic Logout
 */
export function Example11_ProgrammaticLogout() {
  const { logout, isLoggingOut, error } = useLogout();

  const handleCustomLogout = async () => {
    // Custom logic before logout
    console.log("Saving user preferences...");

    // Perform logout
    const result = await logout({
      revokeAll: false,
      redirectTo: "/",
    });

    if (result.success) {
      console.log("Logout successful");
    } else {
      console.error("Logout failed:", result.error);
    }
  };

  return (
    <div>
      <h3>Programmatic Logout</h3>
      <button onClick={handleCustomLogout} disabled={isLoggingOut}>
        {isLoggingOut ? "Logging out..." : "Custom Logout"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

/**
 * Example 12: Multiple Logout Options
 */
export function Example12_MultipleOptions() {
  return (
    <div>
      <h3>Multiple Logout Options</h3>
      <div style={{ display: "flex", gap: "1rem", flexDirection: "column" }}>
        <QuickLogoutButton>Quick Logout</QuickLogoutButton>

        <LogoutButton options={{ confirm: true }}>
          Logout with Confirmation
        </LogoutButton>

        <LogoutAllButton>Logout from All Devices</LogoutAllButton>
      </div>
    </div>
  );
}

/**
 * Example 13: Logout with Icon
 */
export function Example13_WithIcon() {
  // You can use any icon library (lucide-react, react-icons, etc.)
  const LogOutIcon = () => <span>🚪</span>;

  return (
    <div>
      <h3>Logout with Icon</h3>
      <LogoutWithIcon icon={<LogOutIcon />}>
        Sign Out
      </LogoutWithIcon>
    </div>
  );
}

/**
 * Example 14: Navigation Bar Logout
 */
export function Example14_NavigationBar() {
  return (
    <nav style={{ display: "flex", justifyContent: "space-between", padding: "1rem", background: "#f0f0f0" }}>
      <div>
        <a href="/">Home</a>
        <a href="/dashboard" style={{ marginLeft: "1rem" }}>Dashboard</a>
      </div>
      <div>
        <LogoutLink>Logout</LogoutLink>
      </div>
    </nav>
  );
}

/**
 * Example 15: User Menu with Logout
 */
export function Example15_UserMenu() {
  const { logout, isLoggingOut } = useLogout();

  return (
    <div className="user-menu">
      <div className="user-info">
        <p>John Doe</p>
        <p>john@example.com</p>
      </div>
      <hr />
      <div className="menu-items">
        <a href="/profile">My Profile</a>
        <a href="/settings">Settings</a>
        <a href="/sessions">Active Sessions</a>
      </div>
      <hr />
      <div style={{ display: "flex", gap: "0.5rem", flexDirection: "column" }}>
        <LogoutButton options={{ confirm: true }}>
          Logout
        </LogoutButton>
        <button
          onClick={() => logout({ revokeAll: true })}
          disabled={isLoggingOut}
          style={{ fontSize: "0.875rem" }}
        >
          Logout from all devices
        </button>
      </div>
    </div>
  );
}

/**
 * All Examples Component
 */
export function AllLogoutExamples() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Logout Functionality Examples</h1>

      <div style={{ display: "grid", gap: "2rem", marginTop: "2rem" }}>
        <Example1_SimpleLogout />
        <Example2_LogoutWithConfirmation />
        <Example3_LogoutAllDevices />
        <Example4_QuickLogout />
        <Example5_LogoutLink />
        <Example6_CustomRedirect />
        <Example7_WithCallbacks />
        <Example8_CustomStyled />
        <Example9_DropdownMenu />
        <Example10_WithLoading />
        <Example11_ProgrammaticLogout />
        <Example12_MultipleOptions />
        <Example13_WithIcon />
        <Example14_NavigationBar />
        <Example15_UserMenu />
      </div>
    </div>
  );
}
