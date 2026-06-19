package com.spetro.earn.ui.screens

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

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            containerColor = BgCard,
            title = { Text("Sign Out?", color = TextPrime) },
            text = { Text("Are you sure you want to sign out?", color = TextMuted) },
            confirmButton = {
                TextButton(onClick = { vm.logout(onLogout) }) {
                    Text("Sign Out", color = Danger, fontWeight = FontWeight.Bold)
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
        Spacer(Modifier.height(24.dp))

        // Avatar
        Box(
            Modifier
                .size(80.dp)
                .clip(CircleShape)
                .background(Brush.linearGradient(listOf(Primary, PrimaryDk))),
            contentAlignment = Alignment.Center
        ) {
            Text(
                user.name.firstOrNull()?.uppercaseChar()?.toString() ?: "?",
                fontSize = 32.sp, fontWeight = FontWeight.ExtraBold, color = Color.White
            )
        }

        Spacer(Modifier.height(12.dp))
        Text(user.name, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TextPrime)
        Text(user.email, fontSize = 13.sp, color = TextMuted)

        Spacer(Modifier.height(20.dp))

        // Stats
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            StatCard(Modifier.weight(1f), "${user.coins}", "SC Balance", Primary)
            StatCard(Modifier.weight(1f), "${user.xp}", "XP Earned", Color(0xFF8b5cf6))
        }

        Spacer(Modifier.height(24.dp))

        // Account info
        SectionTitle("Account Info")
        Spacer(Modifier.height(10.dp))

        InfoRow(Icons.Default.Person, "Name", user.name)
        Spacer(Modifier.height(8.dp))
        InfoRow(Icons.Default.Email, "Email", user.email)
        Spacer(Modifier.height(8.dp))
        InfoRow(Icons.Default.CalendarToday, "Member Since", user.createdAt.take(10))

        Spacer(Modifier.height(24.dp))

        // Rates info
        SectionTitle("Rates & Limits")
        Spacer(Modifier.height(10.dp))

        Surface(Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp), color = BgCard, border = BorderStroke(1.dp, Border)) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                RateRow("Exchange Rate", "1,000 SC = $1 USD")
                Divider(color = Border)
                RateRow("Minimum Withdrawal", "500 SC")
                Divider(color = Border)
                RateRow("Processing Time", "1–3 business days")
                Divider(color = Border)
                RateRow("App Version", "2.0.0")
            }
        }

        Spacer(Modifier.height(24.dp))

        // Sign out
        OutlinedButton(
            onClick = { showLogoutDialog = true },
            modifier = Modifier.fillMaxWidth().height(50.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.outlinedButtonColors(containerColor = Danger.copy(.08f)),
            border = BorderStroke(1.dp, Danger.copy(.4f))
        ) {
            Icon(Icons.Default.Logout, null, tint = Danger, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text("Sign Out", color = Danger, fontWeight = FontWeight.Bold, fontSize = 15.sp)
        }

        Spacer(Modifier.height(80.dp))
    }
}

@Composable
private fun StatCard(modifier: Modifier = Modifier, value: String, label: String, color: Color) {
    Surface(modifier = modifier, shape = RoundedCornerShape(14.dp), color = BgCard, border = BorderStroke(1.dp, Border)) {
        Column(Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = color)
            Text(label, fontSize = 12.sp, color = TextMuted)
        }
    }
}

@Composable
private fun SectionTitle(text: String) {
    Row(Modifier.fillMaxWidth()) {
        Text(text, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextMuted)
    }
}

@Composable
private fun InfoRow(icon: ImageVector, label: String, value: String) {
    Surface(Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), color = BgCard, border = BorderStroke(1.dp, Border)) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, null, tint = Primary, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(10.dp))
            Column {
                Text(label, fontSize = 11.sp, color = TextDim)
                Text(value, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = TextPrime)
            }
        }
    }
}

@Composable
private fun RateRow(label: String, value: String) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, fontSize = 13.sp, color = TextMuted)
        Text(value, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextPrime)
    }
}
