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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.spetro.earn.ui.theme.*
import com.spetro.earn.viewmodel.AppViewModel

private data class PaymentMethod(
    val id: String,
    val name: String,
    val subtitle: String,
    val fieldLabel: String,
    val fieldHint: String,
    val gradient: Brush,
    val accent: Color,
    val symbol: String
)

private val payMethods = listOf(
    PaymentMethod(
        id = "Visa Card",
        name = "Visa / Mastercard",
        subtitle = "Direct bank card transfer",
        fieldLabel = "Cardholder Name or Last 4 Digits",
        fieldHint = "e.g. John Doe / 4242",
        gradient = Brush.linearGradient(listOf(Color(0xFF1e3a8a), Color(0xFF2563eb))),
        accent = Color(0xFF3b82f6),
        symbol = "VISA"
    ),
    PaymentMethod(
        id = "Binance",
        name = "Binance (USDT)",
        subtitle = "Binance UID or wallet address",
        fieldLabel = "Binance UID or Wallet Address",
        fieldHint = "e.g. 123456789 or 0x...",
        gradient = Brush.linearGradient(listOf(Color(0xFF78350f), Color(0xFFd97706))),
        accent = Color(0xFFf59e0b),
        symbol = "BNB"
    ),
    PaymentMethod(
        id = "Litecoin",
        name = "Litecoin (LTC)",
        subtitle = "Crypto wallet transfer",
        fieldLabel = "LTC Wallet Address",
        fieldHint = "e.g. LTC1q...",
        gradient = Brush.linearGradient(listOf(Color(0xFF1e3a5f), Color(0xFF345d9d))),
        accent = Color(0xFF60a5fa),
        symbol = "LTC"
    ),
    PaymentMethod(
        id = "Google Play",
        name = "Google Play",
        subtitle = "Gift card via Gmail",
        fieldLabel = "Gmail Address",
        fieldHint = "example@gmail.com",
        gradient = Brush.linearGradient(listOf(Color(0xFF064e3b), Color(0xFF059669))),
        accent = Color(0xFF10b981),
        symbol = "GP"
    )
)

@Composable
fun WithdrawScreen(vm: AppViewModel) {
    val state by vm.state.collectAsState()
    val user = state.user ?: return
    var selectedMethod by remember { mutableStateOf(payMethods[0]) }
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
        Spacer(Modifier.height(20.dp))

        // Balance card
        Box(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .background(Brush.linearGradient(listOf(Color(0xFF1e3a8a), Primary)))
                .padding(18.dp)
        ) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text("AVAILABLE BALANCE", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.White.copy(.6f))
                    Text("${user.coins} SC", fontSize = 28.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                    Text("≈ ${"%.2f".format(user.coins / 1000.0)} USD", fontSize = 12.sp, color = Color.White.copy(.55f))
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("Min: 500 SC", fontSize = 11.sp, color = Color.White.copy(.6f))
                    Text("≈ $0.50 USD", fontSize = 11.sp, color = Color.White.copy(.4f))
                }
            }
        }

        if (user.coins < 500) {
            Spacer(Modifier.height(10.dp))
            Surface(shape = RoundedCornerShape(12.dp), color = Warning.copy(.08f), border = BorderStroke(1.dp, Warning.copy(.3f))) {
                Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.WarningAmber, null, tint = Warning, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("You need at least 500 SC to withdraw.", fontSize = 12.sp, color = Warning)
                }
            }
        }

        Spacer(Modifier.height(22.dp))

        // Payment method selector
        Text("Select Payment Method", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextMuted)
        Spacer(Modifier.height(10.dp))

        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            payMethods.take(2).forEach { method ->
                MethodCard(
                    modifier = Modifier.weight(1f),
                    method = method,
                    selected = selectedMethod.id == method.id,
                    onClick = { selectedMethod = method; address = "" }
                )
            }
        }
        Spacer(Modifier.height(8.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            payMethods.drop(2).forEach { method ->
                MethodCard(
                    modifier = Modifier.weight(1f),
                    method = method,
                    selected = selectedMethod.id == method.id,
                    onClick = { selectedMethod = method; address = "" }
                )
            }
        }

        Spacer(Modifier.height(22.dp))

        // Form
        AnimatedContent(
            targetState = selectedMethod,
            transitionSpec = { fadeIn(tween(200)) togetherWith fadeOut(tween(150)) },
            label = "form"
        ) { method ->
            Column {
                Text("${method.name} Details", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrime)
                Spacer(Modifier.height(12.dp))

                // Amount
                AuthField(
                    label = "Amount (SC) — Minimum 500",
                    value = amountStr,
                    onValue = { amountStr = it.filter { c -> c.isDigit() } },
                    keyboardType = KeyboardType.Number,
                    leadingIcon = Icons.Default.MonetizationOn
                )
                Spacer(Modifier.height(10.dp))

                // Address
                AuthField(
                    label = method.fieldLabel,
                    value = address,
                    onValue = { address = it },
                    keyboardType = KeyboardType.Text,
                    leadingIcon = Icons.Default.AlternateEmail
                )
            }
        }

        Spacer(Modifier.height(20.dp))

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

        // Info footer
        Spacer(Modifier.height(14.dp))
        Surface(shape = RoundedCornerShape(10.dp), color = BgCard, border = BorderStroke(1.dp, Border)) {
            Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.AccessTime, null, tint = TextDim, modifier = Modifier.size(15.dp))
                Spacer(Modifier.width(8.dp))
                Text("Processing time: 1–3 business days — subject to admin approval.", fontSize = 12.sp, color = TextDim, lineHeight = 18.sp)
            }
        }

        // History
        if (state.withdrawals.isNotEmpty()) {
            Spacer(Modifier.height(28.dp))
            Text("Withdrawal History", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrime)
            Spacer(Modifier.height(12.dp))
            state.withdrawals.forEach { w ->
                val statusColor = when (w.status) {
                    "approved" -> Success; "rejected" -> Danger; else -> Warning
                }
                val matchedMethod = payMethods.find { it.id == w.method }

                Surface(Modifier.fillMaxWidth().padding(bottom = 8.dp),
                    shape = RoundedCornerShape(14.dp), color = BgCard, border = BorderStroke(1.dp, Border)) {
                    Row(Modifier.fillMaxWidth().padding(14.dp, 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            // Method badge
                            Box(
                                Modifier.size(40.dp).clip(RoundedCornerShape(10.dp))
                                    .background(matchedMethod?.gradient ?: Brush.linearGradient(listOf(BgCard2, BgCard2))),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(matchedMethod?.symbol ?: w.method.take(2).uppercase(),
                                    fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                            }
                            Spacer(Modifier.width(10.dp))
                            Column {
                                Text(matchedMethod?.name ?: w.method, fontWeight = FontWeight.SemiBold, fontSize = 13.sp, color = TextPrime)
                                Text((w.walletAddress ?: "—").let { if (it.length > 20) it.take(20) + "…" else it },
                                    fontSize = 11.sp, color = TextDim)
                                Text(w.createdAt.take(10), fontSize = 11.sp, color = TextDim)
                            }
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("${w.amount} SC", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrime)
                            Spacer(Modifier.height(4.dp))
                            Surface(shape = RoundedCornerShape(6.dp), color = statusColor.copy(.12f)) {
                                Text(w.status.replaceFirstChar { it.uppercase() },
                                    Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                    fontSize = 11.sp, fontWeight = FontWeight.Bold, color = statusColor)
                            }
                        }
                    }
                }
            }
        }

        Spacer(Modifier.height(88.dp))
    }
}

@Composable
private fun MethodCard(modifier: Modifier, method: PaymentMethod, selected: Boolean, onClick: () -> Unit) {
    val borderColor by animateColorAsState(
        targetValue = if (selected) method.accent else Border,
        animationSpec = tween(200),
        label = "border"
    )
    val bgColor by animateColorAsState(
        targetValue = if (selected) method.accent.copy(.08f) else BgCard,
        animationSpec = tween(200),
        label = "bg"
    )

    Surface(
        modifier = modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        color = bgColor,
        border = BorderStroke(if (selected) 2.dp else 1.dp, borderColor)
    ) {
        Column(
            Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                Modifier.size(44.dp).clip(RoundedCornerShape(12.dp)).background(method.gradient),
                contentAlignment = Alignment.Center
            ) {
                Text(method.symbol, fontSize = 12.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
            }
            Spacer(Modifier.height(8.dp))
            Text(method.name, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrime,
                maxLines = 1, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
            Text(method.subtitle, fontSize = 10.sp, color = TextDim,
                maxLines = 1, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
        }
    }
}
