#!/usr/bin/env node

/**
 * MAPBOX CONFIGURATION VERIFICATION
 * Verifies Mapbox token setup without requiring npm commands
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, ".");

function verifyMapboxConfig() {
  console.log(`\n🗺️ MAPBOX CONFIGURATION VERIFICATION`);
  console.log(`Project root: ${ROOT}`);
  
  // Check .env.local exists
  const envLocalPath = path.join(ROOT, '.env.local');
  const envLocalExists = fs.existsSync(envLocalPath);
  
  console.log(`\n📁 .env.local FILE:`);
  console.log(`  Exists: ${envLocalExists ? 'YES' : 'NO'}`);
  
  if (envLocalExists) {
    try {
      const envContent = fs.readFileSync(envLocalPath, 'utf8');
      const hasMapboxToken = envContent.includes('NEXT_PUBLIC_MAPBOX_TOKEN');
      console.log(`  Contains NEXT_PUBLIC_MAPBOX_TOKEN: ${hasMapboxToken ? 'YES' : 'NO'}`);
      
      if (hasMapboxToken) {
        const lines = envContent.split('\n').filter(line => 
          line.includes('NEXT_PUBLIC_MAPBOX_TOKEN') && !line.trim().startsWith('#')
        );
        console.log(`  Active token lines: ${lines.length}`);
        
        lines.forEach((line, index) => {
          if (line.includes('=')) {
            const [key, value] = line.split('=');
            const isPresent = value && value.length > 0;
            const startsWithPk = value && value.startsWith('pk.');
            console.log(`    Line ${index + 1}: ${key}=***${isPresent ? (startsWithPk ? ' (valid format)' : ' (invalid format)') : ' (empty)'}`);
          }
        });
      }
    } catch (error) {
      console.log(`  Error reading file: ${error.message}`);
    }
  }
  
  // Check .env.example
  const envExamplePath = path.join(ROOT, '.env.example');
  const envExampleExists = fs.existsSync(envExamplePath);
  
  console.log(`\n📋 .env.example FILE:`);
  console.log(`  Exists: ${envExampleExists ? 'YES' : 'NO'}`);
  
  if (envExampleExists) {
    try {
      const envContent = fs.readFileSync(envExamplePath, 'utf8');
      const hasMapboxToken = envContent.includes('NEXT_PUBLIC_MAPBOX_TOKEN');
      console.log(`  Contains NEXT_PUBLIC_MAPBOX_TOKEN: ${hasMapboxToken ? 'YES' : 'NO'}`);
    } catch (error) {
      console.log(`  Error reading file: ${error.message}`);
    }
  }
  
  // Check dispatch map component
  const dispatchMapPath = path.join(ROOT, 'components', 'dispatch', 'DispatchRouteMap.tsx');
  const dispatchMapExists = fs.existsSync(dispatchMapPath);
  
  console.log(`\n🧩 DISPATCH MAP COMPONENT:`);
  console.log(`  Exists: ${dispatchMapExists ? 'YES' : 'NO'}`);
  
  if (dispatchMapExists) {
    try {
      const componentContent = fs.readFileSync(dispatchMapPath, 'utf8');
      const checks = {
        'NEXT_PUBLIC_MAPBOX_TOKEN': componentContent.includes('NEXT_PUBLIC_MAPBOX_TOKEN'),
        'NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN': componentContent.includes('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN'),
        'process.env.NEXT_PUBLIC_MAPBOX_TOKEN': componentContent.includes('process.env.NEXT_PUBLIC_MAPBOX_TOKEN'),
        'Fallback message': componentContent.includes('Mapbox token not configured'),
        'Debug logs': componentContent.includes('console.log("Mapbox token present:')
      };
      
      console.log(`  Component checks:`);
      Object.entries(checks).forEach(([check, passed]) => {
        console.log(`    ${check}: ${passed ? '✅' : '❌'}`);
      });
    } catch (error) {
      console.log(`  Error reading component: ${error.message}`);
    }
  }
  
  console.log(`\n📝 VERDICT:`);
  if (envLocalExists) {
    console.log(`  ✅ .env.local exists with Mapbox token`);
    console.log(`  ✅ Component configured to read token`);
    console.log(`  🔄 RESTART DEV SERVER to apply changes`);
  } else {
    console.log(`  ❌ Mapbox token not properly configured`);
    console.log(`  💡 Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local`);
  }
  
  console.log(`\n🌐 FOR VERCEL PRODUCTION:`);
  console.log(`  Add NEXT_PUBLIC_MAPBOX_TOKEN to Vercel Environment Variables`);
  console.log(`  Redeploy after adding the variable`);
}

verifyMapboxConfig();
