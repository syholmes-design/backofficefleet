#!/usr/bin/env node

/**
 * DIAGNOSTIC HELPER - Mapbox Token Detection Verification
 * 
 * Purpose: Troubleshoot Mapbox token configuration issues in Dispatch route map.
 * Use when the map shows fallback mode despite having a token configured.
 * 
 * Usage: node scripts/test-mapbox-token-detection.mjs
 * 
 * Verifies:
 * - Environment variable availability
 * - .env.local file existence and content
 * - Token format validation
 * - Setup instructions for users
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function testMapboxTokenDetection() {
  console.log(`\n🗺️ MAPBOX TOKEN DETECTION TEST`);
  
  // Test environment variables (simulate browser environment)
  const envVars = {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
  };
  
  console.log(`\n📋 ENVIRONMENT VARIABLES:`);
  Object.entries(envVars).forEach(([key, value]) => {
    const masked = value ? `${value.substring(0, 8)}...` : 'not set';
    console.log(`  ${key}: ${masked}`);
  });
  
  // Test the token detection logic (same as in DispatchRouteMap)
  const mapboxToken = envVars.NEXT_PUBLIC_MAPBOX_TOKEN || envVars.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const tokenSource = envVars.NEXT_PUBLIC_MAPBOX_TOKEN ? 'NEXT_PUBLIC_MAPBOX_TOKEN' : 
                      envVars.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ? 'NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN' : 
                      'none';
  
  console.log(`\n🎯 DETECTION RESULTS:`);
  console.log(`  Token configured: ${Boolean(mapboxToken)}`);
  console.log(`  Token source: ${tokenSource}`);
  console.log(`  Token length: ${mapboxToken ? mapboxToken.length : 0}`);
  
  if (mapboxToken) {
    console.log(`  Token format: ${mapboxToken.startsWith('pk.') ? 'Valid (public)' : 'Invalid format'}`);
  }
  
  // Check .env.local file existence
  const envLocalPath = path.join(ROOT, '.env.local');
  const envLocalExists = fs.existsSync(envLocalPath);
  
  console.log(`\n📁 .env.local FILE:`);
  console.log(`  Exists: ${envLocalExists ? 'YES' : 'NO'}`);
  console.log(`  Path: ${envLocalPath}`);
  
  if (envLocalExists) {
    try {
      const envContent = fs.readFileSync(envLocalPath, 'utf8');
      const hasMapboxToken = envContent.includes('NEXT_PUBLIC_MAPBOX_TOKEN') || 
                           envContent.includes('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN');
      console.log(`  Contains Mapbox token: ${hasMapboxToken ? 'YES' : 'NO'}`);
      
      if (hasMapboxToken) {
        const lines = envContent.split('\n').filter(line => 
          line.includes('NEXT_PUBLIC_MAPBOX_TOKEN') || 
          line.includes('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN')
        );
        console.log(`  Mapbox token lines:`);
        lines.forEach((line, index) => {
          const masked = line.includes('=') ? 
            line.split('=')[0] + '=' + (line.split('=')[1] ? line.split('=')[1].substring(0, 8) + '...' : '') : 
            line;
          console.log(`    ${index + 1}. ${masked}`);
        });
      }
    } catch (error) {
      console.log(`  Error reading .env.local: ${error.message}`);
    }
  }
  
  console.log(`\n📝 INSTRUCTIONS:`);
  if (!mapboxToken) {
    console.log(`  To enable the Mapbox map:`);
    console.log(`  1. Get a Mapbox public token (starts with 'pk.')`);
    console.log(`  2. Add to .env.local:`);
    console.log(`     NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here`);
    console.log(`  3. Restart the development server`);
  } else {
    console.log(`  ✅ Mapbox token is configured and should work!`);
  }
}

testMapboxTokenDetection();
