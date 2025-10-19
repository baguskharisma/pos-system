# Permission Changes

## User Creation Restriction

### Summary
**Hanya SUPER_ADMIN yang bisa membuat user baru.** Role ADMIN tidak lagi memiliki permission `USER_CREATE`.

### Alasan Perubahan
Untuk meningkatkan security dan kontrol akses, pembuatan user baru dibatasi hanya untuk SUPER_ADMIN.

### Permission Matrix User Management

| Action | SUPER_ADMIN | ADMIN | CASHIER | STAFF |
|--------|-------------|-------|---------|-------|
| View Users | ✅ | ✅ | ❌ | ❌ |
| **Create Users** | **✅** | **❌** | ❌ | ❌ |
| Update Users | ✅ | ✅ | ❌ | ❌ |
| **Delete Users** | **✅** | **❌** | ❌ | ❌ |

### Apa yang Berubah

#### Sebelumnya:
```typescript
ADMIN: [
  Permission.USER_VIEW,
  Permission.USER_CREATE,  // ✅ ADMIN bisa create
  Permission.USER_UPDATE,
  Permission.USER_DELETE,
]
```

#### Sekarang:
```typescript
ADMIN: [
  Permission.USER_VIEW,
  // Permission.USER_CREATE removed - only SUPER_ADMIN
  Permission.USER_UPDATE,
  // USER_DELETE also removed for security
]
```

### Dampak Perubahan

#### 1. API Endpoint `/api/admin/users` (POST)
- **Sebelumnya**: ADMIN dan SUPER_ADMIN bisa membuat user
- **Sekarang**: Hanya SUPER_ADMIN yang bisa membuat user

```typescript
// Request dengan ADMIN role akan mendapat response:
{
  "error": "Forbidden. Insufficient permissions.",
  "missingPermissions": ["user:create"]
}
```

#### 2. UI Components
Jika menggunakan permission guards:

```typescript
// Button ini TIDAK akan muncul untuk ADMIN
<Can permission={Permission.USER_CREATE}>
  <CreateUserButton />
</Can>

// Atau dengan PermissionGuard
<PermissionGuard permissions={[Permission.USER_CREATE]}>
  <UserForm />
</PermissionGuard>
```

#### 3. Role Hierarchy
- **SUPER_ADMIN** (Level 4): Dapat membuat semua user termasuk ADMIN
- **ADMIN** (Level 3): Dapat melihat, update, dan delete user (kecuali SUPER_ADMIN)
- **CASHIER** (Level 2): Tidak ada akses user management
- **STAFF** (Level 1): Tidak ada akses user management

### Migration Guide

Jika Anda sudah memiliki code yang mengasumsikan ADMIN bisa membuat user:

#### 1. Update UI/Frontend
```typescript
// ❌ BEFORE - Akan error untuk ADMIN
const { can } = usePermissions();
if (can(Permission.USER_CREATE)) {
  // Show create button
}

// ✅ AFTER - Tambah pengecekan role
const { isSuperAdmin } = usePermissions();
if (isSuperAdmin) {
  // Show create button - hanya untuk SUPER_ADMIN
}
```

#### 2. Update API Calls
```typescript
// Frontend harus handle 403 Forbidden
try {
  const response = await fetch('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(userData)
  });

  if (response.status === 403) {
    // ADMIN tidak punya permission
    alert('Only SUPER_ADMIN can create users');
  }
} catch (error) {
  // Handle error
}
```

#### 3. Update Documentation/UI Messages
```typescript
// Informasikan user tentang batasan permission
<Alert>
  <AlertTitle>Permission Required</AlertTitle>
  <AlertDescription>
    Only SUPER_ADMIN can create new users.
    Contact your system administrator if you need to add users.
  </AlertDescription>
</Alert>
```

### Testing

#### Test SUPER_ADMIN dapat membuat user:
```bash
# Login sebagai SUPER_ADMIN
POST /api/auth/signin
{
  "email": "admin@possystem.com",
  "password": "Admin123!"
}

# Buat user baru - HARUS berhasil
POST /api/admin/users
{
  "email": "newuser@example.com",
  "password": "Password123!",
  "name": "New User",
  "role": "CASHIER"
}

# Expected: 201 Created
```

#### Test ADMIN TIDAK dapat membuat user:
```bash
# Login sebagai ADMIN (buat user ADMIN terlebih dahulu)
POST /api/auth/signin
{
  "email": "admin2@possystem.com",
  "password": "Admin123!"
}

# Coba buat user baru - HARUS ditolak
POST /api/admin/users
{
  "email": "newuser@example.com",
  "password": "Password123!",
  "name": "New User",
  "role": "CASHIER"
}

# Expected: 403 Forbidden
{
  "error": "Forbidden. Insufficient permissions.",
  "missingPermissions": ["user:create"]
}
```

### Workaround untuk ADMIN

Jika ADMIN perlu membuat user, mereka harus:

1. **Request ke SUPER_ADMIN** - Minta SUPER_ADMIN untuk membuat user
2. **Self-service portal** - Buat form yang submit request ke SUPER_ADMIN
3. **Temporary elevation** - SUPER_ADMIN bisa temporary upgrade ADMIN ke SUPER_ADMIN (tidak direkomendasikan)

### Security Benefits

1. **Reduced attack surface** - Lebih sedikit user yang bisa membuat akses
2. **Better audit trail** - Semua user creation dilakukan oleh SUPER_ADMIN
3. **Prevent privilege escalation** - ADMIN tidak bisa membuat SUPER_ADMIN baru
4. **Compliance** - Memenuhi requirement untuk restricted user management

### Jika Perlu Mengembalikan Permission

Jika Anda perlu mengembalikan permission USER_CREATE ke ADMIN:

```typescript
// File: src/lib/rbac.ts
ADMIN: [
  Permission.USER_VIEW,
  Permission.USER_CREATE,  // Tambahkan kembali
  Permission.USER_UPDATE,
  Permission.USER_DELETE,
  // ... other permissions
]
```

### Related Files Changed

1. `src/lib/rbac.ts` - Permission configuration
2. `src/app/api/admin/users/route.ts` - API validation
3. `RBAC_GUIDE.md` - Documentation updated
4. `RBAC_SUMMARY.md` - Quick reference updated

### Questions?

Jika ada pertanyaan tentang perubahan permission ini, silakan refer ke:
- [RBAC Guide](./RBAC_GUIDE.md) - Complete documentation
- [RBAC Summary](./RBAC_SUMMARY.md) - Quick reference
