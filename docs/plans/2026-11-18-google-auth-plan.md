# Plan: Add Google Authentication

## Overview
Add Google OAuth as an alternative sign-in method alongside the existing email magic link. Users can choose either method from the AuthModal.

## Changes Required

### 1. Supabase Configuration (`supabase/config.toml`)
- Update `site_url` from `http://localhost:5173` to `http://localhost:3000` (matches Vite dev server)
- Update `additional_redirect_urls` to include `http://localhost:3000`
- Add `[auth.external.google]` section with `enabled = true`
- Add placeholder `client_id` and `client_secret` (user must replace with real Google OAuth credentials)

### 2. Auth Hook (`src/hooks/useAuth.ts`)
- Add `signInWithGoogle()` function using `supabase.auth.signInWithOAuth({ provider: 'google' })`
- Redirect to `window.location.origin` after OAuth completes
- Export `signInWithGoogle` alongside existing `signIn` and `signOut`

### 3. Auth Modal (`src/components/Auth/AuthModal.tsx`)
- Add "Sign in with Google" button at the top (Google-branded, white bg, Google logo)
- Add a divider ("or") between Google button and email form
- Keep existing email magic link flow below the divider
- Handle loading/error states for Google sign-in separately

### 4. No new routes needed
- Supabase handles OAuth callback at `/auth/v1/callback` (on the Supabase API, not the frontend)
- After OAuth, Supabase redirects back to the app's `redirectTo` URL
- Existing `onAuthStateChange` listener picks up the new session automatically

### 5. User Setup Required (outside code)
The user must:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or use existing)
3. Enable "Google+ API" / "Google Identity"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Authorized redirect URIs: `http://localhost:54321/auth/v1/callback` (local) and `https://<project-ref>.supabase.co/auth/v1/callback` (production)
7. Copy Client ID and Client Secret
8. Paste into `supabase/config.toml` under `[auth.external.google]`

### 6. Edge Cases
- Google accounts always have an email, so the `User` type's non-null `email` is safe
- If user cancels Google consent, `signInWithOAuth` returns an error — handle gracefully
- OAuth state is managed by Supabase; no manual token handling needed
- Sign-out works the same way (clears session regardless of auth method)

## Files to Modify
| File | Change |
|---|---|
| `supabase/config.toml` | Add Google OAuth config, fix site_url |
| `src/hooks/useAuth.ts` | Add `signInWithGoogle` |
| `src/components/Auth/AuthModal.tsx` | Add Google button + divider |

## Implementation Order
1. Update config.toml (Google OAuth + correct site_url)
2. Add signInWithGoogle to useAuth
3. Update AuthModal with Google button
4. Test locally (requires Google OAuth credentials from user)
5. Commit

## What's NOT changing
- Database schema (no changes needed)
- RLS policies (work the same for OAuth users)
- Track/playlist logic (auth method doesn't matter)
- Protected routes (same behavior)