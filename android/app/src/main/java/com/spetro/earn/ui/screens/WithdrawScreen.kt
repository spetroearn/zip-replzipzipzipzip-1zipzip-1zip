package com.spetro.earn.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.spetro.earn.ui.theme.*
import com.spetro.earn.viewmodel.AppViewModel

private enum class PayMethod(
    val id: String,
    val label: String,
    val subtitle: String,
    val symbol: String,
    val gradient: Brush,
    val accent: Color,
    val isCryptoAddress: Boolean
) {
    VISA(
        "Visa Card", "Visa / Mastercard", "Bank card transfer", "VISA",
        Brush.linearGradient(listOf(Color(0xFF1e3a8a), Color(0xFF2563eb))),
        Color(0xFF3b82f6), false
    ),
    BINANCE(
        "Binance", "Binance (USDT)", "Binance UID or wallet", "BNB",
        Brush.linearGradient(listOf(Color(0xFF78350f), Color(0xFFd97706))),
        Color(0xFFf59e0b), true
    ),
    LITECOIN(
        "Litecoin", "Litecoin (LTC)", "Crypto wallet address", "LTC",
        Brush.linearGradient(listOf(Color(0xFF1e3a5f), Color(0xFF2563eb))),
        Color(0xFF60a5fa), true
    ),
    GOOGLE_PLAY(
        "Google Play", "Google Play", "Gift card via Gmail", "GP",
        Brush.linearGradient(listOf(Color(0xFF064e3b), Color(0xFF059669))),
        Color(0xFF10b981), false
    )
}

@Composable
fun WithdrawScreen(vm: AppViewModel) {
    val state by vm.state.collectAsState()
    val user = state.user ?: return
    var selectedMethod by remember { mutableStateOf(PayMethod.VISA) }
    var amountStr by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }

    LaunchedEffect(Unit) { vm.loadWithdrawals() }

    Column(
        Modifier
            .fillMaxSize()
            .background(BgDeep)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp)
    ) {
        Spacer(Modifier.height(16.dp))
        Text("Withdraw", fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = TextPrime)
        Text("Convert your coins to real money", fontSize = 13.sp, color = TextMuted)
        Spacer(Modifier.height(18.dp))

        // Balance card
        Box(
            Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp))
                .background(Brush.linearGradient(listOf(Color(0xFF1e3a8a), Primary, Color(0xFF0ea5e9))))
                .padding(18.dp)
        ) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text("AVAILABLE BALANCE", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.White.copy(.6f), letterSpacing = 1.sp)
                    Text("${user.coins} SC", fontSize = 28.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                    Text("≈ ${"%.2f".format(user.coins / 1000.0)} USD", fontSize = 12.sp, color = Color.White.copy(.5f))
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("Min: 500 SC", fontSize = 11.sp, color = Color.White.copy(.6f))
                    Text("≈ \$0.50 USD", fontSize = 11.sp, color = Color.White.copy(.4f))
                }
            }
        }

        if (user.coins < 500) {
            Spacer(Modifier.height(10.dp))
            Surface(shape = RoundedCornerShape(12.dp), color = Warning.copy(.08f), border = BorderStroke(1.dp, Warning.copy(.3f))) {
                Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.WarningAmber, null, tint = Warning, modifier = Modifier.size(15.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("You need at least 500 SC to withdraw.", fontSize = 12.sp, color = Warning)
                }
            }
        }

        Spacer(Modifier.height(20.dp))

        // Payment method selector — 2x2 grid
        Text("Select Payment Method", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextMuted)
        Spacer(Modifier.height(10.dp))

        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            MethodCard(Modifier.weight(1f), PayMethod.VISA, selectedMethod.id == PayMethod.VISA.id) { selectedMethod = PayMethod.VISA; address = "" }
            MethodCard(Modifier.weight(1f), PayMethod.BINANCE, selectedMethod.id == PayMethod.BINANCE.id) { selectedMethod = PayMethod.BINANCE; address = "" }
        }
        Spacer(Modifier.height(8.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            MethodCard(Modifier.weight(1f), PayMethod.LITECOIN, selectedMethod.id == PayMethod.LITECOIN.id) { selectedMethod = PayMethod.LITECOIN; address = "" }
            MethodCard(Modifier.weight(1f), PayMethod.GOOGLE_PLAY, selectedMethod.id == PayMethod.GOOGLE_PLAY.id) { selectedMethod = PayMethod.GOOGLE_PLAY; address = "" }
        }

        Spacer(Modifier.height(20.dp))

        // Animated form based on method type
        AnimatedContent(
            targetState = selectedMethod,
            transitionSpec = { fadeIn(tween(200)) togetherWith fadeOut(tween(150)) },
            label = "form"
        ) { method ->
            Column {
                Text("${method.label} Details", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrime)
                Spacer(Modifier.height(12.dp))

                // Amount
                AuthField(
                    label = "Amount in SC — Minimum 500",
                    value = amountStr,
                    onValue = { amountStr = it.filter { c -> c.isDigit() } },
                    keyboardType = KeyboardType.Number,
                    leadingIcon = Icons.Default.MonetizationOn
                )
                Spacer(Modifier.height(10.dp))

                if (!method.isCryptoAddress) {
                    // Visa or Google Play — show visual card mockup + appropriate field
                    if (method == PayMethod.VISA) {
                        VisaCardMockup()
                        Spacer(Modifier.height(12.dp))
                        AuthField("Full Name on Card", address, { address = it }, KeyboardType.Text, Icons.Default.CreditCard)
                    } else {
                        GooglePlayCardMockup()
                        Spacer(Modifier.height(12.dp))
                        AuthField("Gmail Address to receive gift card", address, { address = it }, KeyboardType.Email, Icons.Default.Email)
                    }
                } else {
                    // Binance or Litecoin — standard crypto address
                    AuthField(
                        label = if (method == PayMethod.BINANCE) "Binance UID or Wallet Address" else "LTC Wallet Address",
                        value = address,
                        onValue = { address = it },
                        keyboardType = KeyboardType.Text,
                        leadingIcon = Icons.Default.AccountBalanceWallet
                    )
                }
            }
        }

        Spacer(Modifier.height(18.dp))

        val amount = amountStr.toIntOrNull() ?: 0
        GradientButton(
            text = "Submit Withdrawal",
            onClick = {
                vm.submitWithdraw(selectedMethod.id, amount, address) {
                    amountStr = ""
                    address = ""
                }
            },
            enabled = amount >= 500 && amount <= user.coins && address.isNotBlank()
        )

        Spacer(Modifier.height(10.dp))
        Surface(shape = RoundedCornerShape(10.dp), color = BgCard, border = BorderStroke(1.dp, Border)) {
            Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.AccessTime, null, tint = TextDim, modifier = Modifier.size(14.dp))
                Spacer(Modifier.width(8.dp))
                Text("Processing: 1–3 business days, subject to admin approval.", fontSize = 11.sp, color = TextDim, lineHeight = 16.sp)
            }
        }

        // History
        if (state.withdrawals.isNotEmpty()) {
            Spacer(Modifier.height(26.dp))
            Text("Withdrawal History", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrime)
            Spacer(Modifier.height(10.dp))
            state.withdrawals.forEach { w ->
                val statusColor = when (w.status) { "approved" -> Success; "rejected" -> Danger; else -> Warning }
                val method = PayMethod.entries.find { it.id == w.method }
                Surface(Modifier.fillMaxWidth().padding(bottom = 8.dp), shape = RoundedCornerShape(14.dp), color = BgCard, border = BorderStroke(1.dp, Border)) {
                    Row(
                        Modifier.fillMaxWidth().padding(12.dp, 10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                Modifier.size(38.dp).clip(RoundedCornerShape(10.dp))
                                    .background(method?.gradient ?: Brush.linearGradient(listOf(BgCard2, BgCard2))),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(method?.symbol ?: w.method.take(2).uppercase(), fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                            }
                            Spacer(Modifier.width(10.dp))
                            Column {
                                Text(method?.label ?: w.method, fontWeight = FontWeight.SemiBold, fontSize = 13.sp, color = TextPrime)
                                val addr = w.walletAddress ?: "—"
                                Text(if (addr.length > 22) addr.take(22) + "…" else addr, fontSize = 11.sp, color = TextDim)
                                Text(w.createdAt.take(10), fontSize = 10.sp, color = TextDim)
                            }
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("${w.amount} SC", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = TextPrime)
                            Spacer(Modifier.height(4.dp))
                            Surface(shape = RoundedCornerShape(6.dp), color = statusColor.copy(.12f)) {
                                Text(w.status.replaceFirstChar { it.uppercase() }, Modifier.padding(horizontal = 7.dp, vertical = 3.dp), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = statusColor)
                            }
                        }
                    }
                }
            }
        }

        Spacer(Modifier.height(88.dp))
    }
}

// ── Payment method card ───────────────────────────────────────────────────────

@Composable
private fun MethodCard(modifier: Modifier, method: PayMethod, selected: Boolean, onClick: () -> Unit) {
    val borderColor by animateColorAsState(if (selected) method.accent else Border, tween(180), label = "b")
    val bgColor by animateColorAsState(if (selected) method.accent.copy(.09f) else BgCard, tween(180), label = "bg")

    Surface(
        modifier = modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        color = bgColor,
        border = BorderStroke(if (selected) 2.dp else 1.dp, borderColor)
    ) {
        Column(Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                Modifier.size(42.dp).clip(RoundedCornerShape(11.dp)).background(method.gradient),
                contentAlignment = Alignment.Center
            ) {
                Text(method.symbol, fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
            }
            Spacer(Modifier.height(7.dp))
            Text(method.label, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrime, textAlign = TextAlign.Center, maxLines = 1)
            Text(method.subtitle, fontSize = 10.sp, color = TextDim, textAlign = TextAlign.Center, maxLines = 1)
        }
    }
}

// ── Card Mockups ──────────────────────────────────────────────────────────────

@Composable
private fun VisaCardMockup() {
    Box(
        Modifier
            .fillMaxWidth()
            .height(100.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Brush.linearGradient(listOf(Color(0xFF1e3a8a), Color(0xFF2563eb), Color(0xFF3b82f6))))
            .padding(16.dp)
    ) {
        Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.SpaceBetween) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("VISA", fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = Color.White, letterSpacing = 3.sp)
                Box(Modifier.size(30.dp).clip(androidx.compose.foundation.shape.CircleShape).background(Color.White.copy(.15f)))
            }
            Row {
                repeat(3) {
                    Text("****", fontSize = 14.sp, color = Color.White.copy(.7f), letterSpacing = 2.sp)
                    Spacer(Modifier.width(8.dp))
                }
                Text("XXXX", fontSize = 14.sp, color = Color.White, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun GooglePlayCardMockup() {
    Box(
        Modifier
            .fillMaxWidth()
            .height(100.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Brush.linearGradient(listOf(Color(0xFF064e3b), Color(0xFF047857), Color(0xFF10b981))))
            .padding(16.dp)
    ) {
        Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.SpaceBetween) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text("Google Play", fontSize = 12.sp, color = Color.White.copy(.7f))
                    Text("Gift Card", fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                }
                Box(
                    Modifier.size(36.dp).clip(RoundedCornerShape(10.dp)).background(Color.White.copy(.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.CardGiftcard, null, tint = Color.White, modifier = Modifier.size(20.dp))
                }
            }
            Text("Delivered to your Gmail account", fontSize = 11.sp, color = Color.White.copy(.6f))
        }
    }
}
