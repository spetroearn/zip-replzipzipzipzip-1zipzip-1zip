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
    val withdrawals: List<WithdrawalRecord> = emptyList(),
    val coinEarnAmount: Int = 0,
    val showCoinEarnAnim: Boolean = false,
)

class AppViewModel : ViewModel() {
    private val api get() = ApiClient.service

    private val _state = MutableStateFlow(AppState())
    val state: StateFlow<AppState> = _state.asStateFlow()

    private fun update(block: AppState.() -> AppState) = _state.update { it.block() }
    private fun toast(msg: String) = update { copy(toast = msg) }
    fun clearToast() = update { copy(toast = null) }
    fun clearCoinAnim() = update { copy(showCoinEarnAnim = false, coinEarnAmount = 0) }

    private fun triggerCoinAnim(amount: Int) {
        update { copy(coinEarnAmount = amount, showCoinEarnAnim = true) }
    }

    init { fetchMe() }

    fun fetchMe() = viewModelScope.launch {
        update { copy(loading = true) }
        try {
            val r = api.me()
            update { copy(user = if (r.isSuccessful) r.body()?.user else null, loading = false) }
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

    fun logout(onDone: () -> Unit) = viewModelScope.launch {
        try { api.logout() } catch (_: Exception) {}
        ApiClient.clearSession()
        update { AppState(loading = false) }
        onDone()
    }

    fun onGoogleAuthComplete() = fetchMe()

    // ── Coins ─────────────────────────────────────────────────────────────────
    fun claimDaily() = viewModelScope.launch {
        try {
            val r = api.claimDaily()
            if (r.isSuccessful) {
                val body = r.body()!!
                triggerCoinAnim(5)
                toast("Day ${body.checkinStreak} check-in — +${5} SC earned!")
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

    // ── Offerwalls ────────────────────────────────────────────────────────────
    fun loadOfferwalls() = viewModelScope.launch {
        try {
            val r = api.offerwallConfig()
            if (r.isSuccessful) update { copy(offerwalls = r.body()?.walls ?: emptyList()) }
        } catch (_: Exception) {}
    }

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
