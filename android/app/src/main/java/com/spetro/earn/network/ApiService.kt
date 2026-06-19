package com.spetro.earn.network

import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // Auth
    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequest): Response<AuthResponse>

    @POST("api/auth/register")
    suspend fun register(@Body body: RegisterRequest): Response<AuthResponse>

    @POST("api/auth/logout")
    suspend fun logout(): Response<Unit>

    @GET("api/auth/me")
    suspend fun me(): Response<AuthResponse>

    @POST("api/auth/update-name")
    suspend fun updateName(@Body body: UpdateNameRequest): Response<SimpleResponse>

    @GET("api/auth/vpn-check")
    suspend fun vpnCheck(): Response<VpnCheckResponse>

    // Coins
    @POST("api/coins/claim/daily")
    suspend fun claimDaily(): Response<DailyResponse>

    @GET("api/coins/history")
    suspend fun coinHistory(): Response<HistoryResponse>

    // Offerwalls — server returns { config: { network_id: { url, enabled } } }
    @GET("api/offerwalls/config")
    suspend fun offerwallConfig(): Response<OfferwallConfigMap>

    // Withdraw
    @POST("api/withdraw")
    suspend fun submitWithdraw(@Body body: WithdrawRequest): Response<WithdrawResponse>

    @GET("api/withdraw/my")
    suspend fun myWithdrawals(): Response<WithdrawalsResponse>
}
