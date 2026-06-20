package com.spetro.earn.ui.screens

import android.content.Context
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.animation.*
import androidx.compose.animation.core.*
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
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.spetro.earn.R
import com.spetro.earn.network.Transaction
import com.spetro.earn.ui.theme.*
import com.spetro.earn.viewmodel.AppViewModel
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun HomeScreen(vm: AppViewModel, onNavigate: (String) -> Unit = {}) {
    val state by vm.state.collectAsState()
    val user = state.user ?: return
    val ctx = LocalContext.current

    LaunchedEffect(Unit) { vm.loadHistory() }

    // Auto-clear coin animation after 1.5s
    LaunchedEffect(state.showCoinEarnAnim) {
        if (state.showCoinEarnAnim) {
            kotlinx.coroutines.delay(1500)
            vm.clearCoinAnim()
        }
    }

    Box(Modifier.fillMaxSize()) {
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
                    Text("Welcome back,", fontSize = 12.sp, color = TextMuted)
                    Text(user.name.split(" ").first(), fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = TextPrime)
                }
                androidx.compose.foundation.Image(
                    painter = painterResource(R.drawable.app_logo),
                    contentDescription = "Spetro Earn",
                    modifier = Modifier.size(40.dp).clip(RoundedCornerShape(10.dp)),
                    contentScale = ContentScale.Fit
                )
            }

            Spacer(Modifier.height(18.dp))

            // Coin balance card
            val coinScale by animateFloatAsState(
                targetValue = if (state.showCoinEarnAnim) 1.06f else 1f,
                animationSpec = spring(Spring.DampingRatioMediumBouncy),
                label = "scale"
            )

            Box(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(22.dp))
                    .background(Brush.linearGradient(listOf(Color(0xFF1e3a8a), Color(0xFF1d4ed8), Primary, Color(0xFF0ea5e9))))
                    .padding(20.dp)
            ) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text("YOUR BALANCE", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.White.copy(.65f), letterSpacing = 1.sp)
                        Spacer(Modifier.height(4.dp))
                        Text(
                            "${user.coins} SC",
                            fontSize = 34.sp, fontWeight = FontWeight.ExtraBold, color = Color.White,
                            modifier = Modifier.scale(coinScale)
                        )
                        Text("≈ ${"%.2f".format(user.coins / 1000.0)} USD", fontSize = 12.sp, color = Color.White.copy(.55f))
                    }
                    Column(
                        horizontalAlignment = Alignment.End,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        QuickBtn("Earn", Icons.Default.Stars) { onNavigate("earn") }
                        QuickBtn("Withdraw", Icons.Default.AccountBalanceWallet) { onNavigate("withdraw") }
                    }
                }
            }

            Spacer(Modifier.height(18.dp))

            // Weekly check-in
            WeeklyCheckinCard(
                checkinStreak = user.checkinStreak,
                lastCheckin = user.lastCheckin,
                onClaim = { vm.claimDaily() }
            )

            Spacer(Modifier.height(18.dp))

            // Social buttons
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                SocialBtn(Modifier.weight(1f), Icons.Default.PlayCircle, "Follow on YouTube", Color(0xFFef4444)) {
                    openUrl(ctx, "https://www.youtube.com/@SpetroEarn")
                }
                SocialBtn(Modifier.weight(1f), Icons.Default.Star, "Rate on Trustpilot", Color(0xFF00b67a)) {
                    openUrl(ctx, "https://www.trustpilot.com/review/spetroearn.com")
                }
            }

            // Recent activity
            if (state.transactions.isNotEmpty()) {
                Spacer(Modifier.height(22.dp))
                Text("Recent Activity", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = TextPrime)
                Spacer(Modifier.height(10.dp))
                state.transactions.take(8).forEach { tx ->
                    TxRow(tx)
                    Spacer(Modifier.height(7.dp))
                }
            }

            Spacer(Modifier.height(88.dp))
        }

        // Coin earn animation overlay
        AnimatedVisibility(
            visible = state.showCoinEarnAnim,
            enter = fadeIn(tween(150)) + slideInVertically { 30 },
            exit = fadeOut(tween(500)) + slideOutVertically { -70 },
            modifier = Modifier.align(Alignment.Center)
        ) {
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = Success.copy(.95f),
                shadowElevation = 20.dp
            ) {
                Row(Modifier.padding(horizontal = 22.dp, vertical = 13.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.AddCircle, null, tint = Color.White, modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("+${state.coinEarnAmount} SC", fontWeight = FontWeight.ExtraBold, fontSize = 20.sp, color = Color.White)
                }
            }
        }
    }
}

// ── Weekly 7-day check-in ─────────────────────────────────────────────────────

@Composable
private fun WeeklyCheckinCard(
    checkinStreak: Int,
    lastCheckin: String?,
    onClaim: () -> Unit
) {
    val todayStr = remember { SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date()) }
    // Use take(10) to handle both "2026-06-19" and "2026-06-19T00:00:00.000Z" formats
    val alreadyClaimed = lastCheckin?.take(10) == todayStr
    val claimedDays = if (alreadyClaimed) checkinStreak else maxOf(0, checkinStreak % 7)

    Surface(
        shape = RoundedCornerShape(20.dp),
        color = BgCard,
        border = BorderStroke(1.dp, Border),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text("Daily Check-in", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = TextPrime)
                    Text(
                        if (alreadyClaimed) "Come back tomorrow!" else "Claim your daily reward",
                        fontSize = 12.sp, color = TextMuted
                    )
                }
                if (!alreadyClaimed) {
                    Box(
                        Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(Brush.linearGradient(listOf(Primary, PrimaryDk)))
                            .clickable(onClick = onClaim)
                            .padding(horizontal = 14.dp, vertical = 8.dp)
                    ) {
                        Text("Claim +5 SC", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color.White)
                    }
                } else {
                    Surface(shape = RoundedCornerShape(10.dp), color = Success.copy(.12f)) {
                        Text(
                            "Claimed",
                            Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                            fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Success
                        )
                    }
                }
            }

            Spacer(Modifier.height(14.dp))

            // 7-day grid
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                for (day in 1..7) {
                    val claimed = day <= claimedDays
                    val isToday = !alreadyClaimed && day == claimedDays + 1
                    DayBox(modifier = Modifier.weight(1f), day = day, claimed = claimed, isToday = isToday)
                }
            }
        }
    }
}

@Composable
private fun DayBox(modifier: Modifier, day: Int, claimed: Boolean, isToday: Boolean) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(
                when { claimed -> Success.copy(.13f); isToday -> Primary.copy(.13f); else -> BgCard2 }
            )
            .border(
                1.dp,
                when { claimed -> Success.copy(.35f); isToday -> Primary.copy(.5f); else -> Border },
                RoundedCornerShape(10.dp)
            )
            .padding(vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            "D$day", fontSize = 9.sp, fontWeight = FontWeight.Bold,
            color = when { claimed -> Success; isToday -> Primary; else -> TextDim }
        )
        Spacer(Modifier.height(4.dp))
        Icon(
            if (claimed) Icons.Default.CheckCircle else Icons.Default.Circle,
            null,
            tint = when { claimed -> Success; isToday -> Primary; else -> TextDim.copy(.4f) },
            modifier = Modifier.size(15.dp)
        )
        Spacer(Modifier.height(3.dp))
        Text("5SC", fontSize = 8.sp, color = if (claimed) Success else TextDim)
    }
}

// ── Supporting composables ────────────────────────────────────────────────────

@Composable
private fun QuickBtn(label: String, icon: ImageVector, onClick: () -> Unit) {
    Row(
        Modifier
            .clip(RoundedCornerShape(10.dp))
            .background(Color.White.copy(.12f))
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, null, tint = Color.White, modifier = Modifier.size(14.dp))
        Spacer(Modifier.width(5.dp))
        Text(label, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
    }
}

@Composable
private fun SocialBtn(modifier: Modifier, icon: ImageVector, label: String, color: Color, onClick: () -> Unit) {
    Surface(modifier = modifier.clickable(onClick = onClick), shape = RoundedCornerShape(14.dp), color = BgCard, border = BorderStroke(1.dp, Border)) {
        Row(
            Modifier.padding(horizontal = 12.dp, vertical = 11.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Box(Modifier.size(26.dp).clip(RoundedCornerShape(7.dp)).background(color.copy(.12f)), contentAlignment = Alignment.Center) {
                Icon(icon, null, tint = color, modifier = Modifier.size(15.dp))
            }
            Spacer(Modifier.width(8.dp))
            Text(label, fontWeight = FontWeight.SemiBold, fontSize = 12.sp, color = TextPrime)
        }
    }
}

@Composable
private fun TxRow(tx: Transaction) {
    val isPos = tx.amount > 0
    Surface(shape = RoundedCornerShape(14.dp), color = BgCard, border = BorderStroke(1.dp, Border)) {
        Row(
            Modifier.fillMaxWidth().padding(12.dp, 10.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    Modifier.size(34.dp).clip(RoundedCornerShape(9.dp))
                        .background(if (isPos) Success.copy(.1f) else Danger.copy(.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        if (isPos) Icons.Default.ArrowDownward else Icons.Default.ArrowUpward,
                        null, tint = if (isPos) Success else Danger, modifier = Modifier.size(15.dp)
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

private fun openUrl(ctx: Context, url: String) {
    try {
        CustomTabsIntent.Builder().setColorScheme(CustomTabsIntent.COLOR_SCHEME_DARK).build()
            .launchUrl(ctx, Uri.parse(url))
    } catch (_: Exception) {}
}
