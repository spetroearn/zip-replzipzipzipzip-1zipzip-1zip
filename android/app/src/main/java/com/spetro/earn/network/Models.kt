package com.spetro.earn.network

import com.google.gson.annotations.SerializedName

// ── Auth ──────────────────────────────────────────────────────────────────────
data class UserDto(
    val id: Int,
    val name: String,
    val email: String,
    val coins: Int,
    val uid: String? = null,
    val country: String? = null,
    @SerializedName("country_code") val countryCode: String? = null,
    @SerializedName("checkin_streak") val checkinStreak: Int = 0,
    @SerializedName("last_checkin") val lastCheckin: String? = null,
    @SerializedName("welcome_bonus_claimed") val welcomeClaimed: Boolean = false,
    @SerializedName("created_at") val createdAt: String = "",
    @SerializedName("avatar_seed") val avatarSeed: Int = 1
)

data class AuthResponse(val user: UserDto)

data class LoginRequest(val email: String, val password: String)

data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String,
    @SerializedName("termsAccepted") val termsAccepted: Boolean = true,
    @SerializedName("termsAcceptedAt") val termsAcceptedAt: String = "",
    @SerializedName("deviceId") val deviceId: String? = null
)

// ── Coins ─────────────────────────────────────────────────────────────────────
data class DailyResponse(
    val success: Boolean = false,
    val message: String = "",
    val coins: Int = 0,
    @SerializedName("checkin_streak") val checkinStreak: Int = 0
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
    @SerializedName("network_id") val networkId: String? = null
)

data class OfferwallConfigResponse(val walls: List<OfferwallItem>)

// ── Withdraw ──────────────────────────────────────────────────────────────────
data class WithdrawRequest(
    val method: String,
    val amount: Int,
    @SerializedName("wallet_address") val walletAddress: String
)

data class WithdrawalRecord(
    val id: Int,
    val method: String,
    val amount: Int,
    @SerializedName("wallet_address") val walletAddress: String?,
    val status: String,
    @SerializedName("created_at") val createdAt: String
)

data class WithdrawalsResponse(val withdrawals: List<WithdrawalRecord>)
data class WithdrawResponse(val message: String? = null, val success: Boolean = false)

// ── Generic ───────────────────────────────────────────────────────────────────
data class ApiError(val error: String)
