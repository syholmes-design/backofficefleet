# Mapbox Token Setup for Dispatch Route Map

## Overview
The Dispatch route map uses Mapbox GL JS to display interactive route visualizations. A Mapbox public token is required to use the map features.

## Environment Variable

The application supports the following environment variables (in order of priority):

1. `NEXT_PUBLIC_MAPBOX_TOKEN` (preferred)
2. `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` (fallback)

## Setup Instructions

### 1. Get a Mapbox Token
- Sign up for a free Mapbox account at [https://mapbox.com](https://mapbox.com)
- Navigate to your Account page
- Copy your public token (starts with `pk.`)

### 2. Configure .env.local
Add the following line to your `.env.local` file:

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_actual_token_here
```

**Important:**
- No quotes needed around the token
- No trailing spaces
- Token should start with `pk.` (public token)
- Do not use server-only secret tokens (they start with `sk.`)

### 3. Restart Development Server
After adding or changing the token, restart your development server:

```bash
npm run dev
```

## Token Validation

The application will:
- Check for `NEXT_PUBLIC_MAPBOX_TOKEN` first
- Fall back to `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` if needed
- Log the token source to browser console for debugging
- Display a helpful error message if no token is found

## Fallback Mode

If no Mapbox token is configured, the Dispatch page will:
- Display a static SVG route visualization
- Show the message: "Mapbox token not configured. Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local and restart the dev server."
- Continue to function with route data in demo mode

## Troubleshooting

### Token Not Working
1. Verify the token starts with `pk.` (not `sk.`)
2. Check for extra spaces or quotes in `.env.local`
3. Ensure the development server was restarted after adding the token
4. Check browser console for token detection logs

### Map Still Shows Fallback
1. Open browser developer tools
2. Check console for "Mapbox token configured: true" message
3. Verify the token source logged in console
4. Ensure the token is valid and active in your Mapbox account

## Security Notes

- Only use public tokens (`pk.*`) in browser environment
- Never expose secret tokens (`sk.*`) in client-side code
- The `NEXT_PUBLIC_` prefix is required for browser access in Next.js
- Keep your `.env.local` file in `.gitignore` (already configured)

## Token Format Examples

✅ **Correct:**
```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoidXNlcm5hbWUiLCJhIjoiY2xvY2F0aW9uIiwidSI6ImV4YW1wbGUifQ.example
```

❌ **Incorrect:**
```bash
# Quotes not needed
NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ1IjoidXNlcm5hbWUiLCJhIjoiY2xvY2F0aW9uIiwidSI6ImV4YW1wbGUifQ.example"

# Wrong token type (secret token)
NEXT_PUBLIC_MAPBOX_TOKEN=sk.eyJ1IjoidXNlcm5hbWUiLCJhIjoiY2xvY2F0aW9uIiwidSI6ImV4YW1wbGUifQ.example

# Missing NEXT_PUBLIC_ prefix (won't work in browser)
MAPBOX_TOKEN=pk.eyJ1IjoidXNlcm5hbWUiLCJhIjoiY2xvY2F0aW9uIiwidSI6ImV4YW1wbGUifQ.example
```
