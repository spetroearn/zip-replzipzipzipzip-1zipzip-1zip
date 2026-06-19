package com.spetro.earn.ui.screens

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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.spetro.earn.ui.theme.*
import com.spetro.earn.viewmodel.AppViewModel

private val methods = listOf("PayPal", "Bank Transfer", "Crypto (USDT)", "Gift Card")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WithdrawScreen(vm: AppViewModel) {
    val state by vm.state.collectAsState()
    val user = state.user ?: return
    var method by remember { mutableStateOf(methods[0]) }
    var amountStr by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var expanded by remember { mutableStateOf(false) }

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
        Surface(shape = RoundedCornerShape(16.dp), color = BgCard, border = BorderStroke(1.dp, Border)) {
            Row(Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween) {
                Column {
                    Text("Available Balance", fontSize = 12.sp, color = TextMuted)
                    Text("${user.coins} SC", fontSize = 26.sp, fontWeight = FontWeight.ExtraBold, color = Primary)
                    Text("≈ ${"%.2f".format(user.coins / 1000.0)} USD", fontSize = 12.sp, color = TextDim)
                }
                Box(Modifier.size(48.dp).clip(RoundedCornerShape(12.dp)).background(Primary.copy(.12f)),
                    contentAlignment = Alignment.Center) {
                    Icon(Icons.Default.AccountBalanceWallet, null, tint = Primary, modifier = Modifier.size(26.dp))
                }
            }
        }

        if (user.coins < 500) {
            Spacer(Modifier.height(12.dp))
            Surface(shape = RoundedCornerShape(12.dp), color = Warning.copy(.1f), border = BorderStroke(1.dp, Warning.copy(.3f))) {
                Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Info, null, tint = Warning, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Minimum 500 SC required to withdraw", fontSize = 13.sp, color = Warning)
                }
            }
        }

        Spacer(Modifier.height(20.dp))

        // Method selector
        Text("Payment Method", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextMuted)
        Spacer(Modifier.height(6.dp))

        ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }) {
            OutlinedTextField(
                value = method,
                onValueChange = {},
                readOnly = true,
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                modifier = Modifier.fillMaxWidth().menuAnchor(),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Primary,
                    unfocusedBorderColor = Border,
                    focusedContainerColor = BgCard2,
                    unfocusedContainerColor = BgCard2,
                    focusedTextColor = TextPrime,
                    unfocusedTextColor = TextPrime
                )
            )
            ExposedDropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false }
            ) {
                methods.forEach { m ->
                    DropdownMenuItem(
                        text = { Text(m, color = TextPrime) },
                        onClick = { method = m; expanded = false },
                        modifier = Modifier.background(BgCard2)
                    )
                }
            }
        }

        Spacer(Modifier.height(12.dp))

        // Amount
        Text("Amount (SC)", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextMuted)
        Spacer(Modifier.height(6.dp))
        SpetroField("e.g. 1000", amountStr, { amountStr = it.filter { c -> c.isDigit() } },
            KeyboardType.Number, Icons.Default.MonetizationOn)

        Spacer(Modifier.height(12.dp))

        // Address
        Text("Account / Address", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextMuted)
        Spacer(Modifier.height(6.dp))
        SpetroField("PayPal email / wallet / IBAN", address, { address = it },
            KeyboardType.Text, Icons.Default.AlternateEmail)

        Spacer(Modifier.height(20.dp))

        val amount = amountStr.toIntOrNull() ?: 0
        GradientButton(
            text = "Submit Withdrawal",
            onClick = { vm.submitWithdraw(method, amount, address) { amountStr = ""; address = "" } },
            enabled = amount >= 500 && amount <= user.coins && address.isNotBlank()
        )

        // History
        if (state.withdrawals.isNotEmpty()) {
            Spacer(Modifier.height(28.dp))
            Text("Withdrawal History", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrime)
            Spacer(Modifier.height(12.dp))
            state.withdrawals.forEach { w ->
                val statusColor = when (w.status) {
                    "approved" -> Success
                    "rejected" -> Danger
                    else -> Warning
                }
                Surface(Modifier.fillMaxWidth().padding(bottom = 8.dp),
                    shape = RoundedCornerShape(12.dp), color = BgCard, border = BorderStroke(1.dp, Border)) {
                    Row(Modifier.fillMaxWidth().padding(14.dp, 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically) {
                        Column {
                            Text(w.method, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = TextPrime)
                            Text(w.address.take(24) + if (w.address.length > 24) "…" else "",
                                fontSize = 11.sp, color = TextDim)
                            Text(w.createdAt.take(10), fontSize = 11.sp, color = TextDim)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("${w.amount} SC", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrime)
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

        Spacer(Modifier.height(80.dp))
    }
}
