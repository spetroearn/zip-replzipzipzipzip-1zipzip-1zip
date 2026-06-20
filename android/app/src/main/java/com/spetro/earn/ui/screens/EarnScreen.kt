package com.spetro.earn.ui.screens

import android.app.Activity
import android.content.Context
import android.net.Uri
import androidx.browser.customtabs.CustomTabColorSchemeParams
import androidx.browser.customtabs.CustomTabsIntent
import com.spetro.earn.sdk.AdjoeManager
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
        "adjoe Playtime", "Earn coins by playing mobile games", "GAMING",
        Color(0xFF3b82f6),
        Brush.linearGradient(listOf(Color(0xFF1e3a8a), Color(0xFF2563eb)))
    ),
    "revu" to WallBrand(
        "RevU", "Surveys & market research", "SURVEYS",
        Color(0xFF8b5cf6),
        Brush.linearGradient(listOf(Color(0xFF4c1d95), Color(0xFF7c3aed)))
    ),
    "offery" to WallBrand(
        "Offery", "App installs & free trial offers", "INSTALLS",
        Color(0xFFf59e0b),
        Brush.linearGradient(listOf(Color(0xFF78350f), Color(0xFFd97706)))
    ),
    "ovnix" to WallBrand(
        "Ovnix", "CPA & affiliate premium offers", "CPA",
        Color(0xFF10b981),
        Brush.linearGradient(listOf(Color(0xFF064e3b), Color(0xFF059669)))
    ),
    "adtowall" to WallBrand(
        "AdToWall", "Watch video ads & earn coins", "VIDEO ADS",
        Color(0xFF06b6d4),
        Brush.linearGradient(listOf(Color(0xFF164e63), Color(0xFF0891b2)))
    ),
    "taskwall" to WallBrand(
        "TaskWall", "Complete tasks and get rewarded", "TASKS",
        Color(0xFFef4444),
        Brush.linearGradient(listOf(Color(0xFF7f1d1d), Color(0xFFdc2626)))
    ),
    "torox" to WallBrand(
        "Torox", "Premium rewarded offer wall", "PREMIUM",
        Color(0xFF6366f1),
        Brush.linearGradient(listOf(Color(0xFF312e81), Color(0xFF4f46e5)))
    ),
    "mychips" to WallBrand(
        "MyChips", "Chip & coin reward platform", "REWARDS",
        Color(0xFFf97316),
        Brush.linearGradient(listOf(Color(0xFF7c2d12), Color(0xFFea580c)))
    )
)

@Composable
fun EarnScreen(vm: AppViewModel) {
    val state by vm.state.collectAsState()
    val ctx = LocalContext.current

    LaunchedEffect(Unit) {
        vm.loadOfferwalls()
        vm.checkVpn()
    }

    Column(
        Modifier
            .fillMaxSize()
            .background(BgDeep)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp)
    ) {
        Spacer(Modifier.height(16.dp))
        Text("Earn Coins", fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = TextPrime)
        Text("Complete offers to earn Spetro Coins", fontSize = 13.sp, color = TextMuted)
        Spacer(Modifier.height(14.dp))

        // VPN / Proxy block
        if (state.vpnChecked && state.vpnBlocked) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                color = Danger.copy(.08f),
                border = BorderStroke(1.dp, Danger.copy(.3f))
            ) {
                Column(Modifier.padding(18.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Shield, null, tint = Danger, modifier = Modifier.size(36.dp))
                    Spacer(Modifier.height(10.dp))
                    Text("VPN / Proxy Detected", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Danger)
                    Spacer(Modifier.height(6.dp))
                    Text(
                        "Offerwalls are unavailable while connected to a VPN, proxy, or high-risk network. Disable it and try again.",
                        fontSize = 13.sp, color = TextMuted,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                        lineHeight = 19.sp
                    )
                    Spacer(Modifier.height(12.dp))
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = Danger.copy(.12f),
                        border = BorderStroke(1.dp, Danger.copy(.25f))
                    ) {
                        Text(
                            "Risk Score: ${state.vpnRiskScore}/100",
                            Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Danger
                        )
                    }
                }
            }
            Spacer(Modifier.height(88.dp))
            return@Column
        }

        // Info
        Surface(shape = RoundedCornerShape(12.dp), color = Primary.copy(.07f), border = BorderStroke(1.dp, Primary.copy(.18f))) {
            Row(Modifier.fillMaxWidth().padding(12.dp, 9.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Info, null, tint = Primary, modifier = Modifier.size(15.dp))
                Spacer(Modifier.width(8.dp))
                Text("Coins credited automatically after completing an offer.", fontSize = 12.sp, color = Primary)
            }
        }

        Spacer(Modifier.height(14.dp))

        // Loading state — show skeleton cards
        if (state.offerwallsLoading) {
            repeat(4) {
                Surface(Modifier.fillMaxWidth().height(80.dp).padding(bottom = 10.dp), shape = RoundedCornerShape(16.dp), color = BgCard, border = BorderStroke(1.dp, Border)) {}
            }
        } else {
            val serverMap = state.offerwalls.associateBy { it.id.lowercase() }
            val userUid = state.user?.uid ?: state.user?.id?.toString() ?: ""

            // ── Featured top row: adjoe + taskwall as big squares ─────────
            val featuredIds = listOf("adjoe", "taskwall")
            val regularIds  = listOf("revu", "offery", "ovnix", "adtowall", "torox", "mychips")

            val featuredEnabled = featuredIds.filter { id ->
                serverMap[id]?.enabled != false
            }
            if (featuredEnabled.isNotEmpty()) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    featuredEnabled.forEachIndexed { idx, networkId ->
                        val serverEntry = serverMap[networkId]
                        val url = serverEntry?.url?.takeIf { it.isNotBlank() }?.replace("{USER_ID}", userUid)
                        val brand = brandMap[networkId]
                        val sdkKey = serverEntry?.sdkKey
                        FeaturedWallCard(
                            networkId = networkId, url = url, brand = brand, ctx = ctx,
                            modifier = Modifier.weight(1f), index = idx, sdkKey = sdkKey
                        )
                    }
                    // If only one featured item, add spacer for balance
                    if (featuredEnabled.size == 1) Spacer(Modifier.weight(1f))
                }
                Spacer(Modifier.height(10.dp))
            }

            // ── Regular list ───────────────────────────────────────────────
            regularIds.forEachIndexed { idx, networkId ->
                val serverEntry = serverMap[networkId]
                val enabled = serverEntry?.enabled != false
                val url = serverEntry?.url?.takeIf { it.isNotBlank() }?.replace("{USER_ID}", userUid)
                val brand = brandMap[networkId]
                if (enabled) {
                    WallCard(networkId = networkId, url = url, brand = brand, ctx = ctx, index = idx + 2)
                    Spacer(Modifier.height(10.dp))
                }
            }
        }

        Spacer(Modifier.height(88.dp))
    }
}

@Composable
private fun FeaturedWallCard(
    networkId: String,
    url: String?,
    brand: WallBrand?,
    ctx: Context,
    modifier: Modifier = Modifier,
    index: Int = 0,
    sdkKey: String? = null
) {
    val accent = brand?.accent ?: Color(0xFF3b82f6)
    val hasSdk = !sdkKey.isNullOrBlank() && AdjoeManager.isAvailable()
    val hasUrl = !url.isNullOrBlank()
    val isClickable = hasSdk || hasUrl

    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        kotlinx.coroutines.delay(index * 80L)
        visible = true
    }

    AnimatedVisibility(
        visible = visible,
        enter = fadeIn(tween(300)) + scaleIn(tween(300), initialScale = 0.92f),
        modifier = modifier
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(0.85f)
                .clickable(enabled = isClickable) {
                    // Try native SDK first (adjoe Playtime), fall back to web URL
                    val sdkLaunched = if (hasSdk && ctx is Activity) {
                        AdjoeManager.launch(ctx, sdkKey!!)
                    } else false
                    if (!sdkLaunched && hasUrl) openUrl(ctx, url!!)
                },
            shape = RoundedCornerShape(22.dp),
            color = BgCard,
            border = BorderStroke(1.5.dp, if (hasUrl) accent.copy(.35f) else Border)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(brand?.gradient ?: Brush.linearGradient(listOf(BgCard2, BgCard2)))
            ) {
                Column(
                    Modifier.fillMaxSize().padding(16.dp),
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    // Category badge
                    Surface(shape = RoundedCornerShape(6.dp), color = Color.White.copy(.15f)) {
                        Text(
                            brand?.category ?: "EARN",
                            Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.White
                        )
                    }

                    Column {
                        // Initials badge
                        Box(
                            Modifier.size(48.dp).clip(RoundedCornerShape(14.dp)).background(Color.White.copy(.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                (brand?.displayName ?: networkId).take(2).uppercase(),
                                fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = Color.White
                            )
                        }
                        Spacer(Modifier.height(10.dp))
                        Text(
                            brand?.displayName ?: networkId.replaceFirstChar { it.uppercase() },
                            fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = Color.White
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            brand?.description ?: "Earn coins",
                            fontSize = 11.sp, color = Color.White.copy(.7f), lineHeight = 15.sp
                        )
                        Spacer(Modifier.height(12.dp))
                        if (hasUrl) {
                            Surface(shape = RoundedCornerShape(10.dp), color = Color.White.copy(.2f)) {
                                Row(
                                    Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text("Start Earning", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                    Spacer(Modifier.width(4.dp))
                                    Icon(Icons.Default.ArrowForwardIos, null, tint = Color.White, modifier = Modifier.size(10.dp))
                                }
                            }
                        } else {
                            Text("Coming soon", fontSize = 11.sp, color = Color.White.copy(.5f))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun WallCard(networkId: String, url: String?, brand: WallBrand?, ctx: Context, index: Int) {
    val accent = brand?.accent ?: Color(0xFF3b82f6)
    val hasUrl = !url.isNullOrBlank()

    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        kotlinx.coroutines.delay(index * 60L)
        visible = true
    }

    AnimatedVisibility(
        visible = visible,
        enter = fadeIn(tween(250)) + slideInVertically(tween(250)) { 24 }
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth().clickable(enabled = hasUrl) { if (hasUrl) openUrl(ctx, url!!) },
            shape = RoundedCornerShape(18.dp),
            color = BgCard,
            border = BorderStroke(1.dp, if (hasUrl) accent.copy(.25f) else Border)
        ) {
            Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                // Brand badge
                Box(
                    Modifier
                        .size(52.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(brand?.gradient ?: Brush.linearGradient(listOf(BgCard2, BgCard2))),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        (brand?.displayName ?: networkId).take(2).uppercase(),
                        fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = Color.White
                    )
                }

                Spacer(Modifier.width(14.dp))

                Column(Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            brand?.displayName ?: networkId.replaceFirstChar { it.uppercase() },
                            fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrime
                        )
                        Spacer(Modifier.width(7.dp))
                        if (brand?.category != null) {
                            Surface(shape = RoundedCornerShape(4.dp), color = accent.copy(.1f)) {
                                Text(
                                    brand.category,
                                    Modifier.padding(horizontal = 5.dp, vertical = 2.dp),
                                    fontSize = 8.sp, fontWeight = FontWeight.Bold, color = accent
                                )
                            }
                        }
                    }
                    Spacer(Modifier.height(2.dp))
                    Text(
                        brand?.description ?: "Complete offers and earn coins",
                        fontSize = 12.sp, color = TextMuted
                    )
                    if (!hasUrl) {
                        Spacer(Modifier.height(3.dp))
                        Text("URL not configured — set it in Admin panel", fontSize = 10.sp, color = TextDim)
                    }
                }

                Spacer(Modifier.width(8.dp))
                Icon(
                    if (hasUrl) Icons.Default.ArrowForwardIos else Icons.Default.Settings,
                    null,
                    tint = if (hasUrl) accent else TextDim,
                    modifier = Modifier.size(15.dp)
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
