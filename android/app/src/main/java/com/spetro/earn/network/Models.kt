package com.spetro.earn.network

import com.google.gson.annotations.SerializedName

// ── Auth ──────────────────────────────────────────────────────────────────────
data class UserDto(
    val id: Int,
    val name: String,
    val email: String,
    val coins: Int,
    val xp: Int = 0,
    @SerializedName("welcome_claimed") val welcomeClaimed: Boolean = false,
    @SerializedName("created_at") val createdAt: String = ""
)

data class AuthResponse(val user: UserDto)
data class LoginRequest(val email: String, val password: String)
data class RegisterRequest(val name: String, val email: String, val password: String)

// ── Coins ─────────────────────────────────────────────────────────────────────
data class DailyResponse(
    val coins: Int,
    val streak: Int,
    val message: String = ""
)

data class ClaimResponse(
    val coins: Int,
    val message: String = ""
)

data class Transaction(
    val id: Int,
    val type: String,
    val amount: Int,
    val description: String,
    @SerializedName("created_at") val createdAt: String
)

data class HistoryResponse(val transactions: List<Transaction>)

// ── Offerwalls ────────────────────────────────────────────────────────────────
data class OfferwallItem(
    val id: String,
    val name: String,
    val enabled: Boolean,
    val url: String?,
    val color: String = "#3b82f6"
)

data class OfferwallConfigResponse(val walls: List<OfferwallItem>)

// ── Withdraw ──────────────────────────────────────────────────────────────────
data class WithdrawRequest(
    val method: String,
    val amount: Int,
    val address: String
)

data class WithdrawalRecord(
    val id: Int,
    val method: String,
    val amount: Int,
    val address: String,
    val status: String,
    @SerializedName("created_at") val createdAt: String
)

data class WithdrawalsResponse(val withdrawals: List<WithdrawalRecord>)
data class WithdrawResponse(val message: String)

// ── Generic error ─────────────────────────────────────────────────────────────
data class ApiError(val error: String)
