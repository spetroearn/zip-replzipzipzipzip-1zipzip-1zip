package com.spetro.earn.ui.screens

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.spetro.earn.network.Transaction
import com.spetro.earn.ui.theme.*
import com.spetro.earn.viewmodel.AppViewModel

@Composable
fun HomeScreen(vm: AppViewModel) {
    val state by vm.state.collectAsState()
    val user = state.user ?: return

    LaunchedEffect(Unit) {
        vm.loadHistory()
    }

    Column(
        Modifier
            .fillMaxSize()
            .background(BgDeep)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp)
    ) {
        Spacer(Modifier.height(16.dp))

        // Header
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column {
                Text("Welcome back,", fontSize = 13.sp, color = TextMuted)
                Text(user.name.split(" ").first(), fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, color = TextPrime)
            }
            Box(
                Modifier.size(42.dp).clip(RoundedCornerShape(12.dp)).background(BgCard2),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Person, null, tint = Primary, modifier = Modifier.size(22.dp))
            }
        }

        Spacer(Modifier.height(20.dp))

        // Coin balance card
        Box(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(Brush.linearGradient(listOf(Color(0xFF1d3a6e), Color(0xFF1e3a8a), Primary)))
                .padding(24.dp)
        ) {
            Column {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Bolt, null, tint = Color(0xFFfbbf24), modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("YOUR BALANCE", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.White.copy(.7f))
                }
                Spacer(Modifier.height(8.dp))
                Text("${user.coins} SC", fontSize = 38.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                Text("≈ ${"%.2f".format(user.coins / 1000.0)} USD", fontSize = 13.sp, color = Color.White.copy(.6f))
            }
        }

        Spacer(Modifier.height(20.dp))

        // Action cards
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            ActionCard(
                modifier = Modifier.weight(1f),
                icon = Icons.Default.CalendarToday,
                title = "Daily Check-in",
                subtitle = "Claim your streak bonus",
                color = Primary,
                onClick = { vm.claimDaily() }
            )
            if (!user.welcomeClaimed) {
                ActionCard(
                    modifier = Modifier.weight(1f),
                    icon = Icons.Default.CardGiftcard,
                    title = "Welcome Bonus",
                    subtitle = "One-time reward",
                    color = Color(0xFF8b5cf6),
                    onClick = { vm.claimWelcome() }
                )
            } else {
                ActionCard(
                    modifier = Modifier.weight(1f),
                    icon = Icons.Default.TrendingUp,
                    title = "Your XP",
                    subtitle = "${user.xp} XP earned",
                    color = Success,
                    onClick = {}
                )
            }
        }

        Spacer(Modifier.height(24.dp))

        // Stats row
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            StatChip(Modifier.weight(1f), "1,000 SC", "= $1 USD")
            StatChip(Modifier.weight(1f), "500 SC", "Min withdraw")
            StatChip(Modifier.weight(1f), "1-3 days", "Processing")
        }

        Spacer(Modifier.height(24.dp))

        // Recent transactions
        if (state.transactions.isNotEmpty()) {
            Text("Recent Activity", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = TextPrime)
            Spacer(Modifier.height(12.dp))
            state.transactions.take(10).forEach { tx ->
                TransactionRow(tx)
                Spacer(Modifier.height(8.dp))
            }
        }

        Spacer(Modifier.height(80.dp))
    }
}

@Composable
private fun ActionCard(
    modifier: Modifier = Modifier,
    icon: ImageVector,
    title: String,
    subtitle: String,
    color: Color,
    onClick: () -> Unit
) {
    Surface(
        modifier = modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        color = BgCard,
        border = BorderStroke(1.dp, Border)
    ) {
        Column(Modifier.padding(16.dp)) {
            Box(
                Modifier.size(38.dp).clip(RoundedCornerShape(10.dp)).background(color.copy(.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, null, tint = color, modifier = Modifier.size(20.dp))
            }
            Spacer(Modifier.height(10.dp))
            Text(title, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = TextPrime)
            Text(subtitle, fontSize = 11.sp, color = TextMuted)
        }
    }
}

@Composable
private fun StatChip(modifier: Modifier = Modifier, value: String, label: String) {
    Surface(modifier = modifier, shape = RoundedCornerShape(12.dp), color = BgCard, border = BorderStroke(1.dp, Border)) {
        Column(Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value, fontWeight = FontWeight.ExtraBold, fontSize = 13.sp, color = Primary)
            Text(label, fontSize = 10.sp, color = TextMuted)
        }
    }
}

@Composable
private fun TransactionRow(tx: Transaction) {
    val isPos = tx.amount > 0
    Surface(shape = RoundedCornerShape(12.dp), color = BgCard, border = BorderStroke(1.dp, Border)) {
        Row(
            Modifier.fillMaxWidth().padding(12.dp, 10.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    Modifier.size(34.dp).clip(RoundedCornerShape(8.dp))
                        .background(if (isPos) Success.copy(.12f) else Danger.copy(.12f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        if (isPos) Icons.Default.AddCircle else Icons.Default.RemoveCircle,
                        null, tint = if (isPos) Success else Danger, modifier = Modifier.size(18.dp)
                    )
                }
                Spacer(Modifier.width(10.dp))
                Column {
                    Text(tx.description, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextPrime)
                    Text(tx.createdAt.take(10), fontSize = 11.sp, color = TextDim)
                }
            }
            Text(
                "${if (isPos) "+" else ""}${tx.amount} SC",
                fontWeight = FontWeight.Bold, fontSize = 14.sp,
                color = if (isPos) Success else Danger
            )
        }
    }
}
