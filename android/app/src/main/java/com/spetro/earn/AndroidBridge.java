package com.spetro.earn;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.Settings;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

import androidx.browser.customtabs.CustomTabColorSchemeParams;
import androidx.browser.customtabs.CustomTabsIntent;

import org.json.JSONObject;

/**
 * AndroidBridge — JavaScript Interface for Spetro Earn WebView
 *
 * Injected as window.AndroidBridge. Key methods:
 *   openCustomTab(url) — opens URL in Chrome Custom Tabs (in-app browser).
 *                        Used for Google OAuth: after OAuth completes Chrome
 *                        fires spetroearn://auth-complete → MainActivity closes
 *                        the Custom Tab and exchanges the token for a session.
 *   openUrl(url)       — plain Android Intent for Play Store / external links.
 */
public class AndroidBridge {

    private static final String TAG       = "AndroidBridge";
    private static final String PREFS_KEY = "SpetroPrefs";

    private final Context context;

    public AndroidBridge(Context context) {
        this.context = context;
    }

    // ── Platform detection ────────────────────────────────────────────────────

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

    @JavascriptInterface
    public void startAdjoeSDK(String userId, String adjoeAppHash) {
        Log.d(TAG, "startAdjoeSDK → userId=" + userId);
        setUserId(userId);
    }

    @JavascriptInterface
    public void openAdjoeOfferwalls() {
        Log.d(TAG, "openAdjoeOfferwalls called");
    }

    @JavascriptInterface
    public String getAdjoeStatus() {
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
        return true;
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

    // ── Chrome Custom Tabs — in-app browser for Google OAuth ─────────────────
    //
    // Opens the URL in a Chrome Custom Tab that slides up OVER the app.
    // After Google OAuth completes the server redirects to:
    //   spetroearn://auth-complete?token=<one-time-token>
    // Chrome Custom Tabs detects the custom scheme, fires an Intent, and
    // automatically closes itself — MainActivity.onNewIntent() picks it up,
    // loads /api/auth/app-signin?token=... in the WebView, and the user is
    // logged in without ever leaving the app.

    @JavascriptInterface
    public void openCustomTab(String url) {
        ((android.app.Activity) context).runOnUiThread(() -> {
            try {
                CustomTabColorSchemeParams darkParams = new CustomTabColorSchemeParams.Builder()
                    .setToolbarColor(Color.parseColor("#0f172a"))
                    .build();
                CustomTabColorSchemeParams lightParams = new CustomTabColorSchemeParams.Builder()
                    .setToolbarColor(Color.parseColor("#1e293b"))
                    .build();

                CustomTabsIntent customTabsIntent = new CustomTabsIntent.Builder()
                    .setColorScheme(CustomTabsIntent.COLOR_SCHEME_DARK)
                    .setColorSchemeParams(CustomTabsIntent.COLOR_SCHEME_DARK,  darkParams)
                    .setColorSchemeParams(CustomTabsIntent.COLOR_SCHEME_LIGHT, lightParams)
                    .setShowTitle(true)
                    .build();

                customTabsIntent.launchUrl(context, Uri.parse(url));
                Log.d(TAG, "openCustomTab: " + url);
            } catch (Exception e) {
                Log.e(TAG, "openCustomTab failed: " + e.getMessage());
                // Fallback to plain intent
                openUrl(url);
            }
        });
    }

    // ── External URL / offer link opener ─────────────────────────────────────
    // Opens via Android Intent:
    //   play.google.com / market:// → Play Store
    //   everything else             → default browser

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
