# Remember Me Feature Documentation

## Overview

The "Remember Me" feature allows users to extend their session duration from 1 day (default) to 30 days by checking a checkbox during login.

## Implementation Details

### Session Durations

- **Default (Remember Me unchecked)**: 1 day (86,400 seconds)
- **Remember Me (checked)**: 30 days (2,592,000 seconds)

### How It Works

1. **User Login**:
   - User checks "Remember me for 30 days" checkbox on login form
   - Checkbox state is captured by react-hook-form

2. **Client-Side**:
   - `rememberMe` value is stored in localStorage
   - Value is passed to NextAuth's `signIn()` function
   - Toast message confirms extended session: "You'll stay signed in"

3. **Server-Side**:
   - `authorize()` function receives `rememberMe` credential
   - Value is attached to the returned user object
   - JWT callback stores `rememberMe` in token

4. **Token Expiry**:
   - JWT `exp` (expiry) is set based on `rememberMe` flag
   - Remember Me: `iat + 30 days`
   - Regular: `iat + 1 day`

5. **Token Refresh**:
   - When token is refreshed (after 1 day of activity)
   - Original `rememberMe` preference is maintained
   - New expiry is calculated based on stored preference

### Files Modified

1. **`src/lib/validations/auth.ts`**
   - Added `rememberMe` boolean field to login schema
   - Optional field with default value of `false`

2. **`src/components/ui/checkbox.tsx`** (New)
   - Created reusable Checkbox component
   - Styled with Tailwind CSS
   - Supports disabled state

3. **`src/components/login/LoginForm.tsx`**
   - Added Checkbox for Remember Me
   - Updated form submission to handle `rememberMe`
   - Stores preference in localStorage
   - Passes `rememberMe` to NextAuth signIn

4. **`src/lib/auth-options.ts`**
   - Added `rememberMe` to User and JWT type declarations
   - Captures `rememberMe` from credentials in `authorize()`
   - Sets dynamic token expiry in `jwt()` callback
   - Maintains preference during token refresh
   - Logs `rememberMe` state in audit logs

## Usage

### User Experience

```
┌─────────────────────────────────────┐
│  Email: user@example.com            │
│  Password: ********                 │
│                                     │
│  ☑ Remember me for 30 days          │
│                                     │
│  [Sign in]                          │
└─────────────────────────────────────┘
```

**Unchecked (Default)**:
- Session expires after 1 day of inactivity
- User must log in again after 1 day

**Checked**:
- Session expires after 30 days of inactivity
- User stays logged in for 30 days
- Session is automatically refreshed on activity

### For Developers

#### Check Remember Me Status

```typescript
import { getToken } from "next-auth/jwt"

const token = await getToken({ req })
const rememberMe = token?.rememberMe // boolean
const expiresAt = token?.exp // Unix timestamp
```

#### Manually Set Remember Me

Not recommended, but possible:

```typescript
// In a server action or API route
await update({
  rememberMe: true,
})
```

## Security Considerations

1. **HttpOnly Cookies**:
   - Session token is stored in httpOnly cookie
   - Not accessible via JavaScript
   - Protected from XSS attacks

2. **Secure Flag**:
   - Enabled in production
   - Cookie only sent over HTTPS

3. **SameSite Protection**:
   - Set to "lax"
   - Protection against CSRF attacks

4. **Token Rotation**:
   - Token is refreshed daily when user is active
   - Fresh user data loaded from database
   - Inactive users verified on each refresh

5. **Account Status Validation**:
   - User's `isActive` status checked on token refresh
   - Deleted accounts immediately invalidated
   - Locked accounts cannot create new sessions

## Testing

### Test Remember Me Checked

1. Go to `/auth/signin`
2. Enter valid credentials
3. Check "Remember me for 30 days"
4. Click "Sign in"
5. Verify success toast shows: "You'll stay signed in"
6. Check browser cookies - token should have 30-day expiry
7. Close browser and reopen after 2 days
8. User should still be logged in

### Test Remember Me Unchecked

1. Go to `/auth/signin`
2. Enter valid credentials
3. Leave "Remember me" unchecked
4. Click "Sign in"
5. Verify success toast shows: "Welcome back!"
6. Check browser cookies - token should have 1-day expiry
7. Close browser and reopen after 2 days
8. User should be logged out

### Test in Browser DevTools

```javascript
// Check localStorage
localStorage.getItem('rememberMe') // "true" or null

// Check session cookie
document.cookie
  .split('; ')
  .find(row => row.startsWith('next-auth.session-token'))
```

### Test Token Expiry

```typescript
// In API route or server component
import { getToken } from "next-auth/jwt"

const token = await getToken({ req })

console.log({
  rememberMe: token?.rememberMe,
  issuedAt: new Date(token.iat * 1000).toISOString(),
  expiresAt: new Date(token.exp * 1000).toISOString(),
  timeRemaining: (token.exp - Date.now() / 1000) / 86400, // days
})
```

## Troubleshooting

### Remember Me not working

**Problem**: Session still expires after 1 day even when Remember Me is checked

**Solutions**:
1. Check browser console for errors
2. Verify `rememberMe` in token:
   ```typescript
   const token = await getToken({ req })
   console.log(token?.rememberMe)
   ```
3. Clear browser cookies and try again
4. Check NextAuth secret is set in `.env`

### Session expires immediately

**Problem**: User is logged out right after login

**Possible causes**:
1. NextAuth secret mismatch
2. Clock skew between server and client
3. Account is inactive in database
4. Cookie settings incompatible with browser

**Solutions**:
1. Verify `NEXTAUTH_SECRET` in `.env`
2. Check server system time
3. Verify user's `isActive` status in database
4. Check browser cookie settings

### Checkbox not clickable

**Problem**: Remember Me checkbox is disabled or not responding

**Solutions**:
1. Check for form validation errors
2. Ensure form is not in loading state
3. Verify checkbox is not disabled in code
4. Check browser console for JavaScript errors

## Configuration

### Environment Variables

```env
# Not required - using hardcoded defaults
# SESSION_SHORT_AGE=86400    # 1 day (default)
# SESSION_MAX_AGE=2592000    # 30 days (default)
```

### Customize Session Durations

Edit `src/lib/auth-options.ts`:

```typescript
// At the top of the file
const SHORT_SESSION_AGE = 86400;    // Change this (in seconds)
const LONG_SESSION_AGE = 2592000;   // Change this (in seconds)
```

### Customize Checkbox Text

Edit `src/components/login/LoginForm.tsx`:

```typescript
<Label htmlFor="rememberMe" ...>
  Remember me for 30 days  {/* Change this */}
</Label>
```

## Audit Logging

Remember Me preference is logged in audit logs:

```json
{
  "userId": "user-id",
  "action": "LOGIN",
  "metadata": {
    "rememberMe": true,
    "timestamp": "2025-10-19T10:30:00.000Z",
    "provider": "credentials"
  }
}
```

## Best Practices

1. **Default to Unchecked**: Remember Me should be opt-in for security
2. **Clear Communication**: Tell users how long they'll stay signed in
3. **Provide Logout**: Always give users a way to end their session
4. **Monitor Sessions**: Track long-lived sessions in audit logs
5. **Educate Users**: Inform users not to use Remember Me on shared devices

## Future Enhancements

Possible improvements:

1. **Device Tracking**: Show list of devices with active sessions
2. **Session Management**: Allow users to revoke sessions
3. **Location Tracking**: Log IP address and location
4. **Security Alerts**: Notify users of new logins
5. **Variable Duration**: Let users choose session length (7, 14, 30 days)
6. **Admin Override**: Allow admins to force session expiry
7. **Suspicious Activity**: Detect and invalidate suspicious sessions

## API Reference

### Types

```typescript
interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean  // Added field
}

interface JWT {
  rememberMe?: boolean  // Added field
  exp?: number          // Dynamic expiry
  // ... other fields
}

interface User {
  rememberMe?: boolean  // Added field
  // ... other fields
}
```

### Constants

```typescript
SHORT_SESSION_AGE: 86400     // 1 day
LONG_SESSION_AGE: 2592000    // 30 days
```

## Related Documentation

- [AUTH_USAGE.md](./AUTH_USAGE.md) - Authentication system guide
- [MIDDLEWARE_GUIDE.md](./MIDDLEWARE_GUIDE.md) - Route protection guide
- [NextAuth.js Docs](https://next-auth.js.org/) - Official NextAuth documentation

---

**Feature Status**: ✅ Implemented and Ready
**Version**: 1.0
**Last Updated**: 2025-10-19
