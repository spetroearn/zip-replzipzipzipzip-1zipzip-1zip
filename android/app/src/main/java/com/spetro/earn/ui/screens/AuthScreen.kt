package com.spetro.earn.ui.screens

import android.content.Context
import android.net.Uri
import androidx.browser.customtabs.CustomTabColorSchemeParams
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.*
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.spetro.earn.ui.theme.*
import com.spetro.earn.viewmodel.AppViewModel

private val NAME_REGEX = Regex("^[A-Za-z ]+$")

@Composable
fun AuthScreen(vm: AppViewModel, deviceId: String, onAuthed: () -> Unit) {
    val state by vm.state.collectAsState()
    var mode by remember { mutableStateOf("welcome") }  // welcome | signin | signup
    val ctx = LocalContext.current
    var showTerms by remember { mutableStateOf(false) }

    // Name setup dialog (for Google users with auto-generated names)
    if (state.showNameDialog) {
        NameSetupDialog(
            vm = vm,
            onDone = { onAuthed() }
        )
    }

    if (showTerms) TermsDialog(onClose = { showTerms = false })

    LaunchedEffect(state.toast) {
        if (state.toast != null) {
            kotlinx.coroutines.delay(3500)
            vm.clearToast()
        }
    }

    Box(
        Modifier
            .fillMaxSize()
            .background(BgDeep)
    ) {
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.height(if (mode == "welcome") 64.dp else 40.dp))

            // SE Brand Logo
            SpetroLogo(size = if (mode == "welcome") 88 else 72)
            Spacer(Modifier.height(14.dp))
            Text("Spetro Earn", fontSize = 26.sp, fontWeight = FontWeight.ExtraBold, color = TextPrime)
            Text("Earn coins • Withdraw real rewards", fontSize = 13.sp, color = TextMuted)

            Spacer(Modifier.height(if (mode == "welcome") 44.dp else 24.dp))

            AnimatedContent(
                targetState = mode,
                transitionSpec = {
                    fadeIn(tween(220)) + slideInHorizontally { if (initialState == "welcome") 60 else -60 } togetherWith
                    fadeOut(tween(160)) + slideOutHorizontally { if (initialState == "welcome") -60 else 60 }
                },
                label = "auth_mode"
            ) { m ->
                when (m) {
                    "welcome" -> WelcomeView(
                        onSignUp = { mode = "signup" },
                        onSignIn = { mode = "signin" }
                    )
                    "signin" -> Column(Modifier.fillMaxWidth()) {
                        FormHeader("Sign In", "Welcome back — log in to your account") { mode = "welcome" }
                        Spacer(Modifier.height(18.dp))
                        LoginForm(vm, ctx, onAuthed) { showTerms = true }
                    }
                    else -> Column(Modifier.fillMaxWidth()) {
                        FormHeader("Create Account", "Join Spetro Earn and start earning") { mode = "welcome" }
                        Spacer(Modifier.height(18.dp))
                        RegisterForm(vm, deviceId, ctx, onAuthed) { showTerms = true }
                    }
                }
            }

            // Toast
            state.toast?.let { msg ->
                Spacer(Modifier.height(12.dp))
                val ok = msg.contains("success", ignoreCase = true)
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = if (ok) Success.copy(.1f) else Danger.copy(.1f),
                    border = BorderStroke(1.dp, if (ok) Success.copy(.3f) else Danger.copy(.3f))
                ) {
                    Text(msg, Modifier.padding(14.dp, 10.dp), fontSize = 13.sp,
                        color = if (ok) Success else Danger)
                }
            }

            Spacer(Modifier.height(40.dp))
        }
    }
}

// ── Welcome View (choose Sign Up or Sign In) ──────────────────────────────────
@Composable
private fun WelcomeView(onSignUp: () -> Unit, onSignIn: () -> Unit) {
    Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
        GradientButton(text = "Sign Up", onClick = onSignUp)
        Spacer(Modifier.height(12.dp))
        OutlinedButton(
            onClick = onSignIn,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.outlinedButtonColors(containerColor = BgCard2),
            border = BorderStroke(1.dp, Border)
        ) {
            Text("Sign In", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = TextPrime)
        }
        Spacer(Modifier.height(20.dp))
        Text(
            "Create a free account to start earning,\nor sign in if you already have one.",
            fontSize = 12.sp, color = TextDim, textAlign = TextAlign.Center, lineHeight = 18.sp
        )
    }
}

// ── Form header with back button ──────────────────────────────────────────────
@Composable
private fun FormHeader(title: String, subtitle: String, onBack: () -> Unit) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = BgCard2,
            border = BorderStroke(1.dp, Border),
            modifier = Modifier.size(42.dp).clickable(onClick = onBack)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(Icons.Default.ArrowBack, "Back", tint = TextPrime, modifier = Modifier.size(20.dp))
            }
        }
        Spacer(Modifier.width(14.dp))
        Column {
            Text(title, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrime)
            Text(subtitle, fontSize = 12.sp, color = TextMuted)
        }
    }
}

// ── Login Form ────────────────────────────────────────────────────────────────
@Composable
private fun LoginForm(
    vm: AppViewModel, ctx: Context,
    onAuthed: () -> Unit, onShowTerms: () -> Unit
) {
    val state by vm.state.collectAsState()
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var pwdVisible by remember { mutableStateOf(false) }
    var termsAccepted by remember { mutableStateOf(false) }
    var termsError by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxWidth()) {
        GoogleButton {
            if (!termsAccepted) { termsError = true; return@GoogleButton }
            termsError = false
            openGoogleOAuth(ctx)
        }

        if (termsError) {
            Spacer(Modifier.height(8.dp))
            Surface(shape = RoundedCornerShape(10.dp), color = Danger.copy(.1f), border = BorderStroke(1.dp, Danger.copy(.35f))) {
                Row(Modifier.fillMaxWidth().padding(10.dp, 8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Error, null, tint = Danger, modifier = Modifier.size(15.dp))
                    Spacer(Modifier.width(7.dp))
                    Text("You must accept the Terms of Service first.", fontSize = 12.sp, color = Danger)
                }
            }
        }

        Spacer(Modifier.height(14.dp))
        DividerRow()
        Spacer(Modifier.height(14.dp))

        AuthField("Email address", email, { email = it }, KeyboardType.Email, Icons.Default.Email)
        Spacer(Modifier.height(10.dp))
        AuthField("Password", password, { password = it }, KeyboardType.Password, Icons.Default.Lock,
            isPassword = true, passwordVisible = pwdVisible, onToggle = { pwdVisible = !pwdVisible })
        Spacer(Modifier.height(12.dp))

        TermsRow(termsAccepted, {
            termsAccepted = it
            if (it) termsError = false
        }, onShowTerms)

        Spacer(Modifier.height(18.dp))
        GradientButton(
            text = if (state.loading) "Signing in…" else "Sign In",
            onClick = {
                if (!termsAccepted) { termsError = true; return@GradientButton }
                vm.login(email, password, onAuthed)
            },
            enabled = !state.loading && email.isNotBlank() && password.isNotBlank()
        )
    }
}

// ── Register Form ─────────────────────────────────────────────────────────────
@Composable
private fun RegisterForm(
    vm: AppViewModel, deviceId: String, ctx: Context,
    onAuthed: () -> Unit, onShowTerms: () -> Unit
) {
    val state by vm.state.collectAsState()
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var pwdVisible by remember { mutableStateOf(false) }
    var termsAccepted by remember { mutableStateOf(false) }
    var termsError by remember { mutableStateOf(false) }

    val nameInvalid = name.isNotEmpty() && !name.matches(NAME_REGEX)

    Column(Modifier.fillMaxWidth()) {
        GoogleButton {
            if (!termsAccepted) { termsError = true; return@GoogleButton }
            termsError = false
            openGoogleOAuth(ctx)
        }

        if (termsError) {
            Spacer(Modifier.height(8.dp))
            Surface(shape = RoundedCornerShape(10.dp), color = Danger.copy(.1f), border = BorderStroke(1.dp, Danger.copy(.35f))) {
                Row(Modifier.fillMaxWidth().padding(10.dp, 8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Error, null, tint = Danger, modifier = Modifier.size(15.dp))
                    Spacer(Modifier.width(7.dp))
                    Text("You must accept the Terms of Service first.", fontSize = 12.sp, color = Danger)
                }
            }
        }

        Spacer(Modifier.height(14.dp))
        DividerRow()
        Spacer(Modifier.height(14.dp))

        AuthField("Full Name (English letters only)", name, { name = it }, KeyboardType.Text, Icons.Default.Person)
        if (nameInvalid) {
            Spacer(Modifier.height(4.dp))
            Text("Name must contain English letters only (no numbers or symbols).", fontSize = 11.sp, color = Danger)
        }
        Spacer(Modifier.height(10.dp))
        AuthField("Email address", email, { email = it }, KeyboardType.Email, Icons.Default.Email)
        Spacer(Modifier.height(10.dp))
        AuthField("Password (min 6 chars)", password, { password = it }, KeyboardType.Password, Icons.Default.Lock,
            isPassword = true, passwordVisible = pwdVisible, onToggle = { pwdVisible = !pwdVisible })
        Spacer(Modifier.height(12.dp))

        TermsRow(termsAccepted, {
            termsAccepted = it
            if (it) termsError = false
        }, onShowTerms)

        Spacer(Modifier.height(18.dp))
        GradientButton(
            text = if (state.loading) "Creating account…" else "Create Account",
            onClick = {
                if (!termsAccepted) { termsError = true; return@GradientButton }
                if (nameInvalid || name.isBlank()) return@GradientButton
                vm.register(name, email, password, deviceId, onAuthed)
            },
            enabled = !state.loading && !nameInvalid && name.isNotBlank() &&
                email.isNotBlank() && password.length >= 6
        )
    }
}

// ── Name Setup Dialog (Google users with auto-generated names) ────────────────
@Composable
fun NameSetupDialog(vm: AppViewModel, onDone: () -> Unit) {
    var name by remember { mutableStateOf("") }
    val nameInvalid = name.isNotEmpty() && !name.matches(NAME_REGEX)
    val state by vm.state.collectAsState()

    Dialog(onDismissRequest = {}, properties = DialogProperties(dismissOnBackPress = false, dismissOnClickOutside = false)) {
        Surface(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp),
            shape = RoundedCornerShape(20.dp),
            color = BgCard
        ) {
            Column(Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                SpetroLogo(size = 52)
                Spacer(Modifier.height(16.dp))
                Text("Choose Your Username", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrime, textAlign = TextAlign.Center)
                Spacer(Modifier.height(6.dp))
                Text("Your Google account name had numbers. Please choose a proper username (English letters only).", fontSize = 13.sp, color = TextMuted, textAlign = TextAlign.Center)
                Spacer(Modifier.height(20.dp))

                AuthField("Username (English letters only)", name, { name = it }, KeyboardType.Text, Icons.Default.Person)
                if (nameInvalid) {
                    Spacer(Modifier.height(4.dp))
                    Text("Letters only — no numbers or symbols.", fontSize = 11.sp, color = Danger)
                }

                Spacer(Modifier.height(16.dp))
                GradientButton(
                    text = if (state.loading) "Saving…" else "Save Username",
                    onClick = { vm.updateName(name) { onDone() } },
                    enabled = !state.loading && !nameInvalid && name.trim().length >= 3
                )
            }
        }
    }
}

// ── Shared composables ────────────────────────────────────────────────────────

@Composable
fun SpetroLogo(size: Int = 72) {
    Box(
        Modifier
            .size(size.dp)
            .clip(RoundedCornerShape((size * 0.26f).dp))
            .background(Brush.linearGradient(listOf(Color(0xFF1e3a8a), Primary, Color(0xFF0ea5e9)))),
        contentAlignment = Alignment.Center
    ) {
        Text("SE", fontSize = (size * 0.33f).sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
    }
}

@Composable
private fun GoogleButton(onClick: () -> Unit) {
    OutlinedButton(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().height(50.dp),
        shape = RoundedCornerShape(14.dp),
        colors = ButtonDefaults.outlinedButtonColors(containerColor = BgCard2),
        border = BorderStroke(1.dp, Border)
    ) {
        Surface(shape = RoundedCornerShape(4.dp), color = Color.White, modifier = Modifier.size(20.dp)) {
            Box(contentAlignment = Alignment.Center) {
                Text("G", fontSize = 13.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF4285F4))
            }
        }
        Spacer(Modifier.width(10.dp))
        Text("Continue with Google", fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = TextPrime)
    }
}

@Composable
private fun DividerRow() {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Divider(Modifier.weight(1f), color = Border)
        Text("  or  ", fontSize = 12.sp, color = TextDim)
        Divider(Modifier.weight(1f), color = Border)
    }
}

@Composable
private fun TermsRow(accepted: Boolean, onToggle: (Boolean) -> Unit, onShowTerms: () -> Unit) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Checkbox(
            checked = accepted, onCheckedChange = onToggle,
            colors = CheckboxDefaults.colors(checkedColor = Primary, uncheckedColor = TextDim)
        )
        Spacer(Modifier.width(2.dp))
        Text("I agree to the ", fontSize = 13.sp, color = TextMuted)
        Text(
            "Terms of Service",
            fontSize = 13.sp, color = Primary, fontWeight = FontWeight.SemiBold,
            modifier = Modifier.clickable(onClick = onShowTerms)
        )
    }
}

@Composable
fun AuthField(
    label: String, value: String, onValue: (String) -> Unit,
    keyboardType: KeyboardType,
    leadingIcon: ImageVector,
    isPassword: Boolean = false,
    passwordVisible: Boolean = false,
    onToggle: () -> Unit = {}
) {
    OutlinedTextField(
        value = value, onValueChange = onValue,
        label = { Text(label, fontSize = 12.sp, color = TextDim) },
        leadingIcon = { Icon(leadingIcon, null, tint = TextDim, modifier = Modifier.size(18.dp)) },
        trailingIcon = if (isPassword) ({
            IconButton(onClick = onToggle) {
                Icon(
                    if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                    null, tint = TextDim
                )
            }
        }) else null,
        visualTransformation = if (isPassword && !passwordVisible) PasswordVisualTransformation() else VisualTransformation.None,
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        singleLine = true,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = Primary,
            unfocusedBorderColor = Border,
            focusedContainerColor = BgCard2,
            unfocusedContainerColor = BgCard2,
            focusedTextColor = TextPrime,
            unfocusedTextColor = TextPrime,
            cursorColor = Primary
        )
    )
}

@Composable
fun GradientButton(text: String, onClick: () -> Unit, enabled: Boolean = true) {
    Box(
        Modifier
            .fillMaxWidth()
            .height(52.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(
                if (enabled) Brush.linearGradient(listOf(Primary, PrimaryDk))
                else Brush.linearGradient(listOf(BgCard2, BgCard2))
            )
            .clickable(enabled = enabled, onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Text(text, fontWeight = FontWeight.Bold, fontSize = 16.sp,
            color = if (enabled) Color.White else TextDim)
    }
}

private fun openGoogleOAuth(ctx: Context) {
    val params = CustomTabColorSchemeParams.Builder().setToolbarColor(0xFF0f172a.toInt()).build()
    CustomTabsIntent.Builder()
        .setColorScheme(CustomTabsIntent.COLOR_SCHEME_DARK)
        .setColorSchemeParams(CustomTabsIntent.COLOR_SCHEME_DARK, params)
        .build()
        .launchUrl(ctx, Uri.parse("https://spetroearn.com/api/auth/google?from_app=1"))
}

// ── Terms Dialog ──────────────────────────────────────────────────────────────
@Composable
private fun TermsDialog(onClose: () -> Unit) {
    Dialog(
        onDismissRequest = onClose,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 10.dp).fillMaxHeight(0.85f),
            shape = RoundedCornerShape(20.dp),
            color = BgCard
        ) {
            Column {
                Row(
                    Modifier.fillMaxWidth().padding(20.dp, 18.dp, 12.dp, 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Terms of Service", fontSize = 17.sp, fontWeight = FontWeight.Bold, color = TextPrime)
                    IconButton(onClick = onClose) { Icon(Icons.Default.Close, null, tint = TextMuted) }
                }
                Divider(color = Border)
                Column(
                    Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp)
                ) {
                    TermsSection("1. Eligibility", "You must be at least 18 years old to use Spetro Earn. By registering, you confirm that all information you provide is accurate and truthful.")
                    TermsSection("2. One Account Per Person", "Each user may only maintain one account. Creating multiple accounts using different emails, devices, or VPNs is strictly prohibited and will result in permanent suspension of all accounts.")
                    TermsSection("3. Prohibited Activities", "You may not use bots, scripts, automated tools, VPNs, proxies, or any deceptive means to earn coins. Fraudulent activity results in an immediate ban and forfeiture of all balances.")
                    TermsSection("4. Coin Policy", "Coins are virtual rewards with no monetary value until redeemed. Balances are stored server-side and cannot be transferred between accounts. We reserve the right to adjust balances if fraud is detected.")
                    TermsSection("5. Withdrawals", "Withdrawals require a minimum balance of 500 SC. Processing takes 1–3 business days and is subject to admin approval. Identity verification may be requested before processing.")
                    TermsSection("6. Account Termination", "We reserve the right to suspend or terminate any account at any time, with or without notice, for violations of these terms.")
                    TermsSection("7. Privacy", "We collect minimal data necessary to operate the service. We do not sell your data to third parties. Your IP address and device information may be collected to prevent fraud.")
                    TermsSection("8. Changes", "We may update these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms.")
                    Spacer(Modifier.height(8.dp))
                    Text("Last updated: June 2026", fontSize = 11.sp, color = TextDim)
                }
            }
        }
    }
}

@Composable
private fun TermsSection(title: String, body: String) {
    Spacer(Modifier.height(12.dp))
    Text(title, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrime)
    Spacer(Modifier.height(3.dp))
    Text(body, fontSize = 13.sp, color = TextMuted, lineHeight = 20.sp)
}
