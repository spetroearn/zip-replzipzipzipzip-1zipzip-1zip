package com.spetro.earn.ui.screens

import android.content.Context
import android.net.Uri
import androidx.browser.customtabs.CustomTabColorSchemeParams
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.spetro.earn.network.OfferwallItem
import com.spetro.earn.ui.theme.*
import com.spetro.earn.viewmodel.AppViewModel

private data class WallBrand(
    val displayName: String,
    val description: String,
    val category: String,
    val accent: Color,
    val gradient: Brush
)

private val brandMap = mapOf(
    "adjoe" to WallBrand(
        "adjoe", "Gaming & Playtime Rewards", "GAMING",
        Color(0xFF3b82f6),
        Brush.linearGradient(listOf(Color(0xFF1e3a8a), Color(0xFF3b82f6)))
    ),
    "revu" to WallBrand(
        "RevU", "Surveys & Opinion Research", "SURVEYS",
        Color(0xFF8b5cf6),
        Brush.linearGradient(listOf(Color(0xFF4c1d95), Color(0xFF8b5cf6)))
    ),
    "offery" to WallBrand(
        "Offery", "App Installs & Free Trials", "INSTALLS",
        Color(0xFFf59e0b),
        Brush.linearGradient(listOf(Color(0xFF78350f), Color(0xFFf59e0b)))
    ),
    "ovnix" to WallBrand(
        "Ovnix", "CPA & Affiliate Offers", "CPA",
        Color(0xFF10b981),
        Brush.linearGradient(listOf(Color(0xFF064e3b), Color(0xFF10b981)))
    ),
    "adtowall" to WallBrand(
        "AdToWall", "Video Ads & Rewarded Content", "VIDEO ADS",
        Color(0xFF06b6d4),
        Brush.linearGradient(listOf(Color(0xFF164e63), Color(0xFF06b6d4)))
    ),
    "taskwall" to WallBrand(
        "TaskWall", "Task Completion Rewards", "TASKS",
        Color(0xFFef4444),
        Brush.linearGradient(listOf(Color(0xFF7f1d1d), Color(0xFFef4444)))
    ),
    "torox" to WallBrand(
        "Torox", "Premium Rewarded Offers", "PREMIUM",
        Color(0xFF6366f1),
        Brush.linearGradient(listOf(Color(0xFF312e81), Color(0xFF6366f1)))
    ),
    "mychips" to WallBrand(
        "MyChips", "Chip & Coin Earn Platform", "REWARDS",
        Color(0xFFf97316),
        Brush.linearGradient(listOf(Color(0xFF7c2d12), Color(0xFFf97316)))
    )
)

@Composable
fun EarnScreen(vm: AppViewModel) {
    val state by vm.state.collectAsState()
    val ctx = LocalContext.current

    LaunchedEffect(Unit) { vm.loadOfferwalls() }

    Column(
        Modifier
            .fillMaxSize()
            .background(BgDeep)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp)
    ) {
        Spacer(Modifier.height(16.dp))
        Text("Earn Coins", fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = TextPrime)
        Text("Complete offers and earn Spetro Coins", fontSize = 13.sp, color = TextMuted)
        Spacer(Modifier.height(6.dp))

        // Info bar
        Surface(shape = RoundedCornerShape(12.dp), color = Primary.copy(.08f), border = BorderStroke(1.dp, Primary.copy(.2f))) {
            Row(Modifier.fillMaxWidth().padding(12.dp, 10.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Info, null, tint = Primary, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(8.dp))
                Text("Coins are credited automatically within minutes after completing an offer.", fontSize = 12.sp, color = Primary)
            }
        }

        Spacer(Modifier.height(16.dp))

        if (state.offerwalls.isEmpty() && !state.loading) {
            Box(Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.HourglassEmpty, null, tint = TextDim, modifier = Modifier.size(44.dp))
                    Spacer(Modifier.height(12.dp))
                    Text("Loading offerwalls…", fontSize = 15.sp, color = TextMuted)
                }
            }
        } else {
            // Use server config but enrich with brand data
            val walls = state.offerwalls.filter { it.enabled }
            walls.forEachIndexed { idx, wall ->
                val networkId = wall.id.lowercase()
                val brand = brandMap[networkId]
                WallCard(wall = wall, brand = brand, ctx = ctx, index = idx)
                Spacer(Modifier.height(12.dp))
            }
        }

        Spacer(Modifier.height(88.dp))
    }
}

@Composable
private fun WallCard(wall: OfferwallItem, brand: WallBrand?, ctx: Context, index: Int) {
    val accent = brand?.accent ?: Color(0xFF3b82f6)
    val hasUrl = !wall.url.isNullOrBlank()

    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        kotlinx.coroutines.delay(index * 80L)
        visible = true
    }

    AnimatedVisibility(
        visible = visible,
        enter = fadeIn(tween(300)) + slideInVertically(tween(300)) { 30 }
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth().clickable(enabled = hasUrl) {
                if (hasUrl) openUrl(ctx, wall.url!!)
            },
            shape = RoundedCornerShape(18.dp),
            color = BgCard,
            border = BorderStroke(1.dp, if (hasUrl) accent.copy(.25f) else Border)
        ) {
            Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                // Brand icon
                Box(
                    Modifier
                        .size(54.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(brand?.gradient ?: Brush.linearGradient(listOf(BgCard2, BgCard2))),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        (brand?.displayName ?: wall.name).take(2).uppercase(),
                        fontSize = 17.sp, fontWeight = FontWeight.ExtraBold, color = Color.White
                    )
                }

                Spacer(Modifier.width(14.dp))

                Column(Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(brand?.displayName ?: wall.name, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = TextPrime)
                        Spacer(Modifier.width(8.dp))
                        if (brand?.category != null) {
                            Surface(shape = RoundedCornerShape(5.dp), color = accent.copy(.12f)) {
                                Text(
                                    brand.category,
                                    Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                    fontSize = 9.sp, fontWeight = FontWeight.Bold, color = accent
                                )
                            }
                        }
                    }
                    Spacer(Modifier.height(3.dp))
                    Text(brand?.description ?: "Complete offers and earn coins", fontSize = 12.sp, color = TextMuted)
                    if (!hasUrl) {
                        Spacer(Modifier.height(4.dp))
                        Text("Coming soon", fontSize = 11.sp, color = TextDim)
                    }
                }

                Spacer(Modifier.width(8.dp))
                Icon(
                    if (hasUrl) Icons.Default.ArrowForwardIos else Icons.Default.Lock,
                    null,
                    tint = if (hasUrl) accent else TextDim,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}

private fun openUrl(ctx: Context, url: String) {
    try {
        val params = CustomTabColorSchemeParams.Builder().setToolbarColor(0xFF0f172a.toInt()).build()
        CustomTabsIntent.Builder()
            .setColorScheme(CustomTabsIntent.COLOR_SCHEME_DARK)
            .setColorSchemeParams(CustomTabsIntent.COLOR_SCHEME_DARK, params)
            .build()
            .launchUrl(ctx, Uri.parse(url))
    } catch (_: Exception) {}
}
