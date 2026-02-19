# Authentication Setup Guide

## 1. Google OAuth Configuration

To enable "Continue with Google" functionality, you must configure the Google provider in your Supabase project.

### Step 1: Enable Google Provider in Supabase
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **Authentication** -> **Providers**.
3. Find **Google** in the list.
4. Toggle the switch to **Enabled**.

### Step 2: Configure Client ID and Secret
You need to obtain these credentials from the Google Cloud Console.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select (or create) your project.
3. Navigate to **APIs & Services** -> **Credentials**.
4. Click **Create Credentials** -> **OAuth client ID**.
5. Select **Web application**.
6. Set the **Authorized redirect URIs** to:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
   
   *(You can find your project URL in Supabase under Settings -> API -> URL)*

7. Copy the **Client ID** and **Client Secret**.
8. Paste them into the Supabase Google Provider settings.
9. Click **Save**.

### Step 3: Allow Redirects
Ensure your application's URL is allowed in Supabase.

1. In Supabase, go to **Authentication** -> **URL Configuration**.
2. Add your local development URL to **Redirect URLs**:
   - `http://localhost:5173` (or your specific local port)
   - `http://localhost:3000` (if applicable)
3. Add your production URL (e.g., `https://your-app.com`).

## 2. Environment Variables

Ensure your local `.env` file contains the correct Supabase credentials:

```bash
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

## 3. Troubleshooting

### Error: "Unsupported provider: provider is not enabled"
- **Cause:** The Google provider toggle is OFF in Supabase.
- **Fix:** Follow Step 1 above to enable it.

### Error: "redirect_uri_mismatch"
- **Cause:** The redirect URI in Google Cloud Console does not match the Supabase callback URL.
- **Fix:** Verify the `https://.../auth/v1/callback` URL in Google Cloud Console matches your Supabase project exactly.

### Sign-in hangs or returns to login page without error
- **Cause:** The `redirectTo` URL (e.g., localhost) is not whitelisted in Supabase.
- **Fix:** Add `http://localhost:5173` to the Redirect URLs in Supabase (Step 3).
