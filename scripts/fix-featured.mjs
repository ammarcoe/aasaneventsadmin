#!/usr/bin/env node

/**
 * Script to normalize the isFeatured field across all events in Firestore.
 * Ensures isFeatured is strictly a boolean (true / false), never a string ("true" / "false") or undefined.
 *
 * Usage:
 *   node scripts/fix-featured.mjs
 *   FIRESTORE_EMULATOR_HOST="localhost:8080" node scripts/fix-featured.mjs
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

let app;
const serviceAccountPath = path.resolve(process.cwd(), "serviceAccountKey.json");

if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log(`🔌 Connecting to Firestore Emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
  app = initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "eventabad" });
} else if (fs.existsSync(serviceAccountPath)) {
  console.log("🔑 Using serviceAccountKey.json");
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  app = initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id || "eventabad",
  });
} else {
  try {
    app = initializeApp({ projectId: "eventabad" });
  } catch (err) {
    console.error("❌ Failed to initialize firebase-admin:", err.message);
    process.exit(1);
  }
}

const db = getFirestore(app);

async function fixFeatured() {
  console.log("🔍 Scanning events collection for non-boolean isFeatured values...");
  const snapshot = await db.collection("events").get();
  console.log(`Found ${snapshot.docs.length} total events.`);

  let fixedCount = 0;
  let booleanCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const rawFeatured = data.isFeatured;

    // Check if it's strictly a boolean
    if (typeof rawFeatured === "boolean") {
      booleanCount++;
      continue;
    }

    // Determine intended boolean
    const normalized =
      rawFeatured === true ||
      rawFeatured === "true" ||
      rawFeatured === 1 ||
      rawFeatured === "1";

    await doc.ref.update({
      isFeatured: normalized,
      updatedAt: new Date(),
    });
    console.log(`Updated event ${doc.id}: ${JSON.stringify(rawFeatured)} -> ${normalized}`);
    fixedCount++;
  }

  console.log(`\n✅ Done! Fixed: ${fixedCount} events, Already valid: ${booleanCount} events.`);
}

fixFeatured().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
