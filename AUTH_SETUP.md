# Authentication Setup Guide

This document outlines the necessary steps to configure authentication for the Street Politics Feed application using Supabase.

## 1. Supabase Project Configuration

### General Settings

- Ensure your Supabase project is created and active.
- Note your `Project URL` and `Anon Key`. These will be used in your `.env` file.

### Authentication Providers

#### Email / Password

- Enable "Email" provider in `Authentication > Providers`.
- Configure "Confirm email" settings based on your preference (recommended: enabled for production).

#### Google (Optional)

- Enable "Google" provider.
- Obtain `Client ID` and `Client Secret` from Google Cloud Console.
- Add the Supabase callback URL to your Google Cloud Console "Authorized redirect URIs":
  `https://<your-project-ref>.supabase.co/auth/v1/callback`

## 2. Environment Variables

Create or update your `.env` file with the following keys:

```bash
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

## 3. Redirect URLs

Configure the allowed redirect URLs in `Authentication > URL Configuration`.

- **Site URL**: `http://localhost:8080` (for local development)
- **Additional Redirect URLs**:
  - `https://<your-production-domain>.com`
  - `http://localhost:8080/auth/callback` (if using a dedicated callback route)
  - `http://localhost:8080/reset-password` (for password reset flows)

## 4. Database Schema & RLS Policies

Ensure the following tables exist and have Row Level Security (RLS) enabled.

### `profiles` Table

- **Columns**: `id` (uuid, references auth.users), `username`, `full_name`, `avatar_url`, `updated_at`.
- **RLS Policies**:
  - `Public profiles are viewable by everyone`: `SELECT` for `anon` and `authenticated`.
  - `Users can insert their own profile`: `INSERT` for `authenticated` where `auth.uid() = id`.
  - `Users can update own profile`: `UPDATE` for `authenticated` where `auth.uid() = id`.

### `slot_entitlements` Table

- **Columns**: `id`, `user_id`, `slot_id`, `is_active`, `expires_at`.
- **RLS Policies**:
  - `Users can view own entitlements`: `SELECT` for `authenticated` where `auth.uid() = user_id`.
  - `Service role only can insert/update`: No public write access.

## 5. Client-Side Integration

The application uses a custom `AuthProvider` in `src/hooks/useAuth.tsx`.

### Key Features

- **Session Persistence**: Automatically restores session from local storage.
- **State Management**: Exposes `session`, `user`, `status`, and `appReady`.
- **Debug Mode**: Logs authentication state transitions for troubleshooting.

### Usage

Wrap your application with `AuthProvider` in `src/App.tsx`:

```tsx
import { AuthProvider } from "@/hooks/useAuth";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes />
      </Router>
    </AuthProvider>
  );
}
```

Access auth state in components:

```tsx
import { useAuth } from "@/hooks/useAuth";

function MyComponent() {
  const { user, status, appReady } = useAuth();
  
  if (!appReady) return <Loading />;
  if (status === "unauthenticated") return <LoginButton />;
  
  return <div>Welcome, {user.email}</div>;
}
```

## 6. Troubleshooting

- **"Unsupported provider" Error**: Ensure the provider is enabled in Supabase dashboard.
- **Session not persisting**: Check browser cookies and local storage settings.
- **Infinite Loading**: Verify `appReady` state is being used to gate data fetching queries.
