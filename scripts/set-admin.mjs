#!/usr/bin/env node

/**
 * Script to assign admin custom claim ({ admin: true }) to a Firebase Auth user.
 *
 * Usage:
 *   node scripts/set-admin.mjs <user-email>
 *
 * For Firebase Emulator:
 *   FIREBASE_AUTH_EMULATOR_HOST="localhost:9099" node scripts/set-admin.mjs <user-email>
 *
 * For Production Firebase:
 *   GOOGLE_APPLICATION_CREDENTIALS="./serviceAccountKey.json" node scripts/set-admin.mjs <user-email>
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";

const email = process.argv[2];

if (!email) {
  console.error("❌ Please provide an email address.");
  console.error("Usage: node scripts/set-admin.mjs <email>");
  process.exit(1);
}

// Check for service account key in root if running in production mode
let app;
const serviceAccountPath = path.resolve(process.cwd(), "serviceAccountKey.json");

if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.log(`🔌 Connecting to Auth Emulator at ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
  app = initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "aasanevent-dev" });
} else if (fs.existsSync(serviceAccountPath)) {
  console.log("🔑 Using serviceAccountKey.json");
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  app = initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
} else {
  // Try default credentials
  try {
    app = initializeApp();
  } catch (err) {
    console.error("\n❌ Could not find credentials for production Firebase.");
    console.error("To set claims in Production:");
    console.error("1. Download your service account key from Firebase Console:");
    console.error("   Project Settings -> Service Accounts -> Generate New Private Key");
    console.error("2. Save it as 'serviceAccountKey.json' in this project root.");
    console.error("3. Run: node scripts/set-admin.mjs " + email);
    console.error("\nTo set claims in the local Emulator:");
    console.error("Run: npm run set-admin:emulator " + email);
    process.exit(1);
  }
}

const auth = getAuth(app);

async function grantAdminRole() {
  try {
    const user = await auth.getUserByEmail(email.trim());
    const currentClaims = user.customClaims || {};

    await auth.setCustomUserClaims(user.uid, {
      ...currentClaims,
      admin: true,
    });

    console.log(`\n✅ Success! User ${email} (UID: ${user.uid}) now has admin privileges.`);
    console.log("👉 If you are currently signed in, sign out and sign back in to refresh your token claims.\n");
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      console.error(`\n❌ No user found with email: ${email}`);
      console.error("Please ensure the user has signed up first.\n");
    } else {
      console.error("\n❌ Failed to set admin claim:", error.message || error);
    }
    process.exit(1);
  }
}

grantAdminRole();
