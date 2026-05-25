#!/usr/bin/env bash
# =============================================================================
#  Spetro Earn — Debug APK Builder
#  Run this on your LOCAL machine (requires Java 17+, Android Studio, Node 18+)
#  The APK will be at: android/app/build/outputs/apk/debug/app-debug.apk
# =============================================================================
set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

header() { echo -e "\n${CYAN}${BOLD}━━━ $1 ━━━${NC}"; }
ok()     { echo -e "${GREEN}  ✓ $1${NC}"; }
warn()   { echo -e "${YELLOW}  ⚠ $1${NC}"; }
fail()   { echo -e "${RED}  ✗ $1${NC}"; exit 1; }
info()   { echo -e "    $1"; }

echo -e "${CYAN}${BOLD}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║     Spetro Earn — APK Builder        ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"

# ── Step 1: Prerequisites ─────────────────────────────────────────────────────
header "1/6  Checking prerequisites"

command -v node >/dev/null 2>&1 || fail "Node.js not found. Install from https://nodejs.org (v18+)"
NODE_VER=$(node -v); ok "Node.js $NODE_VER"

command -v java >/dev/null 2>&1 || fail "Java not found. Install JDK 17 from https://adoptium.net"
JAVA_VER=$(java -version 2>&1 | head -1); ok "Java: $JAVA_VER"

if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
  fail "ANDROID_HOME not set. Install Android Studio and set:\n    export ANDROID_HOME=\$HOME/Library/Android/sdk  (macOS)\n    export ANDROID_HOME=\$HOME/Android/Sdk           (Linux)"
fi
SDK_PATH="${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
ok "Android SDK: $SDK_PATH"

# ── Step 2: Install npm dependencies ─────────────────────────────────────────
header "2/6  Installing dependencies"
npm install --silent && ok "npm packages ready"

# ── Step 3: Build React frontend ──────────────────────────────────────────────
header "3/6  Building React frontend → server/public/"
npm run build && ok "Frontend built successfully"

# ── Step 4: Capacitor sync ────────────────────────────────────────────────────
header "4/6  Syncing with Capacitor"
npx cap sync android && ok "Capacitor sync complete"

# ── Step 5: Build debug APK ───────────────────────────────────────────────────
header "5/6  Building debug APK with Gradle"

if [ ! -f "android/gradlew" ]; then
  fail "android/gradlew not found. Run 'npx cap add android' first."
fi

chmod +x android/gradlew
cd android
./gradlew assembleDebug --no-daemon --quiet
cd ..
ok "Debug APK built"

# ── Step 6: Report output ─────────────────────────────────────────────────────
header "6/6  Done!"

APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
  APK_SIZE=$(du -sh "$APK_PATH" | cut -f1)
  echo ""
  echo -e "${GREEN}${BOLD}  ✅ APK ready!${NC}"
  echo -e "  ${BOLD}Path:${NC} $(pwd)/$APK_PATH"
  echo -e "  ${BOLD}Size:${NC} $APK_SIZE"
  echo ""
  echo -e "  ${YELLOW}Install on your phone:${NC}"
  echo -e "  1. Copy the APK to your phone"
  echo -e "  2. Enable 'Install unknown apps' in Settings"
  echo -e "  3. Open the APK file to install"
  echo ""
  echo -e "  ${YELLOW}Or install via ADB (phone connected via USB):${NC}"
  echo -e "  adb install -r $APK_PATH"
else
  fail "APK not found at expected path: $APK_PATH"
fi
