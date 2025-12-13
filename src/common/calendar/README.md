# Calendar Module

This module integrates Google Calendar and Microsoft Outlook Calendar. It supports multiple connections per user, one per provider. Use the examples below to generate an authorization code for each provider and then call `POST /calendar/connect` with `provider` and the `authorizationCode`.

## Prerequisites
- Have OAuth apps set up for both providers
  - Google: OAuth 2.0 Client (type: Web)
  - Microsoft: Azure App Registration (v2 endpoints)
- Allowed redirect URI: `https://your-app.example.com/oauth/callback` (adjust to your env)
- Enable the following APIs/permissions:
  - Google: Google Calendar API
  - Microsoft: `Calendars.Read` (and `offline_access` for refresh tokens)

## Google — Get Authorization Code

1. Build the consent URL:
```
https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=YOUR_GOOGLE_CLIENT_ID
  &redirect_uri=https%3A%2F%2Fyour-app.example.com%2Foauth%2Fcallback
  &response_type=code
  &scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.readonly%20openid%20email%20profile
  &access_type=offline
  &include_granted_scopes=true
  &prompt=consent
  &state=optional_state
```
2. Open the URL in a browser, sign in, and approve.
3. Google redirects to your `redirect_uri` with `?code=...&state=...`.
4. Use that `code` in `POST /calendar/connect`:
```
POST /calendar/connect
{
  "provider": "google",
  "authorizationCode": "CODE_FROM_REDIRECT",
  "redirectUri": "https://your-app.example.com/oauth/callback"
}
```

Scopes used:
- `https://www.googleapis.com/auth/calendar.readonly`
- `openid email profile`

## Microsoft — Get Authorization Code

1. Build the consent URL:
```
https://login.microsoftonline.com/common/oauth2/v2.0/authorize
  ?client_id=YOUR_AZURE_APP_CLIENT_ID
  &redirect_uri=https%3A%2F%2Fyour-app.example.com%2Foauth%2Fcallback
  &response_type=code
  &scope=offline_access%20Calendars.Read%20openid%20email%20profile
  &state=optional_state
```
2. Open the URL in a browser, sign in, and approve.
3. Microsoft redirects to your `redirect_uri` with `?code=...&state=...`.
4. Use that `code` in `POST /calendar/connect`:
```
POST /calendar/connect
{
  "provider": "microsoft",
  "authorizationCode": "CODE_FROM_REDIRECT",
  "redirectUri": "https://your-app.example.com/oauth/callback"
}
```

Scopes used:
- `offline_access`
- `Calendars.Read`
- `openid email profile`

## Endpoints Overview

- Connect: `POST /calendar/connect`
  - Body: `{ provider: "google"|"microsoft", authorizationCode: string, redirectUri: string }`
- Disconnect: `DELETE /calendar/:provider/disconnect`
- Status: `GET /calendar/status?provider=optional`
  - Returns array. Without `provider`, returns all statuses; with `provider`, returns just that provider (in an array).
- Sync: `POST /calendar/:provider/sync`
  - Body: `{ startDate?: string, endDate?: string, forceRefresh?: boolean }`
- Events: `GET /calendar/:provider/events`

## Tips
- Ensure your OAuth client’s redirect URI exactly matches the `redirectUri` you send to the backend.
- Use `offline_access` (Microsoft) and `access_type=offline` + `prompt=consent` (Google) to receive refresh tokens.
- If you change scopes or redirect URIs, users may need to re-consent.
