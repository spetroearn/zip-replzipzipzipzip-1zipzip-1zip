package com.spetro.earn.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.spetro.earn.network.*
import com.google.gson.Gson
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

data class AppState(
    val loading: Boolean = true,
    val user: UserDto? = null,
    val toast: String? = null,
    val transactions: List<Transaction> = emptyList(),
    val offerwalls: List<OfferwallItem> = emptyList(),
    val offerwallsLoading: Boolean = false,
    val withdrawals: List<WithdrawalRecord> = emptyList(),
    val coinEarnAmount: Int = 0,
    val showCoinEarnAnim: Boolean = false,
    val vpnBlocked: Boolean = false,
    val vpnRiskScore: Int = 0,
    val vpnChecked: Boolean = false,
    val showNameDialog: Boolean = false,
)

class AppViewModel : ViewModel() {
    private val api get() = ApiClient.service

    private val _state = MutableStateFlow(AppState())
    val state: StateFlow<AppState> = _state.asStateFlow()

    private fun update(block: AppState.() -> AppState) = _state.update { it.block() }
    private fun toast(msg: String) = update { copy(toast = msg) }
    fun clearToast() = update { copy(toast = null) }
    fun clearCoinAnim() = update { copy(showCoinEarnAnim = false, coinEarnAmount = 0) }
    fun dismissNameDialog() = update { copy(showNameDialog = false) }

    private fun triggerCoinAnim(amount: Int) {
        update { copy(coinEarnAmount = amount, showCoinEarnAnim = true) }
    }

    init { fetchMe() }

    fun fetchMe() = viewModelScope.launch {
        update { copy(loading = true) }
        try {
            val r = api.me()
            if (r.isSuccessful) {
                val user = r.body()?.user
                val needsNameSetup = user != null && user.name.any { it.isDigit() }
                update { copy(user = user, loading = false, showNameDialog = needsNameSetup) }
            } else {
                update { copy(user = null, loading = false) }
            }
        } catch (_: Exception) {
            update { copy(user = null, loading = false) }
        }
    }

    // ── Auth ──────────────────────────────────────────────────────────────────
    fun login(email: String, password: String, onSuccess: () -> Unit) = viewModelScope.launch {
        update { copy(loading = true) }
        try {
            val r = api.login(LoginRequest(email.trim(), password))
            if (r.isSuccessful) {
                val user = r.body()?.user
                val needsName = user != null && user.name.any { it.isDigit() }
                update { copy(user = user, loading = false, showNameDialog = needsName) }
                onSuccess()
            } else {
                update { copy(loading = false) }
                toast(parseError(r.errorBody()?.string()))
            }
        } catch (_: Exception) {
            update { copy(loading = false) }
            toast("Connection error. Check your internet.")
        }
    }

    fun register(
        name: String, email: String, password: String,
        deviceId: String? = null,
        onSuccess: () -> Unit
    ) = viewModelScope.launch {
        update { copy(loading = true) }
        try {
            val now = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }.format(Date())
            val r = api.register(
                RegisterRequest(
                    name = name.trim(), email = email.trim(), password = password,
                    termsAccepted = true, termsAcceptedAt = now, deviceId = deviceId
                )
            )
            if (r.isSuccessful) {
                update { copy(user = r.body()?.user, loading = false) }
                onSuccess()
            } else {
                update { copy(loading = false) }
                toast(parseError(r.errorBody()?.string()))
            }
        } catch (_: Exception) {
            update { copy(loading = false) }
            toast("Connection error. Check your internet.")
        }
    }

    fun updateName(name: String, onSuccess: () -> Unit) = viewModelScope.launch {
        try {
            val r = api.updateName(UpdateNameRequest(name.trim()))
            if (r.isSuccessful) {
                update { copy(showNameDialog = false) }
                fetchMe()
                onSuccess()
            } else {
                toast(parseError(r.errorBody()?.string()))
            }
        } catch (_: Exception) {
            toast("Connection error.")
        }
    }

    fun logout(onDone: () -> Unit) = viewModelScope.launch {
        try { api.logout() } catch (_: Exception) {}
        ApiClient.clearSession()
        update { AppState(loading = false) }
        onDone()
    }

    fun onGoogleAuthComplete() = fetchMe()

    // ── VPN check ─────────────────────────────────────────────────────────────
    fun checkVpn() = viewModelScope.launch {
        if (_state.value.vpnChecked) return@launch
        try {
            val r = api.vpnCheck()
            if (r.isSuccessful) {
                val body = r.body()!!
                update {
                    copy(
                        vpnBlocked = body.blocked || body.isVpn || body.riskScore >= 75,
                        vpnRiskScore = body.riskScore,
                        vpnChecked = true
                    )
                }
            }
        } catch (_: Exception) {
            update { copy(vpnChecked = true) }
        }
    }

    // ── Coins ─────────────────────────────────────────────────────────────────
    fun claimDaily() = viewModelScope.launch {
        try {
            val r = api.claimDaily()
            if (r.isSuccessful) {
                val body = r.body()!!
                triggerCoinAnim(5)
                toast("Day ${body.checkinStreak} check-in — +5 SC earned!")
                fetchMe()
                loadHistory()
            } else {
                toast(parseError(r.errorBody()?.string()))
            }
        } catch (_: Exception) {
            toast("Connection error.")
        }
    }

    fun loadHistory() = viewModelScope.launch {
        try {
            val r = api.coinHistory()
            if (r.isSuccessful) update { copy(transactions = r.body()?.transactions ?: emptyList()) }
        } catch (_: Exception) {}
    }

    // ── Offerwalls — parse { config: { id: { url, enabled } } } ──────────────
    fun loadOfferwalls() = viewModelScope.launch {
        update { copy(offerwallsLoading = true) }
        try {
            val r = api.offerwallConfig()
            if (r.isSuccessful) {
                val configMap = r.body()?.config ?: emptyMap()
                val walls = configMap.map { (id, cfg) ->
                    OfferwallItem(
                        id = id,
                        name = id,
                        enabled = cfg.enabled,
                        url = cfg.url?.takeIf { it.isNotBlank() },
                        sdkKey = cfg.sdkKey?.takeIf { it.isNotBlank() },
                        sdkAppId = cfg.sdkAppId?.takeIf { it.isNotBlank() }
                    )
                }
                update { copy(offerwalls = walls, offerwallsLoading = false) }
            } else {
                update { copy(offerwalls = buildFallbackWalls(), offerwallsLoading = false) }
            }
        } catch (_: Exception) {
            update { copy(offerwalls = buildFallbackWalls(), offerwallsLoading = false) }
        }
    }

    private fun buildFallbackWalls() = listOf(
        "adjoe", "revu", "offery", "ovnix", "adtowall", "taskwall", "torox", "mychips"
    ).map { OfferwallItem(id = it, name = it, enabled = true, url = null) }

    // ── Withdraw ──────────────────────────────────────────────────────────────
    fun submitWithdraw(method: String, amount: Int, address: String, onSuccess: () -> Unit) =
        viewModelScope.launch {
            try {
                val r = api.submitWithdraw(WithdrawRequest(method, amount, address))
                if (r.isSuccessful) {
                    toast("Withdrawal submitted successfully!")
                    fetchMe()
                    loadWithdrawals()
                    onSuccess()
                } else {
                    toast(parseError(r.errorBody()?.string()))
                }
            } catch (_: Exception) {
                toast("Connection error.")
            }
        }

    fun loadWithdrawals() = viewModelScope.launch {
        try {
            val r = api.myWithdrawals()
            if (r.isSuccessful) update { copy(withdrawals = r.body()?.withdrawals ?: emptyList()) }
        } catch (_: Exception) {}
    }

    // ── Util ──────────────────────────────────────────────────────────────────
    private fun parseError(body: String?): String {
        if (body == null) return "Something went wrong."
        return try { Gson().fromJson(body, ApiError::class.java)?.error ?: "Something went wrong." }
        catch (_: Exception) { "Something went wrong." }
    }
}
