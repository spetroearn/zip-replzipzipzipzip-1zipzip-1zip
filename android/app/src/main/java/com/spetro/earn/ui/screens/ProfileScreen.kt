package com.spetro.earn.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.spetro.earn.ui.theme.*
import com.spetro.earn.viewmodel.AppViewModel

@Composable
fun ProfileScreen(vm: AppViewModel, onLogout: () -> Unit) {
    val state by vm.state.collectAsState()
    val user = state.user ?: return
    var showLogoutDialog by remember { mutableStateOf(false) }
    val ctx = LocalContext.current

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            containerColor = BgCard,
            shape = RoundedCornerShape(20.dp),
            title = { Text("Sign Out", color = TextPrime, fontWeight = FontWeight.Bold) },
            text = { Text("Are you sure you want to sign out of your account?", color = TextMuted) },
            confirmButton = {
                TextButton(onClick = { vm.logout(onLogout) }) {
                    Text("Sign Out", color = Danger, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text("Cancel", color = TextMuted)
                }
            }
        )
    }

    Column(
        Modifier
            .fillMaxSize()
            .background(BgDeep)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(28.dp))

        // Avatar
        val infiniteTransition = rememberInfiniteTransition(label = "avatar")
        val glow by infiniteTransition.animateFloat(
            initialValue = 0.5f, targetValue = 0.9f, label = "glow",
            animationSpec = infiniteRepeatable(tween(2000, easing = EaseInOut), RepeatMode.Reverse)
        )
        Box(contentAlignment = Alignment.Center) {
            Box(
                Modifier.size(92.dp).clip(CircleShape)
                    .background(Primary.copy(alpha = glow * 0.2f))
            )
            Box(
                Modifier.size(80.dp).clip(CircleShape)
                    .background(Brush.linearGradient(listOf(Primary, PrimaryDk))),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    user.name.firstOrNull()?.uppercaseChar()?.toString() ?: "S",
                    fontSize = 32.sp, fontWeight = FontWeight.ExtraBold, color = Color.White
                )
            }
        }

        Spacer(Modifier.height(14.dp))
        Text(user.name, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TextPrime)
        Text(user.email, fontSize = 13.sp, color = TextMuted)

        // Status badge
        Spacer(Modifier.height(8.dp))
        Surface(shape = RoundedCornerShape(8.dp), color = Success.copy(.1f), border = BorderStroke(1.dp, Success.copy(.3f))) {
            Row(Modifier.padding(horizontal = 10.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(6.dp).clip(CircleShape).background(Success))
                Spacer(Modifier.width(6.dp))
                Text("Active Account", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Success)
            }
        }

        Spacer(Modifier.height(22.dp))

        // Stats row
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            StatCard(Modifier.weight(1f), "${user.coins}", "SC Balance", Primary)
            StatCard(Modifier.weight(1f), "${user.checkinStreak}", "Day Streak", Success)
        }

        Spacer(Modifier.height(22.dp))

        // Account Info section
        SectionHeader("Account Information")
        Spacer(Modifier.height(10.dp))

        // UID
        val uid = user.uid ?: "—"
        InfoRow(Icons.Default.Fingerprint, "User ID") {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(uid, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Primary,
                    fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace)
                Spacer(Modifier.width(8.dp))
                IconButton(
                    onClick = {
                        val clipboard = ctx.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                        clipboard.setPrimaryClip(ClipData.newPlainText("Spetro UID", uid))
                        Toast.makeText(ctx, "UID copied!", Toast.LENGTH_SHORT).show()
                    },
                    modifier = Modifier.size(28.dp)
                ) {
                    Icon(Icons.Default.ContentCopy, null, tint = TextDim, modifier = Modifier.size(14.dp))
                }
            }
        }

        Spacer(Modifier.height(8.dp))
        InfoRow(Icons.Default.Person, "Name") {
            Text(user.name, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = TextPrime)
        }
        Spacer(Modifier.height(8.dp))
        InfoRow(Icons.Default.Email, "Email") {
            Text(user.email, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = TextPrime)
        }
        Spacer(Modifier.height(8.dp))
        InfoRow(Icons.Default.Public, "Country") {
            Text(
                user.country?.takeIf { it.isNotBlank() && it != "Unknown" } ?: "Detecting…",
                fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = TextPrime
            )
        }
        Spacer(Modifier.height(8.dp))
        InfoRow(Icons.Default.CalendarToday, "Member Since") {
            Text(user.createdAt.take(10).ifBlank { "—" }, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = TextPrime)
        }

        Spacer(Modifier.height(26.dp))

        // Sign out button
        OutlinedButton(
            onClick = { showLogoutDialog = true },
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.outlinedButtonColors(containerColor = Danger.copy(.06f)),
            border = BorderStroke(1.dp, Danger.copy(.4f))
        ) {
            Icon(Icons.Default.Logout, null, tint = Danger, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text("Sign Out", color = Danger, fontWeight = FontWeight.Bold, fontSize = 15.sp)
        }

        Spacer(Modifier.height(88.dp))
    }
}

@Composable
private fun StatCard(modifier: Modifier, value: String, label: String, color: Color) {
    Surface(modifier = modifier, shape = RoundedCornerShape(16.dp), color = BgCard, border = BorderStroke(1.dp, Border)) {
        Column(Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold, color = color)
            Text(label, fontSize = 12.sp, color = TextMuted)
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
    Row(Modifier.fillMaxWidth()) {
        Text(title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextMuted)
    }
}

@Composable
private fun InfoRow(icon: ImageVector, label: String, content: @Composable () -> Unit) {
    Surface(Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp), color = BgCard, border = BorderStroke(1.dp, Border)) {
        Row(Modifier.fillMaxWidth().padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier.size(34.dp).clip(RoundedCornerShape(9.dp)).background(Primary.copy(.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, null, tint = Primary, modifier = Modifier.size(17.dp))
            }
            Spacer(Modifier.width(12.dp))
            Column {
                Text(label, fontSize = 11.sp, color = TextDim)
                Spacer(Modifier.height(2.dp))
                content()
            }
        }
    }
}
