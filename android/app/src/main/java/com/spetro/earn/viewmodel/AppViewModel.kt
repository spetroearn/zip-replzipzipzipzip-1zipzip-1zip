package com.spetro.earn.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.spetro.earn.network.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class AppState(
    val loading: Boolean = true,
    val user: UserDto? = null,
    val toast: String? = null,
    val transactions: List<Transaction> = emptyList(),
    val offerwalls: List<OfferwallItem> = emptyList(),
    val withdrawals: List<WithdrawalRecord> = emptyList(),
)

class AppViewModel : ViewModel() {
    private val api get() = ApiClient.service

    private val _state = MutableStateFlow(AppState())
    val state: StateFlow<AppState> = _state.asStateFlow()

    // ── helpers ───────────────────────────────────────────────────────────────
    private fun update(block: AppState.() -> AppState) =
        _state.update { it.block() }

    private fun toast(msg: String) = update { copy(toast = msg) }
    fun clearToast() = update { copy(toast = null) }

    // ── init ──────────────────────────────────────────────────────────────────
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

    // ── auth ──────────────────────────────────────────────────────────────────
    fun login(email: String, password: String, onSuccess: () -> Unit) =
        viewModelScope.launch {
            update { copy(loading = true) }
            try {
                val r = api.login(LoginRequest(email.trim(), password))
                if (r.isSuccessful) {
                    update { copy(user = r.body()?.user, loading = false) }
                    onSuccess()
                } else {
                    val msg = parseError(r.errorBody()?.string())
                    update { copy(loading = false) }
                    toast(msg)
                }
            } catch (e: Exception) {
                update { copy(loading = false) }
                toast("Connection error. Check your internet.")
            }
        }

    fun register(name: String, email: String, password: String, onSuccess: () -> Unit) =
        viewModelScope.launch {
            update { copy(loading = true) }
            try {
                val r = api.register(RegisterRequest(name.trim(), email.trim(), password))
                if (r.isSuccessful) {
                    update { copy(user = r.body()?.user, loading = false) }
                    onSuccess()
                } else {
                    val msg = parseError(r.errorBody()?.string())
                    update { copy(loading = false) }
                    toast(msg)
                }
            } catch (e: Exception) {
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

    // ── called after Google OAuth Custom Tab returns ──────────────────────────
    fun onGoogleAuthComplete() = fetchMe()

    // ── coins ─────────────────────────────────────────────────────────────────
    fun claimDaily() = viewModelScope.launch {
        try {
            val r = api.claimDaily()
            if (r.isSuccessful) {
                val body = r.body()!!
                toast("✅ Daily bonus: +${body.coins} SC (Streak: ${body.streak})")
                fetchMe()
            } else {
                toast(parseError(r.errorBody()?.string()))
            }
        } catch (e: Exception) {
            toast("Connection error.")
        }
    }

    fun claimWelcome() = viewModelScope.launch {
        try {
            val r = api.claimWelcome()
            if (r.isSuccessful) {
                toast("🎉 Welcome bonus: +${r.body()?.coins ?: 0} SC!")
                fetchMe()
            } else {
                toast(parseError(r.errorBody()?.string()))
            }
        } catch (e: Exception) {
            toast("Connection error.")
        }
    }

    fun loadHistory() = viewModelScope.launch {
        try {
            val r = api.coinHistory()
            if (r.isSuccessful) update { copy(transactions = r.body()?.transactions ?: emptyList()) }
        } catch (_: Exception) {}
    }

    // ── offerwalls ────────────────────────────────────────────────────────────
    fun loadOfferwalls() = viewModelScope.launch {
        try {
            val r = api.offerwallConfig()
            if (r.isSuccessful) update { copy(offerwalls = r.body()?.walls ?: emptyList()) }
        } catch (_: Exception) {}
    }

    // ── withdraw ──────────────────────────────────────────────────────────────
    fun submitWithdraw(method: String, amount: Int, address: String, onSuccess: () -> Unit) =
        viewModelScope.launch {
            try {
                val r = api.submitWithdraw(WithdrawRequest(method, amount, address))
                if (r.isSuccessful) {
                    toast("✅ Withdrawal submitted!")
                    fetchMe()
                    loadWithdrawals()
                    onSuccess()
                } else {
                    toast(parseError(r.errorBody()?.string()))
                }
            } catch (e: Exception) {
                toast("Connection error.")
            }
        }

    fun loadWithdrawals() = viewModelScope.launch {
        try {
            val r = api.myWithdrawals()
            if (r.isSuccessful) update { copy(withdrawals = r.body()?.withdrawals ?: emptyList()) }
        } catch (_: Exception) {}
    }

    // ── util ──────────────────────────────────────────────────────────────────
    private fun parseError(body: String?): String {
        if (body == null) return "Something went wrong."
        return try {
            val gson = com.google.gson.Gson()
            gson.fromJson(body, ApiError::class.java)?.error ?: "Something went wrong."
        } catch (_: Exception) { "Something went wrong." }
    }
}
