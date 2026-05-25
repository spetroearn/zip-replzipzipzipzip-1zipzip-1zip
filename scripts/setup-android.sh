#!/usr/bin/env bash
# =============================================================================
#  SPETRO EARN — Android APK Setup Script
#  Run this on your LOCAL machine (requires Java 17+, Android SDK, Node 18+)
# =============================================================================
set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "============================================"
echo "  Spetro Earn — Android Build Setup"
echo "============================================"
echo -e "${NC}"

# ── Step 1: Check prerequisites ───────────────────────────────────────────────
echo -e "${YELLOW}[1/7] Checking prerequisites...${NC}"

if ! command -v node &>/dev/null; then
  echo -e "${RED}ERROR: Node.js not found. Install Node 18+ from https://nodejs.org${NC}"; exit 1
fi
if ! command -v java &>/dev/null; then
  echo -e "${RED}ERROR: Java not found. Install JDK 17 from https://adoptium.net${NC}"; exit 1
fi
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
  echo -e "${RED}ERROR: ANDROID_HOME is not set. Install Android Studio and set the env var.${NC}"; exit 1
fi
echo -e "${GREEN}  Prerequisites OK${NC}"

# ── Step 2: Install dependencies ──────────────────────────────────────────────
echo -e "${YELLOW}[2/7] Installing npm dependencies...${NC}"
npm install

# ── Step 3: Build the React frontend ──────────────────────────────────────────
echo -e "${YELLOW}[3/7] Building React frontend → server/public/...${NC}"
npm run build
echo -e "${GREEN}  Build complete${NC}"

# ── Step 4: Add Capacitor Android platform ────────────────────────────────────
echo -e "${YELLOW}[4/7] Adding Capacitor Android platform...${NC}"
if [ -d "android" ]; then
  echo "  android/ directory already exists — running cap sync instead"
  npx cap sync android
else
  npm install @capacitor/android --save-dev
  npx cap add android
  echo -e "${GREEN}  Android platform added${NC}"
fi

# ── Step 5: Inject AndroidBridge source files ─────────────────────────────────
echo -e "${YELLOW}[5/7] Copying AndroidBridge source files...${NC}"

JAVA_DIR="android/app/src/main/java/com/spetro/earn"
mkdir -p "$JAVA_DIR"

cp android-bridge/AndroidBridge.java "$JAVA_DIR/AndroidBridge.java"
cp android-bridge/MainActivity.java  "$JAVA_DIR/MainActivity.java"
echo -e "${GREEN}  AndroidBridge.java  → ${JAVA_DIR}/${NC}"
echo -e "${GREEN}  MainActivity.java   → ${JAVA_DIR}/${NC}"

# Copy strings.xml
STRINGS_DIR="android/app/src/main/res/values"
mkdir -p "$STRINGS_DIR"
cp android-bridge/strings.xml "$STRINGS_DIR/strings.xml"
echo -e "${GREEN}  strings.xml         → ${STRINGS_DIR}/${NC}"

# ── Step 6: Sync Capacitor ────────────────────────────────────────────────────
echo -e "${YELLOW}[6/7] Syncing Capacitor...${NC}"
npx cap sync android
echo -e "${GREEN}  Capacitor synced${NC}"

# ── Step 7: Build debug APK ───────────────────────────────────────────────────
echo -e "${YELLOW}[7/7] Building debug APK...${NC}"
cd android && ./gradlew assembleDebug --stacktrace
cd ..

APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
  echo -e "${GREEN}"
  echo "============================================"
  echo "  APK BUILD SUCCESSFUL"
  echo "  Output: ${APK_PATH}"
  echo "============================================"
  echo -e "${NC}"
else
  echo -e "${RED}APK not found at expected path. Check Gradle output above.${NC}"
  exit 1
fi

echo ""
echo -e "${CYAN}NEXT STEPS:${NC}"
echo "  1. Transfer ${APK_PATH} to your Android device"
echo "  2. Install it: adb install ${APK_PATH}"
echo "  3. The Adjoe card will activate automatically inside the app"
echo ""
echo -e "${YELLOW}To build a RELEASE APK (signed):${NC}"
echo "  See android-bridge/build_gradle_additions.txt for signing config"
echo "  Then run: cd android && ./gradlew assembleRelease"
echo ""
