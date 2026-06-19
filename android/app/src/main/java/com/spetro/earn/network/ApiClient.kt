package com.spetro.earn.network

import android.content.Context
import android.content.SharedPreferences
import okhttp3.*
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

private const val BASE_URL = "https://spetroearn.com/"
private const val PREFS_NAME = "spetro_cookies"

class PersistentCookieJar(context: Context) : CookieJar {
    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val jar = mutableMapOf<String, Cookie>()

    init {
        prefs.all.forEach { (key, value) ->
            if (value is String) runCatching {
                val p = value.split("|")
                if (p.size >= 3) jar[key] = Cookie.Builder()
                    .name(p[0]).value(p[1]).domain(p[2]).path(if (p.size > 3) p[3] else "/").build()
            }
        }
    }

    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        val edit = prefs.edit()
        cookies.forEach { c ->
            val key = "${c.name}@${c.domain}"
            jar[key] = c
            edit.putString(key, "${c.name}|${c.value}|${c.domain}|${c.path}")
        }
        edit.apply()
    }

    override fun loadForRequest(url: HttpUrl): List<Cookie> =
        jar.values.filter { it.matches(url) }

    fun clear() { jar.clear(); prefs.edit().clear().apply() }
}

object ApiClient {
    private lateinit var cookieJar: PersistentCookieJar
    lateinit var httpClient: OkHttpClient
        private set
    lateinit var service: ApiService
        private set

    fun init(context: Context) {
        cookieJar = PersistentCookieJar(context.applicationContext)
        httpClient = OkHttpClient.Builder()
            .cookieJar(cookieJar)
            .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC })
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()
        service = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(httpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }

    fun clearSession() = cookieJar.clear()
}
