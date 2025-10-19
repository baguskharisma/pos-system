"use client";

import { useLogout, type LogoutOptions } from "@/hooks/useLogout";
import { ReactNode, ButtonHTMLAttributes } from "react";

/**
 * LogoutButton Props
 */
interface LogoutButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button text
   * Default: "Logout"
   */
  children?: ReactNode;

  /**
   * Logout options
   */
  options?: LogoutOptions;

  /**
   * Show loading state
   * Default: true
   */
  showLoading?: boolean;

  /**
   * Loading text
   * Default: "Logging out..."
   */
  loadingText?: string;

  /**
   * Callback after successful logout
   */
  onLogoutSuccess?: () => void;

  /**
   * Callback after failed logout
   */
  onLogoutError?: (error: string) => void;
}

/**
 * LogoutButton Component
 *
 * @example
 * <LogoutButton>Sign Out</LogoutButton>
 *
 * @example
 * <LogoutButton options={{ revokeAll: true }}>
 *   Logout from All Devices
 * </LogoutButton>
 *
 * @example
 * <LogoutButton
 *   options={{ confirm: true }}
 *   className="btn btn-danger"
 * >
 *   Logout
 * </LogoutButton>
 */
export function LogoutButton({
  children = "Logout",
  options = {},
  showLoading = true,
  loadingText = "Logging out...",
  onLogoutSuccess,
  onLogoutError,
  disabled,
  className = "",
  ...props
}: LogoutButtonProps) {
  const { logout, isLoggingOut } = useLogout();

  const handleLogout = async () => {
    const result = await logout(options);

    if (result.success) {
      onLogoutSuccess?.();
    } else if (result.error) {
      onLogoutError?.(result.error);
    }
  };

  const isDisabled = disabled || isLoggingOut;
  const buttonText = showLoading && isLoggingOut ? loadingText : children;

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isDisabled}
      className={className}
      {...props}
    >
      {buttonText}
    </button>
  );
}

/**
 * LogoutAllButton Component
 * Logout from all devices
 *
 * @example
 * <LogoutAllButton>Logout from All Devices</LogoutAllButton>
 */
export function LogoutAllButton({
  children = "Logout from All Devices",
  ...props
}: Omit<LogoutButtonProps, "options">) {
  return (
    <LogoutButton
      options={{
        revokeAll: true,
        confirm: true,
        confirmMessage:
          "Are you sure you want to logout from all devices? You will be signed out from all active sessions.",
      }}
      {...props}
    >
      {children}
    </LogoutButton>
  );
}

/**
 * QuickLogoutButton Component
 * Logout without confirmation
 *
 * @example
 * <QuickLogoutButton />
 */
export function QuickLogoutButton({
  children = "Logout",
  ...props
}: LogoutButtonProps) {
  return (
    <LogoutButton options={{ confirm: false }} {...props}>
      {children}
    </LogoutButton>
  );
}

/**
 * LogoutLink Component
 * Styled as a link instead of button
 *
 * @example
 * <LogoutLink>Sign Out</LogoutLink>
 */
export function LogoutLink({
  children = "Logout",
  options = {},
  showLoading = true,
  loadingText = "Logging out...",
  onLogoutSuccess,
  onLogoutError,
  className = "",
  ...props
}: Omit<LogoutButtonProps, "type">) {
  const { logout, isLoggingOut } = useLogout();

  const handleLogout = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    const result = await logout(options);

    if (result.success) {
      onLogoutSuccess?.();
    } else if (result.error) {
      onLogoutError?.(result.error);
    }
  };

  const linkText = showLoading && isLoggingOut ? loadingText : children;

  return (
    <a
      href="#"
      onClick={handleLogout}
      className={className}
      style={{
        cursor: isLoggingOut ? "not-allowed" : "pointer",
        opacity: isLoggingOut ? 0.6 : 1,
      }}
      {...props}
    >
      {linkText}
    </a>
  );
}

/**
 * LogoutMenuItem Component
 * For use in dropdown menus
 *
 * @example
 * <LogoutMenuItem>
 *   <span>Sign Out</span>
 * </LogoutMenuItem>
 */
export function LogoutMenuItem({
  children = "Logout",
  options = {},
  className = "",
  ...props
}: LogoutButtonProps) {
  const { logout, isLoggingOut } = useLogout();

  const handleLogout = async () => {
    await logout(options);
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={className}
      style={{
        width: "100%",
        textAlign: "left",
        cursor: isLoggingOut ? "not-allowed" : "pointer",
      }}
      {...props}
    >
      {isLoggingOut ? "Logging out..." : children}
    </button>
  );
}

/**
 * LogoutWithIcon Component
 * Logout button with icon support
 *
 * @example
 * <LogoutWithIcon icon={<LogOutIcon />}>
 *   Logout
 * </LogoutWithIcon>
 */
export function LogoutWithIcon({
  children = "Logout",
  icon,
  options = {},
  className = "",
  ...props
}: LogoutButtonProps & { icon?: ReactNode }) {
  const { logout, isLoggingOut } = useLogout();

  const handleLogout = async () => {
    await logout(options);
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={className}
      {...props}
    >
      {icon && <span style={{ marginRight: "0.5rem" }}>{icon}</span>}
      {isLoggingOut ? "Logging out..." : children}
    </button>
  );
}

export default LogoutButton;
