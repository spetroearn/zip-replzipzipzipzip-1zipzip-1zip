package com.spetro.earn.ui.screens

import android.content.Context
import android.net.Uri
import androidx.browser.customtabs.CustomTabColorSchemeParams
import androidx.browser.customtabs.CustomTabsIntent
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.spetro.earn.network.OfferwallItem
import com.spetro.earn.ui.theme.*
import com.spetro.earn.viewmodel.AppViewModel

private val wallColors = listOf(
    Color(0xFF3b82f6), Color(0xFF8b5cf6), Color(0xFF10b981),
    Color(0xFFf59e0b), Color(0xFFef4444), Color(0xFF06b6d4)
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
        Spacer(Modifier.height(20.dp))

        val walls = state.offerwalls.filter { it.enabled && it.url != null }

        if (walls.isEmpty() && !state.loading) {
            Box(Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.SearchOff, null, tint = TextDim, modifier = Modifier.size(48.dp))
                    Spacer(Modifier.height(12.dp))
                    Text("No offerwalls available", fontSize = 15.sp, color = TextMuted)
                    Text("Check back soon", fontSize = 13.sp, color = TextDim)
                }
            }
        } else {
            walls.forEachIndexed { i, wall ->
                OfferwallCard(wall, wallColors[i % wallColors.size], ctx)
                Spacer(Modifier.height(12.dp))
            }
        }

        Spacer(Modifier.height(80.dp))
    }
}

@Composable
private fun OfferwallCard(wall: OfferwallItem, color: Color, ctx: Context) {
    Surface(
        modifier = Modifier.fillMaxWidth().clickable { openUrl(ctx, wall.url!!) },
        shape = RoundedCornerShape(16.dp),
        color = BgCard,
        border = BorderStroke(1.dp, Border)
    ) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier.size(52.dp).clip(RoundedCornerShape(14.dp)).background(color.copy(.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Stars, null, tint = color, modifier = Modifier.size(28.dp))
            }
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f)) {
                Text(wall.name, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = TextPrime)
                Text("Complete tasks • Earn coins", fontSize = 12.sp, color = TextMuted)
            }
            Box(
                Modifier.size(36.dp).clip(RoundedCornerShape(10.dp)).background(color.copy(.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.ChevronRight, null, tint = color, modifier = Modifier.size(20.dp))
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
