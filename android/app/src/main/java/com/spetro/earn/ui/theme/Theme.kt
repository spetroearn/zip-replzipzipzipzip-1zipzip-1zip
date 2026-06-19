package com.spetro.earn.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// ── Colours ───────────────────────────────────────────────────────────────────
val BgDeep     = Color(0xFF070f19)
val BgCard     = Color(0xFF0f172a)
val BgCard2    = Color(0xFF1e293b)
val Primary    = Color(0xFF3b82f6)
val PrimaryDk  = Color(0xFF1d4ed8)
val Success    = Color(0xFF10b981)
val Warning    = Color(0xFFf59e0b)
val Danger     = Color(0xFFef4444)
val TextPrime  = Color(0xFFf8fafc)
val TextMuted  = Color(0xFF94a3b8)
val TextDim    = Color(0xFF64748b)
val Border     = Color(0xFF1e293b)

private val darkColorScheme = darkColorScheme(
    primary          = Primary,
    onPrimary        = Color.White,
    secondary        = Primary,
    background       = BgDeep,
    surface          = BgCard,
    surfaceVariant   = BgCard2,
    onBackground     = TextPrime,
    onSurface        = TextPrime,
    onSurfaceVariant = TextMuted,
    outline          = Border,
    error            = Danger,
)

val Typography = Typography(
    headlineLarge = TextStyle(fontWeight = FontWeight.ExtraBold, fontSize = 28.sp, color = TextPrime),
    headlineMedium = TextStyle(fontWeight = FontWeight.Bold, fontSize = 22.sp, color = TextPrime),
    titleLarge = TextStyle(fontWeight = FontWeight.Bold, fontSize = 18.sp, color = TextPrime),
    titleMedium = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 15.sp, color = TextPrime),
    bodyMedium = TextStyle(fontSize = 14.sp, color = TextMuted),
    bodySmall = TextStyle(fontSize = 12.sp, color = TextDim),
    labelMedium = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 13.sp),
)

@Composable
fun SpetroTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme,
        typography  = Typography,
        content     = content
    )
}
