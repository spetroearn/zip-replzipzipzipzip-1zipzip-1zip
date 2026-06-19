package com.spetro.earn.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.spetro.earn.ui.theme.*
import com.spetro.earn.viewmodel.AppViewModel

private data class NavItem(val route: String, val label: String, val icon: ImageVector)

private val navItems = listOf(
    NavItem("home",    "Home",     Icons.Default.Home),
    NavItem("earn",    "Earn",     Icons.Default.Stars),
    NavItem("withdraw","Withdraw", Icons.Default.AccountBalanceWallet),
    NavItem("profile", "Profile",  Icons.Default.Person),
)

@Composable
fun MainScreen(vm: AppViewModel, onLogout: () -> Unit) {
    val state by vm.state.collectAsState()
    var current by remember { mutableStateOf("home") }

    // Toast
    state.toast?.let { msg ->
        LaunchedEffect(msg) {
            kotlinx.coroutines.delay(3500)
            vm.clearToast()
        }
    }

    Scaffold(
        containerColor = BgDeep,
        bottomBar = {
            NavigationBar(
                containerColor = BgCard,
                tonalElevation = 0.dp,
                modifier = Modifier.height(64.dp)
            ) {
                navItems.forEach { item ->
                    val selected = current == item.route
                    NavigationBarItem(
                        selected = selected,
                        onClick = { current = item.route },
                        icon = {
                            Icon(item.icon, null,
                                modifier = Modifier.size(22.dp),
                                tint = if (selected) Primary else TextDim)
                        },
                        label = {
                            Text(item.label, fontSize = 10.sp, fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                                color = if (selected) Primary else TextDim)
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor   = Primary,
                            unselectedIconColor = TextDim,
                            indicatorColor      = Primary.copy(.15f)
                        )
                    )
                }
            }
        },
        snackbarHost = {
            state.toast?.let { msg ->
                Snackbar(
                    modifier = Modifier.padding(16.dp),
                    containerColor = if (msg.startsWith("✅")) Success.copy(.9f) else if (msg.startsWith("🎉")) Color(0xFF8b5cf6).copy(.9f) else Danger.copy(.9f),
                    contentColor = Color.White,
                ) {
                    Text(msg, fontSize = 13.sp)
                }
            }
        }
    ) { padding ->
        Box(Modifier.padding(padding)) {
            when (current) {
                "home"     -> HomeScreen(vm)
                "earn"     -> EarnScreen(vm)
                "withdraw" -> WithdrawScreen(vm)
                "profile"  -> ProfileScreen(vm, onLogout)
            }
        }
    }
}
