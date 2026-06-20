package com.spetro.earn

import android.Manifest
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.runtime.*
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.spetro.earn.network.ApiClient
import com.spetro.earn.ui.screens.*
import com.spetro.earn.ui.theme.SpetroTheme
import com.spetro.earn.viewmodel.AppViewModel

class MainActivity : ComponentActivity() {

    private val vm: AppViewModel by viewModels()
    private val prefs by lazy { getSharedPreferences("spetro_prefs", Context.MODE_PRIVATE) }

    private val notifPermLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { /* result handled silently */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        val splash = installSplashScreen()
        super.onCreate(savedInstanceState)
        ApiClient.init(this)
        splash.setKeepOnScreenCondition { vm.state.value.loading }

        val androidId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID) ?: ""
        // When onboarding is done, start on a branded loading screen instead of
        // "auth" so the login form never flashes before the session is restored.
        val startDest = if (prefs.getBoolean("onboarding_done", false)) "loading" else "onboarding"

        setContent {
            SpetroTheme {
                val state by vm.state.collectAsState()
                val nav = rememberNavController()
                var showNotifPrompt by remember { mutableStateOf(false) }

                NavHost(nav, startDestination = startDest) {
                    composable("loading") {
                        LoadingScreen()
                    }
                    composable("onboarding") {
                        OnboardingScreen {
                            prefs.edit().putBoolean("onboarding_done", true).apply()
                            nav.navigate("auth") { popUpTo("onboarding") { inclusive = true } }
                        }
                    }
                    composable("auth") {
                        AuthScreen(
                            vm = vm,
                            deviceId = androidId,
                            onAuthed = {
                                nav.navigate("main") { popUpTo("auth") { inclusive = true } }
                                if (shouldAskNotificationPermission()) showNotifPrompt = true
                            }
                        )
                    }
                    composable("main") {
                        MainScreen(
                            vm = vm,
                            onLogout = { nav.navigate("auth") { popUpTo("main") { inclusive = true } } }
                        )
                    }
                }

                if (showNotifPrompt) {
                    NotificationPermissionDialog(
                        onAllow = {
                            markNotificationAsked()
                            showNotifPrompt = false
                            launchSystemNotificationPermission()
                        },
                        onDismiss = {
                            markNotificationAsked()
                            showNotifPrompt = false
                        }
                    )
                }

                LaunchedEffect(state.user, state.loading) {
                    if (!state.loading) {
                        val dest = nav.currentBackStackEntry?.destination?.route
                        if (state.user != null && (dest == "auth" || dest == "onboarding" || dest == "loading")) {
                            nav.navigate("main") { popUpTo(0) { inclusive = true } }
                        } else if (state.user == null && (dest == "main" || dest == "loading")) {
                            nav.navigate("auth") { popUpTo(0) { inclusive = true } }
                        }
                    }
                }
            }
        }

        handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        val data: Uri = intent?.data ?: return
        if (data.scheme != "spetroearn") return
        when (data.host) {
            "auth-complete" -> {
                val token = data.getQueryParameter("token") ?: return
                exchangeOAuthToken(token)
            }
        }
    }

    private fun exchangeOAuthToken(token: String) {
        val client = ApiClient.httpClient
        val url = "https://spetroearn.com/api/auth/app-signin?token=${Uri.encode(token)}"
        Thread {
            try {
                val req = okhttp3.Request.Builder().url(url).get().build()
                client.newCall(req).execute().close()
                runOnUiThread { vm.onGoogleAuthComplete() }
            } catch (_: Exception) {
                runOnUiThread { vm.onGoogleAuthComplete() }
            }
        }.start()
    }

    // True only when we should show our in-app rationale: Android 13+, not yet
    // asked, and not already granted.
    private fun shouldAskNotificationPermission(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return false
        if (prefs.getBoolean("notif_asked", false)) return false
        val granted = ContextCompat.checkSelfPermission(
            this, Manifest.permission.POST_NOTIFICATIONS
        ) == android.content.pm.PackageManager.PERMISSION_GRANTED
        return !granted
    }

    private fun markNotificationAsked() {
        prefs.edit().putBoolean("notif_asked", true).apply()
    }

    private fun launchSystemNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            notifPermLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }
}
