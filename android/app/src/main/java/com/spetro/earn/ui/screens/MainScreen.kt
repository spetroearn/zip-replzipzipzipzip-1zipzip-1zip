package com.spetro.earn.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.spetro.earn.ui.theme.*
import com.spetro.earn.viewmodel.AppViewModel

private data class NavItem(val route: String, val label: String, val icon: ImageVector, val selectedIcon: ImageVector)

private val navItems = listOf(
    NavItem("home",     "Home",     Icons.Default.Home,                 Icons.Default.Home),
    NavItem("earn",     "Earn",     Icons.Default.Stars,                Icons.Default.Stars),
    NavItem("withdraw", "Withdraw", Icons.Default.AccountBalanceWallet, Icons.Default.AccountBalanceWallet),
    NavItem("profile",  "Profile",  Icons.Default.Person,               Icons.Default.Person),
)

@Composable
fun MainScreen(vm: AppViewModel, onLogout: () -> Unit) {
    val state by vm.state.collectAsState()
    var current by remember { mutableStateOf("home") }

    // Toast auto-dismiss
    LaunchedEffect(state.toast) {
        if (state.toast != null) {
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
                modifier = Modifier.height(62.dp)
            ) {
                navItems.forEach { item ->
                    val selected = current == item.route
                    NavigationBarItem(
                        selected = selected,
                        onClick = { current = item.route },
                        icon = {
                            val scale by animateFloatAsState(
                                targetValue = if (selected) 1.15f else 1f,
                                animationSpec = spring(Spring.DampingRatioMediumBouncy),
                                label = "icon_scale"
                            )
                            Icon(
                                if (selected) item.selectedIcon else item.icon,
                                contentDescription = item.label,
                                modifier = Modifier.size((22 * scale).dp),
                                tint = if (selected) Primary else TextDim
                            )
                        },
                        label = {
                            Text(
                                item.label,
                                fontSize = 10.sp,
                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                                color = if (selected) Primary else TextDim
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor   = Primary,
                            unselectedIconColor = TextDim,
                            indicatorColor      = Primary.copy(.14f)
                        )
                    )
                }
            }
        }
    ) { padding ->
        // Name setup dialog — for users with auto-generated Google names (contain digits)
        if (state.showNameDialog) {
            NameSetupDialog(vm = vm, onDone = { vm.dismissNameDialog() })
        }

        Box(Modifier.padding(padding)) {
            AnimatedContent(
                targetState = current,
                transitionSpec = {
                    val forward = navItems.indexOfFirst { it.route == targetState } >
                                  navItems.indexOfFirst { it.route == initialState }
                    (fadeIn(tween(220)) + slideInHorizontally(tween(220)) { if (forward) 60 else -60 }) togetherWith
                    (fadeOut(tween(160)) + slideOutHorizontally(tween(160)) { if (forward) -60 else 60 })
                },
                label = "main_nav"
            ) { tab ->
                when (tab) {
                    "home"     -> HomeScreen(vm, onNavigate = { current = it })
                    "earn"     -> EarnScreen(vm)
                    "withdraw" -> WithdrawScreen(vm)
                    "profile"  -> ProfileScreen(vm, onLogout)
                }
            }
        }

        // Toast snackbar
        state.toast?.let { msg ->
            val isGood = msg.contains("check-in", ignoreCase = true) ||
                         msg.contains("success", ignoreCase = true) ||
                         msg.contains("submitted", ignoreCase = true)
            Box(
                Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(bottom = 8.dp),
                contentAlignment = Alignment.BottomCenter
            ) {
                AnimatedVisibility(
                    visible = true,
                    enter = fadeIn(tween(250)) + slideInVertically(tween(250)) { 40 },
                    exit = fadeOut(tween(200))
                ) {
                    Surface(
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(14.dp),
                        color = if (isGood) Color(0xFF065f46) else Color(0xFF7f1d1d),
                        shadowElevation = 8.dp,
                        modifier = Modifier.padding(horizontal = 16.dp)
                    ) {
                        Text(
                            msg, Modifier.padding(16.dp, 12.dp),
                            fontSize = 13.sp, color = Color.White, fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        }
    }
}
