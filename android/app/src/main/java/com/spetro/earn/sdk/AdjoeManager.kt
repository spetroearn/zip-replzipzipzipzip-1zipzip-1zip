package com.spetro.earn.sdk

import android.app.Activity
import android.content.Context

/**
 * ══════════════════════════════════════════════════════════════════
 *  adjoe Playtime SDK — Remote-Key Manager
 * ══════════════════════════════════════════════════════════════════
 *
 *  HOW IT WORKS (no APK update needed after SDK key approval):
 *  ──────────────────────────────────────────────────────────
 *  1. Admin enters the adjoe SDK key in the Admin Panel → Offerwalls
 *     tab → adjoe row → "SDK Key" field.
 *  2. The Android app fetches the key from /api/offerwalls/config
 *     on every launch.
 *  3. If the key is set AND the adjoe SDK AAR is in the APK,
 *     init() activates adjoe automatically — no code change needed.
 *
 *  HOW TO ADD THE SDK WHEN adjoe APPROVES YOU:
 *  ────────────────────────────────────────────
 *  Step 1 — In android/build.gradle (project-level), add inside allprojects > repositories:
 *      maven { url "https://sdk.adjoe.io/android/sdk" }
 *
 *  Step 2 — In android/app/build.gradle, add inside dependencies:
 *      implementation "io.adjoe:adjoe-sdk:1.4.+"
 *
 *  Step 3 — In android/app/src/main/AndroidManifest.xml, add inside <application>:
 *      <meta-data android:name="io.adjoe.sdk.APP_ID" android:value="\${adjoeAppId}" />
 *    And in defaultConfig in build.gradle:
 *      manifestPlaceholders["adjoeAppId"] = "YOUR_ADJOE_APP_ID"
 *    OR just hardcode the APP_ID in the meta-data directly.
 *
 *  Step 4 — Rebuild APK once → from that point on, just change the
 *            SDK key from the admin panel and adjoe will activate.
 *
 *  NOTE: adjoe Playtime requires your app to be listed on Google Play Store.
 *        TabJoy / TaskWall is web-based — just enter the URL in Admin Panel.
 * ══════════════════════════════════════════════════════════════════
 */
object AdjoeManager {

    private var initialized = false

    /**
     * Returns true if the adjoe SDK AAR is compiled into this APK.
     * Uses ClassNotFoundException — zero crash risk if SDK is missing.
     */
    fun isAvailable(): Boolean = try {
        Class.forName("io.adjoe.sdk.Adjoe")
        true
    } catch (_: ClassNotFoundException) { false }

    /**
     * Initialize adjoe SDK once per app session.
     * Safe to call even without the SDK — returns false if not available.
     *
     * @param context  Application context
     * @param sdkKey   Key from admin panel (fetched from server)
     * @param userId   User's UID for attribution
     */
    fun init(context: Context, sdkKey: String, userId: String = ""): Boolean {
        if (sdkKey.isBlank() || !isAvailable() || initialized) return false
        return try {
            val clazz = Class.forName("io.adjoe.sdk.Adjoe")
            // adjoe.init(context, sdkKey, params, listener)
            val initMethod = clazz.methods.firstOrNull { it.name == "init" } ?: return false
            initMethod.invoke(null, context.applicationContext, sdkKey, null, null)
            initialized = true
            true
        } catch (_: Exception) { false }
    }

    /**
     * Launch adjoe Playtime UI (the "play games & earn" screen).
     * Returns true if SDK launched successfully, false if it should
     * fall back to the web URL.
     *
     * @param activity Current activity
     * @param sdkKey   Key from admin panel
     */
    fun launch(activity: Activity, sdkKey: String): Boolean {
        if (sdkKey.isBlank() || !isAvailable()) return false
        return try {
            val clazz = Class.forName("io.adjoe.sdk.Adjoe")
            val launchMethod = clazz.methods.firstOrNull { it.name == "showDashboard" }
                ?: clazz.methods.firstOrNull { it.name == "launch" }
                ?: return false
            launchMethod.invoke(null, activity)
            true
        } catch (_: Exception) { false }
    }
}
