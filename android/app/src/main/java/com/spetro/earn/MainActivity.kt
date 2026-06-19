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
        val startDest = if (prefs.getBoolean("onboarding_done", false)) "auth" else "onboarding"

        setContent {
            SpetroTheme {
                val state by vm.state.collectAsState()
                val nav = rememberNavController()

                NavHost(nav, startDestination = startDest) {
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
                                maybeRequestNotificationPermission()
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

                LaunchedEffect(state.user, state.loading) {
                    if (!state.loading) {
                        val dest = nav.currentBackStackEntry?.destination?.route
                        if (state.user != null && (dest == "auth" || dest == "onboarding")) {
                            nav.navigate("main") { popUpTo(0) { inclusive = true } }
                        } else if (state.user == null && dest == "main") {
                            nav.navigate("auth") { popUpTo("main") { inclusive = true } }
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

    private fun maybeRequestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val asked = prefs.getBoolean("notif_asked", false)
            if (!asked) {
                prefs.edit().putBoolean("notif_asked", true).apply()
                val granted = ContextCompat.checkSelfPermission(
                    this, Manifest.permission.POST_NOTIFICATIONS
                ) == android.content.pm.PackageManager.PERMISSION_GRANTED
                if (!granted) {
                    notifPermLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
            }
        }
    }
}
