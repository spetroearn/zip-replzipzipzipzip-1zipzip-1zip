package com.spetro.earn;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.Settings;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

import org.json.JSONObject;

/**
 * AndroidBridge — JavaScript Interface for Spetro Earn WebView
 *
 * This class is injected into the Capacitor WebView as "AndroidBridge" so that
 * JavaScript running inside the app can call native Android features.
 *
 * In JavaScript (client/src/pages/Offerwalls.jsx):
 *   window.AndroidBridge.isNativeApp()       → "true"
 *   window.AndroidBridge.startAdjoeSDK(...)  → initialises Adjoe Playtime SDK
 *   window.AndroidBridge.openAdjoeOfferwalls() → launches Adjoe UI
 *
 * INSTALLATION:
 *   Copy this file to:
 *   android/app/src/main/java/com/spetro/earn/AndroidBridge.java
 */
public class AndroidBridge {

    private static final String TAG       = "AndroidBridge";
    private static final String PREFS_KEY = "SpetroPrefs";

    private final Context context;

    public AndroidBridge(Context context) {
        this.context = context;
    }

    // ── Platform detection ────────────────────────────────────────────────────
    // The frontend checks: typeof window.AndroidBridge !== 'undefined'
    // to determine if it is running inside the APK.

    @JavascriptInterface
    public String getPlatform() {
        return "android";
    }

    @JavascriptInterface
    public String getAppVersion() {
        try {
            android.content.pm.PackageInfo info =
                context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
            return info.versionName;
        } catch (Exception e) {
            return "1.0.0";
        }
    }

    // ── Device identity ───────────────────────────────────────────────────────

    @JavascriptInterface
    public String getAndroidId() {
        return Settings.Secure.getString(
            context.getContentResolver(), Settings.Secure.ANDROID_ID
        );
    }

    @JavascriptInterface
    public String getDeviceInfo() {
        try {
            JSONObject info = new JSONObject();
            info.put("manufacturer", Build.MANUFACTURER);
            info.put("model",        Build.MODEL);
            info.put("brand",        Build.BRAND);
            info.put("osVersion",    Build.VERSION.RELEASE);
            info.put("sdkVersion",   Build.VERSION.SDK_INT);
            info.put("androidId",    getAndroidId());
            return info.toString();
        } catch (Exception e) {
            Log.e(TAG, "getDeviceInfo failed: " + e.getMessage());
            return "{}";
        }
    }

    // ── User ID persistence ───────────────────────────────────────────────────
    // The WebView calls setUserId() right after login so the native side
    // always has the current Spetro user ID for Adjoe SDK initialisation.

    @JavascriptInterface
    public void setUserId(String userId) {
        SharedPreferences prefs =
            context.getSharedPreferences(PREFS_KEY, Context.MODE_PRIVATE);
        prefs.edit().putString("userId", userId).apply();
        Log.d(TAG, "setUserId: " + userId);
    }

    @JavascriptInterface
    public String getUserId() {
        SharedPreferences prefs =
            context.getSharedPreferences(PREFS_KEY, Context.MODE_PRIVATE);
        return prefs.getString("userId", "");
    }

    // ── Adjoe Playtime SDK ────────────────────────────────────────────────────
    // Requires: implementation 'io.adjoe:sdk:2.+' in android/app/build.gradle
    //
    // Adjoe documentation: https://docs.adjoe.io/android-sdk
    //
    // 1. Get your Adjoe App-Hash from the Adjoe publisher dashboard.
    // 2. Set it in the Replit secret: ADJOE_APP_HASH
    // 3. Pass it to startAdjoeSDK() from JavaScript after the user logs in.

    @JavascriptInterface
    public void startAdjoeSDK(String userId, String adjoeAppHash) {
        Log.d(TAG, "startAdjoeSDK → userId=" + userId + ", appHash=" + adjoeAppHash);

        // ─── Uncomment when Adjoe SDK is added to build.gradle: ───────────────
        //
        // AdjoeParams params = new AdjoeParams.Builder()
        //     .setAppHash(adjoeAppHash)
        //     .setUserId(userId)
        //     .build();
        //
        // Adjoe.init(context, params, new AdjoeInitializationListener() {
        //     @Override
        //     public void onInitFinished() {
        //         Log.d(TAG, "Adjoe SDK initialised successfully");
        //         Adjoe.launch(context);
        //     }
        //     @Override
        //     public void onInitError(Exception e) {
        //         Log.e(TAG, "Adjoe SDK init error: " + e.getMessage());
        //     }
        // });
        // ─────────────────────────────────────────────────────────────────────

        // Persist userId for future calls
        setUserId(userId);
    }

    @JavascriptInterface
    public void openAdjoeOfferwalls() {
        Log.d(TAG, "openAdjoeOfferwalls called");

        // ─── Uncomment when Adjoe SDK is added to build.gradle: ───────────────
        //
        // ((android.app.Activity) context).runOnUiThread(() -> {
        //     Adjoe.launch((android.app.Activity) context);
        // });
        // ─────────────────────────────────────────────────────────────────────
    }

    @JavascriptInterface
    public String getAdjoeStatus() {
        // Returns "ready", "not_initialized", or "error"
        // ─── Uncomment when Adjoe SDK is active: ──────────────────────────────
        // return Adjoe.isInitialized() ? "ready" : "not_initialized";
        // ─────────────────────────────────────────────────────────────────────
        return "not_initialized";
    }

    // ── Native notifications ──────────────────────────────────────────────────
    private static final String NOTIF_CHANNEL_ID = "spetro_alerts";

    private void ensureNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager)
                context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm.getNotificationChannel(NOTIF_CHANNEL_ID) == null) {
                NotificationChannel ch = new NotificationChannel(
                    NOTIF_CHANNEL_ID, "Spetro Earn Alerts",
                    NotificationManager.IMPORTANCE_HIGH
                );
                ch.setDescription("Coin credits and offer alerts");
                nm.createNotificationChannel(ch);
            }
        }
    }

    @JavascriptInterface
    public boolean isNotificationGranted() {
        if (Build.VERSION.SDK_INT >= 33) {
            return context.checkSelfPermission("android.permission.POST_NOTIFICATIONS")
                == PackageManager.PERMISSION_GRANTED;
        }
        return true; // Android < 13: permission always granted
    }

    @JavascriptInterface
    public void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33) {
            ((android.app.Activity) context).runOnUiThread(() ->
                androidx.core.app.ActivityCompat.requestPermissions(
                    (android.app.Activity) context,
                    new String[]{"android.permission.POST_NOTIFICATIONS"},
                    1001
                )
            );
        }
    }

    @JavascriptInterface
    public void showNotification(String title, String body) {
        if (!isNotificationGranted()) {
            Log.w(TAG, "showNotification: permission not granted");
            return;
        }
        ensureNotificationChannel();
        ((android.app.Activity) context).runOnUiThread(() -> {
            try {
                Intent tapIntent = new Intent(context, MainActivity.class);
                tapIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
                PendingIntent pi = PendingIntent.getActivity(
                    context, 0, tapIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
                android.app.Notification.Builder builder =
                    new android.app.Notification.Builder(context, NOTIF_CHANNEL_ID)
                        .setContentTitle(title)
                        .setContentText(body)
                        .setSmallIcon(android.R.drawable.ic_dialog_info)
                        .setContentIntent(pi)
                        .setAutoCancel(true);
                NotificationManager nm = (NotificationManager)
                    context.getSystemService(Context.NOTIFICATION_SERVICE);
                nm.notify((int)(System.currentTimeMillis() % 100000), builder.build());
                Log.d(TAG, "showNotification: " + title);
            } catch (Exception e) {
                Log.e(TAG, "showNotification error: " + e.getMessage());
            }
        });
    }

    // ── External URL / offer link opener ─────────────────────────────────────
    // Opens a URL via Android Intent so that:
    //   • play.google.com/store/* → opens Play Store app natively
    //   • market://*              → opens Play Store app natively
    //   • other URLs              → opens default browser
    // This avoids Chrome hijacking offer links out of the app.

    @JavascriptInterface
    public void openUrl(String url) {
        try {
            Uri uri = Uri.parse(url);
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            Log.d(TAG, "openUrl: " + url);
        } catch (Exception e) {
            Log.e(TAG, "openUrl failed for " + url + ": " + e.getMessage());
        }
    }

    // ── UI helpers ────────────────────────────────────────────────────────────

    @JavascriptInterface
    public void showToast(String message) {
        ((android.app.Activity) context).runOnUiThread(() ->
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
        );
    }

    @JavascriptInterface
    public void vibrate(int milliseconds) {
        Vibrator vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator == null || !vibrator.hasVibrator()) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(milliseconds, VibrationEffect.DEFAULT_AMPLITUDE));
        } else {
            //noinspection deprecation
            vibrator.vibrate(milliseconds);
        }
    }
}
