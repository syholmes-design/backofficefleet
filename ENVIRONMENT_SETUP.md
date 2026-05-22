# Environment Setup for BOF Web Application

## Required Environment Variables

### Mapbox Configuration (Required for Dispatch Route Map)

The Dispatch route map requires a Mapbox public token to display interactive route visualizations.

```bash
# Add to .env.local (do not commit)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_public_mapbox_token_here

# Optional fallback (if you use this variable name instead)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_public_mapbox_token_here
```

#### Getting a Mapbox Token

1. Sign up for a free Mapbox account at [https://mapbox.com](https://mapbox.com)
2. Navigate to your Account page
3. Copy your **public token** (starts with `pk.`)
4. Add it to your `.env.local` file

#### Important Notes

- **Use public tokens only** (start with `pk.`) - never use secret tokens (start with `sk.`)
- **No quotes needed** around the token value
- **Restart the dev server** after adding the token
- **For Vercel deployment**: Add the same variable to Vercel Environment Variables

#### Token Format Examples

✅ **Correct:**
```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ijoic3lob2xtZXMiLCJhIjoiY2xvY2F0aW9uIiwidSI6ImV4YW1wbGUifQ.example
```

❌ **Incorrect:**
```bash
# Quotes not needed
NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ1Ijoic3lob2xtZXMiLCJhIjoiY2xvY2F0aW9uIiwidSI6ImV4YW1wbGUifQ.example"

# Wrong token type (secret token)
NEXT_PUBLIC_MAPBOX_TOKEN=sk.eyJ1Ijoic3lob2xtZXMiLCJhIjoiY2xvY2F0aW9uIiwidSI6ImV4YW1wbGUifQ.example

# Missing NEXT_PUBLIC_ prefix (won't work in browser)
MAPBOX_TOKEN=pk.eyJ1Ijoic3lob2xtZXMiLCJhIjoiY2xvY2F0aW9uIiwidSI6ImV4YW1wbGUifQ.example
```

## Environment Files

### .env.local (Local Development)
- **Purpose**: Local development environment variables
- **Status**: Do NOT commit to version control
- **Location**: Project root
- **Required**: `NEXT_PUBLIC_MAPBOX_TOKEN`

### .env.example (Template)
- **Purpose**: Example environment variables for reference
- **Status**: Should be committed to version control
- **Location**: Project root
- **Contains**: Variable names without values

## Verification

To verify your Mapbox setup:

1. **Check .env.local exists** in project root
2. **Check token format** (starts with `pk.`)
3. **Restart dev server** after configuration
4. **Open browser console** to see token detection logs
5. **Visit `/dispatch`** to verify map loads

### Debug Logs

The dispatch map component logs token detection to browser console:
```
Mapbox token configured: true (source: NEXT_PUBLIC_MAPBOX_TOKEN)
```

### Troubleshooting

If the map still shows fallback mode:

1. **Check browser console** for token detection logs
2. **Verify token format** is correct (starts with `pk.`)
3. **Confirm dev server restart** after adding token
4. **Check token is active** in your Mapbox account
5. **Verify variable name** matches exactly: `NEXT_PUBLIC_MAPBOX_TOKEN`

## Production Deployment

### Vercel

1. Go to Project Settings → Environment Variables
2. Add `NEXT_PUBLIC_MAPBOX_TOKEN` with your public token value
3. Redeploy the application

### Other Platforms

Add the same environment variable to your hosting platform's environment configuration.

## Component Integration

The following components use the Mapbox token:

- `components/dispatch/DispatchRouteMap.tsx` - Main dispatch route map
- `components/LoadRouteMap.tsx` - Individual load route maps

Both components support:
- `NEXT_PUBLIC_MAPBOX_TOKEN` (primary)
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` (fallback)

## Security Notes

- **Never commit** actual token values to version control
- **Use public tokens only** in browser environments
- **Rotate tokens** if compromised or no longer needed
- **Monitor usage** in your Mapbox account dashboard
