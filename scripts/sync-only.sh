#!/usr/bin/env bash
# =============================================================================
#  SPETRO EARN — Quick Sync Script
#  Run this after every frontend change to update the APK content.
#  (Assumes android/ directory already exists from setup-android.sh)
# =============================================================================
set -e

echo "[1/3] Rebuilding React frontend..."
npm run build

echo "[2/3] Re-copying AndroidBridge files..."
JAVA_DIR="android/app/src/main/java/com/spetro/earn"
cp android-bridge/AndroidBridge.java "$JAVA_DIR/AndroidBridge.java"
cp android-bridge/MainActivity.java  "$JAVA_DIR/MainActivity.java"

echo "[3/3] Syncing Capacitor..."
npx cap sync android

echo ""
echo "Sync complete. Run 'cd android && ./gradlew assembleDebug' to rebuild the APK."
