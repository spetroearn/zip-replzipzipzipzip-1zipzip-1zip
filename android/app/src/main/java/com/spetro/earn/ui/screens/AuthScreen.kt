package com.spetro.earn.ui.screens

import android.content.Context
import android.net.Uri
import androidx.browser.customtabs.CustomTabColorSchemeParams
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.*
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.spetro.earn.ui.theme.*
import com.spetro.earn.viewmodel.AppViewModel

@Composable
fun AuthScreen(vm: AppViewModel, onAuthed: () -> Unit) {
    val state by vm.state.collectAsState()
    var tab by remember { mutableStateOf(0) } // 0=login 1=register
    val ctx = LocalContext.current

    // Toast
    state.toast?.let { msg ->
        LaunchedEffect(msg) {
            kotlinx.coroutines.delay(3000)
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
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.height(48.dp))

            // Logo
            Box(
                Modifier
                    .size(72.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(Brush.linearGradient(listOf(Primary, PrimaryDk))),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Bolt, null, tint = Color.White, modifier = Modifier.size(38.dp))
            }

            Spacer(Modifier.height(16.dp))
            Text("Spetro Earn", fontSize = 26.sp, fontWeight = FontWeight.ExtraBold, color = TextPrime)
            Text("Earn coins • Withdraw rewards", fontSize = 14.sp, color = TextMuted)
            Spacer(Modifier.height(32.dp))

            // Tab row
            Surface(shape = RoundedCornerShape(12.dp), color = BgCard2, modifier = Modifier.fillMaxWidth()) {
                Row(Modifier.padding(4.dp)) {
                    listOf("Sign In", "Register").forEachIndexed { i, label ->
                        Box(
                            Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (tab == i) Primary else Color.Transparent)
                                .clickable { tab = i }
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(label, fontWeight = FontWeight.Bold, fontSize = 14.sp,
                                color = if (tab == i) Color.White else TextMuted)
                        }
                    }
                }
            }

            Spacer(Modifier.height(20.dp))

            if (tab == 0) LoginForm(vm, ctx, onAuthed) else RegisterForm(vm, onAuthed)

            // Toast banner
            state.toast?.let { msg ->
                Spacer(Modifier.height(16.dp))
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = if (msg.startsWith("✅")) Success.copy(alpha = .15f) else Danger.copy(alpha = .15f),
                    border = BorderStroke(1.dp, if (msg.startsWith("✅")) Success.copy(alpha = .4f) else Danger.copy(alpha = .4f))
                ) {
                    Text(msg, Modifier.padding(12.dp, 10.dp), fontSize = 13.sp,
                        color = if (msg.startsWith("✅")) Success else Danger)
                }
            }

            Spacer(Modifier.height(32.dp))
        }
    }
}

@Composable
private fun LoginForm(vm: AppViewModel, ctx: Context, onAuthed: () -> Unit) {
    val state by vm.state.collectAsState()
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var pwdVisible by remember { mutableStateOf(false) }
    var termsAccepted by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxWidth()) {
        // Google Sign-In
        OutlinedButton(
            onClick = {
                if (termsAccepted) openGoogleOAuth(ctx)
            },
            modifier = Modifier.fillMaxWidth().height(50.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.outlinedButtonColors(containerColor = BgCard2),
            border = BorderStroke(1.dp, Border),
            enabled = termsAccepted
        ) {
            Text("G", fontSize = 18.sp, fontWeight = FontWeight.ExtraBold,
                color = if (termsAccepted) Primary else TextMuted)
            Spacer(Modifier.width(8.dp))
            Text("Continue with Google", fontWeight = FontWeight.SemiBold,
                color = if (termsAccepted) TextPrime else TextMuted)
        }

        Spacer(Modifier.height(8.dp))

        // Terms
        Row(Modifier.clickable { termsAccepted = !termsAccepted }, verticalAlignment = Alignment.CenterVertically) {
            Checkbox(termsAccepted, { termsAccepted = it },
                colors = CheckboxDefaults.colors(checkedColor = Primary, uncheckedColor = TextDim))
            Text("I agree to the Terms of Service & Privacy Policy",
                fontSize = 13.sp, color = TextMuted, modifier = Modifier.padding(start = 4.dp))
        }

        Spacer(Modifier.height(16.dp))
        Divider(color = Border)
        Spacer(Modifier.height(16.dp))

        // Email
        SpetroField("Email", email, { email = it }, KeyboardType.Email, Icons.Default.Email)
        Spacer(Modifier.height(12.dp))

        // Password
        SpetroField("Password", password, { password = it }, KeyboardType.Password, Icons.Default.Lock,
            isPassword = true, passwordVisible = pwdVisible, onTogglePassword = { pwdVisible = !pwdVisible })
        Spacer(Modifier.height(20.dp))

        // Login button
        GradientButton(
            text = if (state.loading) "Signing in…" else "Sign In",
            onClick = { vm.login(email, password) { onAuthed() } },
            enabled = !state.loading && termsAccepted && email.isNotBlank() && password.isNotBlank()
        )
    }
}

@Composable
private fun RegisterForm(vm: AppViewModel, onAuthed: () -> Unit) {
    val state by vm.state.collectAsState()
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var pwdVisible by remember { mutableStateOf(false) }
    var termsAccepted by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxWidth()) {
        SpetroField("Full Name", name, { name = it }, KeyboardType.Text, Icons.Default.Person)
        Spacer(Modifier.height(12.dp))
        SpetroField("Email", email, { email = it }, KeyboardType.Email, Icons.Default.Email)
        Spacer(Modifier.height(12.dp))
        SpetroField("Password", password, { password = it }, KeyboardType.Password, Icons.Default.Lock,
            isPassword = true, passwordVisible = pwdVisible, onTogglePassword = { pwdVisible = !pwdVisible })
        Spacer(Modifier.height(12.dp))

        Row(Modifier.clickable { termsAccepted = !termsAccepted }, verticalAlignment = Alignment.CenterVertically) {
            Checkbox(termsAccepted, { termsAccepted = it },
                colors = CheckboxDefaults.colors(checkedColor = Primary, uncheckedColor = TextDim))
            Text("I agree to the Terms of Service & Privacy Policy",
                fontSize = 13.sp, color = TextMuted, modifier = Modifier.padding(start = 4.dp))
        }

        Spacer(Modifier.height(20.dp))
        GradientButton(
            text = if (state.loading) "Creating account…" else "Create Account",
            onClick = { vm.register(name, email, password) { onAuthed() } },
            enabled = !state.loading && termsAccepted && name.isNotBlank() && email.isNotBlank() && password.isNotBlank()
        )
    }
}

@Composable
fun SpetroField(
    label: String,
    value: String,
    onValue: (String) -> Unit,
    keyboardType: KeyboardType,
    leadingIcon: androidx.compose.ui.graphics.vector.ImageVector,
    isPassword: Boolean = false,
    passwordVisible: Boolean = false,
    onTogglePassword: () -> Unit = {}
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValue,
        label = { Text(label, color = TextDim) },
        leadingIcon = { Icon(leadingIcon, null, tint = TextDim) },
        trailingIcon = if (isPassword) ({
            IconButton(onClick = onTogglePassword) {
                Icon(if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                    null, tint = TextDim)
            }
        }) else null,
        visualTransformation = if (isPassword && !passwordVisible) PasswordVisualTransformation() else VisualTransformation.None,
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        singleLine = true,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = Primary,
            unfocusedBorderColor = Border,
            focusedContainerColor = BgCard2,
            unfocusedContainerColor = BgCard2,
            focusedTextColor = TextPrime,
            unfocusedTextColor = TextPrime,
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
    val params = CustomTabColorSchemeParams.Builder()
        .setToolbarColor(0xFF0f172a.toInt())
        .build()
    CustomTabsIntent.Builder()
        .setColorScheme(CustomTabsIntent.COLOR_SCHEME_DARK)
        .setColorSchemeParams(CustomTabsIntent.COLOR_SCHEME_DARK, params)
        .setShowTitle(true)
        .build()
        .launchUrl(ctx, Uri.parse("https://spetroearn.com/api/auth/google?from_app=1"))
}
