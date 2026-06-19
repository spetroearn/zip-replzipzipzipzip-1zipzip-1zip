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

@Composable
fun AuthScreen(vm: AppViewModel, deviceId: String, onAuthed: () -> Unit) {
    val state by vm.state.collectAsState()
    var tab by remember { mutableStateOf(0) }
    val ctx = LocalContext.current
    var showTerms by remember { mutableStateOf(false) }

    if (showTerms) TermsDialog(onClose = { showTerms = false })

    LaunchedEffect(state.toast) {
        if (state.toast != null) {
            kotlinx.coroutines.delay(3500)
            vm.clearToast()
        }
    }

    Box(Modifier.fillMaxSize().background(BgDeep)) {
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.height(52.dp))

            // Logo — SE brand mark
            SpetroLogo(size = 76)

            Spacer(Modifier.height(16.dp))
            Text("Spetro Earn", fontSize = 26.sp, fontWeight = FontWeight.ExtraBold, color = TextPrime)
            Text("Earn coins • Withdraw rewards", fontSize = 14.sp, color = TextMuted)
            Spacer(Modifier.height(32.dp))

            // Tab selector
            Surface(shape = RoundedCornerShape(14.dp), color = BgCard2, modifier = Modifier.fillMaxWidth()) {
                Row(Modifier.padding(4.dp)) {
                    listOf("Sign In", "Sign Up").forEachIndexed { i, label ->
                        Box(
                            Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(11.dp))
                                .background(
                                    if (tab == i)
                                        Brush.linearGradient(listOf(Primary, PrimaryDk))
                                    else Brush.linearGradient(listOf(Color.Transparent, Color.Transparent))
                                )
                                .clickable { tab = i }
                                .padding(vertical = 11.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                label, fontWeight = FontWeight.Bold, fontSize = 14.sp,
                                color = if (tab == i) Color.White else TextMuted
                            )
                        }
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            AnimatedContent(
                targetState = tab,
                transitionSpec = {
                    fadeIn(tween(200)) + slideInHorizontally { if (targetState > initialState) 80 else -80 } togetherWith
                    fadeOut(tween(150)) + slideOutHorizontally { if (targetState > initialState) -80 else 80 }
                },
                label = "auth_tab"
            ) { currentTab ->
                if (currentTab == 0) {
                    LoginForm(vm, ctx, onAuthed) { showTerms = true }
                } else {
                    RegisterForm(vm, deviceId, ctx, onAuthed) { showTerms = true }
                }
            }

            state.toast?.let { msg ->
                Spacer(Modifier.height(12.dp))
                val isSuccess = msg.startsWith("Day") || msg.contains("success", ignoreCase = true)
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = if (isSuccess) Success.copy(.12f) else Danger.copy(.12f),
                    border = BorderStroke(1.dp, if (isSuccess) Success.copy(.35f) else Danger.copy(.35f))
                ) {
                    Text(msg, Modifier.padding(14.dp, 10.dp), fontSize = 13.sp,
                        color = if (isSuccess) Success else Danger)
                }
            }

            Spacer(Modifier.height(40.dp))
        }
    }
}

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

    Column(Modifier.fillMaxWidth()) {
        // Google button
        GoogleButton(enabled = termsAccepted) { openGoogleOAuth(ctx) }
        Spacer(Modifier.height(16.dp))
        DividerRow()
        Spacer(Modifier.height(16.dp))

        AuthField("Email address", email, { email = it }, KeyboardType.Email, Icons.Default.Email)
        Spacer(Modifier.height(12.dp))
        AuthField("Password", password, { password = it }, KeyboardType.Password, Icons.Default.Lock,
            isPassword = true, passwordVisible = pwdVisible, onToggle = { pwdVisible = !pwdVisible })
        Spacer(Modifier.height(14.dp))

        TermsRow(termsAccepted, { termsAccepted = it }, onShowTerms)
        Spacer(Modifier.height(20.dp))

        GradientButton(
            text = if (state.loading) "Signing in…" else "Sign In",
            onClick = { vm.login(email, password, onAuthed) },
            enabled = !state.loading && termsAccepted && email.isNotBlank() && password.isNotBlank()
        )
    }
}

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

    Column(Modifier.fillMaxWidth()) {
        GoogleButton(enabled = termsAccepted) { openGoogleOAuth(ctx) }
        Spacer(Modifier.height(16.dp))
        DividerRow()
        Spacer(Modifier.height(16.dp))

        AuthField("Full Name", name, { name = it }, KeyboardType.Text, Icons.Default.Person)
        Spacer(Modifier.height(12.dp))
        AuthField("Email address", email, { email = it }, KeyboardType.Email, Icons.Default.Email)
        Spacer(Modifier.height(12.dp))
        AuthField("Password (min 6 chars)", password, { password = it }, KeyboardType.Password, Icons.Default.Lock,
            isPassword = true, passwordVisible = pwdVisible, onToggle = { pwdVisible = !pwdVisible })
        Spacer(Modifier.height(14.dp))

        TermsRow(termsAccepted, { termsAccepted = it }, onShowTerms)
        Spacer(Modifier.height(20.dp))

        GradientButton(
            text = if (state.loading) "Creating account…" else "Create Account",
            onClick = { vm.register(name, email, password, deviceId, onAuthed) },
            enabled = !state.loading && termsAccepted &&
                name.isNotBlank() && email.isNotBlank() && password.length >= 6
        )
    }
}

// ── Shared components ─────────────────────────────────────────────────────────

@Composable
fun SpetroLogo(size: Int = 72) {
    Box(
        Modifier
            .size(size.dp)
            .clip(RoundedCornerShape((size * 0.26f).dp))
            .background(Brush.linearGradient(listOf(Color(0xFF1e40af), Primary, Color(0xFF0ea5e9)))),
        contentAlignment = Alignment.Center
    ) {
        Text(
            "SE",
            fontSize = (size * 0.33f).sp,
            fontWeight = FontWeight.ExtraBold,
            color = Color.White
        )
    }
}

@Composable
private fun GoogleButton(enabled: Boolean, onClick: () -> Unit) {
    OutlinedButton(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().height(50.dp),
        shape = RoundedCornerShape(14.dp),
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = if (enabled) BgCard2 else BgCard
        ),
        border = BorderStroke(1.dp, if (enabled) Border else Border.copy(alpha = 0.4f)),
        enabled = enabled
    ) {
        Surface(shape = RoundedCornerShape(4.dp), color = Color.White, modifier = Modifier.size(20.dp)) {
            Box(contentAlignment = Alignment.Center) {
                Text("G", fontSize = 13.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF4285F4))
            }
        }
        Spacer(Modifier.width(10.dp))
        Text(
            "Continue with Google", fontWeight = FontWeight.SemiBold, fontSize = 14.sp,
            color = if (enabled) TextPrime else TextDim
        )
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
        Spacer(Modifier.width(4.dp))
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
        label = { Text(label, fontSize = 13.sp, color = TextDim) },
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
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp)
                .fillMaxHeight(0.85f),
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
                    IconButton(onClick = onClose) {
                        Icon(Icons.Default.Close, null, tint = TextMuted)
                    }
                }
                Divider(color = Border)
                Column(
                    Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(20.dp)
                ) {
                    TermsSection("1. Eligibility",
                        "You must be at least 18 years old to use Spetro Earn. By registering, you confirm that all information you provide is accurate and truthful.")
                    TermsSection("2. One Account Per Person",
                        "Each user may only maintain one account. Creating multiple accounts — whether by using different emails, devices, or VPNs — is strictly prohibited and will result in permanent suspension of all accounts.")
                    TermsSection("3. Prohibited Activities",
                        "You may not use bots, scripts, automated tools, VPNs, proxies, or any deceptive means to earn coins. Any fraudulent activity will result in an immediate account ban and forfeiture of all balances.")
                    TermsSection("4. Coin Policy",
                        "Coins are virtual rewards with no monetary value until redeemed. Coin balances are stored server-side and cannot be transferred between accounts. Spetro Earn reserves the right to adjust balances if fraud is detected.")
                    TermsSection("5. Withdrawals",
                        "Withdrawals require a minimum balance of 500 SC. Processing takes 1–3 business days and is subject to admin approval. We reserve the right to request identity verification before processing any withdrawal.")
                    TermsSection("6. Account Termination",
                        "We reserve the right to suspend or terminate any account at any time, with or without notice, for violations of these terms or for any behavior deemed harmful to our platform.")
                    TermsSection("7. Privacy",
                        "We collect minimal data necessary to operate the service. We do not sell your data to third parties. Your IP address and device information may be collected to prevent fraud.")
                    TermsSection("8. Changes to Terms",
                        "We may update these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms.")
                    Spacer(Modifier.height(8.dp))
                    Text("Last updated: June 2026", fontSize = 11.sp, color = TextDim)
                }
            }
        }
    }
}

@Composable
private fun TermsSection(title: String, body: String) {
    Spacer(Modifier.height(14.dp))
    Text(title, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrime)
    Spacer(Modifier.height(4.dp))
    Text(body, fontSize = 13.sp, color = TextMuted, lineHeight = 20.sp)
}
