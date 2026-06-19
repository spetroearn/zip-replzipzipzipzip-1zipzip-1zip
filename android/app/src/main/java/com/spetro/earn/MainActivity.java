package com.spetro.earn;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

/**
 * MainActivity — Spetro Earn Android Entry Point
 *
 * Handles two responsibilities:
 *  1. Injects AndroidBridge JS interface into the Capacitor WebView
 *  2. Intercepts spetroearn:// custom URI scheme deep links that Chrome
 *     fires after Google OAuth, extracts the one-time token, and loads
 *     https://spetroearn.com/api/auth/app-signin?token=<token> in the WebView
 *     so a proper session is created inside the app.
 */
public class MainActivity extends BridgeActivity {

    private static final String TAG    = "SpetroMain";
    private static final String HOST   = "https://spetroearn.com";
    private static final String SCHEME = "spetroearn";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        injectAndroidBridge();
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    /**
     * If the activity was launched / resumed via spetroearn:// deep link,
     * extract the token and load the sign-in URL in the WebView.
     */
    private void handleIntent(Intent intent) {
        if (intent == null) return;
        Uri data = intent.getData();
        if (data == null) return;
        if (!SCHEME.equals(data.getScheme())) return;

        String host  = data.getHost(); // "auth-complete" or "auth-error"
        String token = data.getQueryParameter("token");

        Log.d(TAG, "Deep link received: " + data.toString());

        if ("auth-complete".equals(host) && token != null && !token.isEmpty()) {
            // Exchange the one-time token for a WebView session
            String signInUrl = HOST + "/api/auth/app-signin?token=" + Uri.encode(token);
            Log.d(TAG, "Loading app-signin URL: " + signInUrl);
            WebView webView = getBridge().getWebView();
            webView.post(() -> webView.loadUrl(signInUrl));
        } else if ("auth-error".equals(host)) {
            String reason = data.getQueryParameter("reason");
            Log.w(TAG, "Google OAuth error from app: " + reason);
            WebView webView = getBridge().getWebView();
            webView.post(() -> webView.loadUrl(HOST + "/?error=" + (reason != null ? reason : "google_failed")));
        }
    }

    private void injectAndroidBridge() {
        WebView webView = getBridge().getWebView();

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);

        webView.addJavascriptInterface(new AndroidBridge(this), "AndroidBridge");
        Log.d(TAG, "AndroidBridge injected");
    }
}
