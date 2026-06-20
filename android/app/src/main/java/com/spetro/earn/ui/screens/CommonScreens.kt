package com.spetro.earn.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.spetro.earn.ui.theme.*

// Branded loading screen shown while the session is being restored, so the
// login screen never flashes before the app decides where to route the user.
@Composable
fun LoadingScreen() {
    Box(
        Modifier.fillMaxSize().background(BgDeep),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            SpetroLogo(size = 84)
            Spacer(Modifier.height(20.dp))
            Text("Spetro Earn", fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, color = TextPrime)
            Spacer(Modifier.height(20.dp))
            CircularProgressIndicator(color = Primary, strokeWidth = 2.5.dp, modifier = Modifier.size(26.dp))
        }
    }
}

// In-app notification rationale shown BEFORE the Android system permission
// dialog, so the user understands why we ask and can opt in.
@Composable
fun NotificationPermissionDialog(onAllow: () -> Unit, onDismiss: () -> Unit) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(dismissOnBackPress = true, dismissOnClickOutside = false)
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp),
            shape = RoundedCornerShape(20.dp),
            color = BgCard
        ) {
            Column(Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Box(
                    Modifier.size(64.dp).clip(RoundedCornerShape(18.dp)).background(Primary.copy(.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Notifications, null, tint = Primary, modifier = Modifier.size(32.dp))
                }
                Spacer(Modifier.height(16.dp))
                Text("Stay Updated", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrime, textAlign = TextAlign.Center)
                Spacer(Modifier.height(8.dp))
                Text(
                    "Allow notifications to get alerts when your coins are credited, withdrawals are approved, and new offers go live.",
                    fontSize = 13.sp, color = TextMuted, textAlign = TextAlign.Center, lineHeight = 19.sp
                )
                Spacer(Modifier.height(22.dp))
                GradientButton(text = "Allow Notifications", onClick = onAllow)
                Spacer(Modifier.height(8.dp))
                TextButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                    Text("Not now", fontSize = 13.sp, color = TextMuted)
                }
            }
        }
    }
}
