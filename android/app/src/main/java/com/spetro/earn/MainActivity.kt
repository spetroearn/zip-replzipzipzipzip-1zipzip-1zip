package com.spetro.earn

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.runtime.*
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.spetro.earn.network.ApiClient
import com.spetro.earn.ui.screens.AuthScreen
import com.spetro.earn.ui.screens.MainScreen
import com.spetro.earn.ui.theme.SpetroTheme
import com.spetro.earn.viewmodel.AppViewModel

class MainActivity : ComponentActivity() {

    private val vm: AppViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        val splash = installSplashScreen()
        super.onCreate(savedInstanceState)

        ApiClient.init(this)

        // Keep splash visible until initial auth check completes
        splash.setKeepOnScreenCondition { vm.state.value.loading }

        setContent {
            SpetroTheme {
                val state by vm.state.collectAsState()
                val nav = rememberNavController()

                NavHost(nav, startDestination = "auth") {
                    composable("auth") {
                        AuthScreen(vm = vm, onAuthed = { nav.navigate("main") { popUpTo("auth") { inclusive = true } } })
                    }
                    composable("main") {
                        MainScreen(vm = vm, onLogout = { nav.navigate("auth") { popUpTo("main") { inclusive = true } } })
                    }
                }

                // Navigate to main if user is already logged in
                LaunchedEffect(state.user, state.loading) {
                    if (!state.loading) {
                        val dest = nav.currentBackStackEntry?.destination?.route
                        if (state.user != null && dest == "auth") {
                            nav.navigate("main") { popUpTo("auth") { inclusive = true } }
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

    /** Handles spetroearn://auth-complete?token=XXX from Google OAuth Custom Tab */
    private fun handleIntent(intent: Intent?) {
        val data: Uri = intent?.data ?: return
        if (data.scheme != "spetroearn") return
        when (data.host) {
            "auth-complete" -> {
                val token = data.getQueryParameter("token") ?: return
                // Exchange token for session via server, then re-check auth
                exchangeOAuthToken(token)
            }
            "auth-error" -> {
                vm.clearToast()
            }
        }
    }

    private fun exchangeOAuthToken(token: String) {
        // Fire a request to the server to create a session from the one-time token.
        // We use OkHttp directly so the cookie jar saves the session cookie.
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
}
