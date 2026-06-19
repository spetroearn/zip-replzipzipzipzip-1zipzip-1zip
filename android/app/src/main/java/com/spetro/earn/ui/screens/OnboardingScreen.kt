package com.spetro.earn.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.*
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.spetro.earn.ui.theme.*
import kotlinx.coroutines.launch

private data class OnboardPage(
    val icon: ImageVector,
    val iconBg: Brush,
    val title: String,
    val subtitle: String,
    val items: List<Pair<ImageVector, String>>
)

private val pages = listOf(
    OnboardPage(
        icon = Icons.Default.Bolt,
        iconBg = Brush.linearGradient(listOf(Color(0xFF3b82f6), Color(0xFF1d4ed8))),
        title = "Welcome to Spetro Earn",
        subtitle = "Earn real rewards by completing simple tasks and daily activities.",
        items = listOf(
            Icons.Default.CheckCircle to "Free to join — no hidden fees",
            Icons.Default.Security to "Secure & tamper-proof balances",
            Icons.Default.Public to "Available worldwide"
        )
    ),
    OnboardPage(
        icon = Icons.Default.Stars,
        iconBg = Brush.linearGradient(listOf(Color(0xFF8b5cf6), Color(0xFF6d28d9))),
        title = "Multiple Ways to Earn",
        subtitle = "Collect Spetro Coins from a variety of earn methods every day.",
        items = listOf(
            Icons.Default.CalendarToday to "Daily 7-day check-in streak",
            Icons.Default.Storefront to "8+ offerwall partners",
            Icons.Default.Assignment to "Complete tasks & surveys"
        )
    ),
    OnboardPage(
        icon = Icons.Default.AccountBalanceWallet,
        iconBg = Brush.linearGradient(listOf(Color(0xFF10b981), Color(0xFF059669))),
        title = "Withdraw Real Rewards",
        subtitle = "Convert your coins to real money via multiple payment methods.",
        items = listOf(
            Icons.Default.CreditCard to "Visa / Mastercard",
            Icons.Default.CurrencyBitcoin to "Binance USDT & Litecoin",
            Icons.Default.CardGiftcard to "Google Play Gift Cards"
        )
    )
)

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun OnboardingScreen(onDone: () -> Unit) {
    val pagerState = rememberPagerState(pageCount = { pages.size })
    val scope = rememberCoroutineScope()

    Box(
        Modifier
            .fillMaxSize()
            .background(BgDeep)
    ) {
        HorizontalPager(state = pagerState, modifier = Modifier.fillMaxSize()) { pageIdx ->
            OnboardPageContent(pages[pageIdx])
        }

        // Bottom controls
        Column(
            Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter)
                .padding(horizontal = 24.dp, vertical = 40.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Dots
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                repeat(pages.size) { i ->
                    val selected = pagerState.currentPage == i
                    val width by animateDpAsState(
                        targetValue = if (selected) 28.dp else 8.dp,
                        animationSpec = spring(Spring.DampingRatioMediumBouncy)
                    )
                    Box(
                        Modifier
                            .height(8.dp)
                            .width(width)
                            .clip(CircleShape)
                            .background(if (selected) Primary else BgCard2)
                    )
                }
            }

            Spacer(Modifier.height(28.dp))

            if (pagerState.currentPage < pages.size - 1) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    TextButton(onClick = onDone) {
                        Text("Skip", color = TextMuted, fontSize = 15.sp)
                    }
                    Box(
                        Modifier
                            .clip(RoundedCornerShape(14.dp))
                            .background(Brush.linearGradient(listOf(Primary, PrimaryDk)))
                            .clickable {
                                scope.launch {
                                    pagerState.animateScrollToPage(pagerState.currentPage + 1)
                                }
                            }
                            .padding(horizontal = 28.dp, vertical = 14.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Next", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color.White)
                            Spacer(Modifier.width(6.dp))
                            Icon(Icons.Default.ArrowForward, null, tint = Color.White, modifier = Modifier.size(16.dp))
                        }
                    }
                }
            } else {
                Box(
                    Modifier
                        .fillMaxWidth()
                        .height(54.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(Brush.linearGradient(listOf(Primary, PrimaryDk)))
                        .clickable(onClick = onDone),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Get Started", fontWeight = FontWeight.ExtraBold, fontSize = 17.sp, color = Color.White)
                }
            }
        }
    }
}

@Composable
private fun OnboardPageContent(page: OnboardPage) {
    Column(
        Modifier
            .fillMaxSize()
            .padding(horizontal = 28.dp)
            .padding(top = 80.dp, bottom = 160.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Animated icon
        val infiniteTransition = rememberInfiniteTransition(label = "icon")
        val scale by infiniteTransition.animateFloat(
            initialValue = 1f, targetValue = 1.06f, label = "scale",
            animationSpec = infiniteRepeatable(
                animation = tween(2000, easing = EaseInOut),
                repeatMode = RepeatMode.Reverse
            )
        )

        Box(
            Modifier
                .size((100 * scale).dp)
                .clip(RoundedCornerShape(28.dp))
                .background(page.iconBg),
            contentAlignment = Alignment.Center
        ) {
            Icon(page.icon, null, tint = Color.White, modifier = Modifier.size(52.dp))
        }

        Spacer(Modifier.height(36.dp))
        Text(
            page.title, fontSize = 26.sp, fontWeight = FontWeight.ExtraBold,
            color = TextPrime, textAlign = TextAlign.Center, lineHeight = 32.sp
        )
        Spacer(Modifier.height(12.dp))
        Text(
            page.subtitle, fontSize = 15.sp, color = TextMuted,
            textAlign = TextAlign.Center, lineHeight = 22.sp
        )
        Spacer(Modifier.height(32.dp))

        page.items.forEach { (icon, text) ->
            Row(
                Modifier
                    .fillMaxWidth()
                    .padding(vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = Primary.copy(alpha = 0.12f),
                    modifier = Modifier.size(36.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(icon, null, tint = Primary, modifier = Modifier.size(18.dp))
                    }
                }
                Spacer(Modifier.width(14.dp))
                Text(text, fontSize = 14.sp, color = TextMuted)
            }
        }
    }
}
