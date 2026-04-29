<template>
  <div class="login-page">
    <!-- Decorative background -->
    <div class="bg-decoration">
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
      <div class="bg-dots"></div>
    </div>

    <div class="login-container">
      <!-- Left panel -->
      <div class="login-left">
        <div class="brand fade-up">
          <div class="brand-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 2L26 8V20L14 26L2 20V8L14 2Z" stroke="currentColor" stroke-width="2" fill="none"/>
              <circle cx="14" cy="14" r="4" fill="currentColor"/>
            </svg>
          </div>
          <span class="brand-name">Atracciones</span>
        </div>
        <h1 class="hero-title fade-up fade-up-1">
          Descubre<br/>
          <em>experiencias</em><br/>
          únicas
        </h1>
        <p class="hero-sub fade-up fade-up-2">
          Reserva las mejores atracciones y vive momentos que recordarás para siempre.
        </p>
        <div class="hero-badges fade-up fade-up-3">
          <div class="badge">
            <span class="badge-icon">✦</span>
            Reserva segura
          </div>
          <div class="badge">
            <span class="badge-icon">✦</span>
            Soporte 24/7
          </div>
          <div class="badge">
            <span class="badge-icon">✦</span>
            Mejores precios
          </div>
        </div>
      </div>

      <!-- Right panel: login form -->
      <div class="login-right fade-up fade-up-2">
        <div class="form-card">
          <div class="form-header">
            <h2>Bienvenido de vuelta</h2>
            <p>Ingresa tus credenciales para continuar</p>
          </div>

          <form @submit.prevent="handleLogin" class="form-body">
            <div class="field" :class="{ 'field--error': error && !userName }">
              <label>Usuario</label>
              <div class="input-wrap">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <input v-model="userName" type="text" placeholder="Tu nombre de usuario" autocomplete="username"/>
              </div>
            </div>

            <div class="field" :class="{ 'field--error': error && !password }">
              <label>Contraseña</label>
              <div class="input-wrap">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input v-model="password" :type="showPass ? 'text' : 'password'" placeholder="••••••••" autocomplete="current-password"/>
                <button type="button" class="pass-toggle" @click="showPass = !showPass">
                  <svg v-if="!showPass" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
              </div>
            </div>

            <transition name="slide-err">
              <div v-if="error" class="error-msg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {{ error }}
              </div>
            </transition>

            <button type="submit" class="btn-login" :class="{ loading }" :disabled="loading">
              <span v-if="!loading">Ingresar</span>
              <span v-else class="spinner"></span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { login } from "../services/authService";

export default {
  data() {
    return {
      userName: "",
      password: "",
      error: "",
      loading: false,
      showPass: false,
    };
  },
  methods: {
    async handleLogin() {
      this.error = "";
      if (!this.userName || !this.password) {
        this.error = "Por favor completa todos los campos.";
        return;
      }
      try {
        this.loading = true;
        const result = await login(this.userName, this.password);
        const raw = result.data;
        // Normaliza el objeto para que api.js pueda leer user.token (minúscula)
        // y el router pueda leer user.roles (minúscula)
        // LoginResponse del backend: { UserName, Roles, Token, ExpirationUtc }
        const userData = {
          ...raw,
          token: raw.Token || raw.token || raw.accessToken || raw.jwt,
          roles: raw.Roles || raw.roles || [],
        };
        localStorage.setItem("user", JSON.stringify(userData));
        const roles = userData.roles.map(r => String(r).toUpperCase());

        // Si es cliente, buscar su clienteId usando el usuarioId que ahora viene en el login
        if (!roles.includes("ADMIN")) {
          try {
            const api = (await import("../services/api")).default;
            // El backend ahora retorna usuarioId en el login response
            const usuarioId = raw.usuarioId ?? raw.UsuarioId;
            if (usuarioId) {
              userData.usuarioId = usuarioId;
              // Nuevo endpoint directo: GET /clientes/usuario/{usuarioId}
              const cliRes = await api.get(`/clientes/usuario/${usuarioId}`);
              const cliente = cliRes.data?.data ?? cliRes.data;
              if (cliente?.id) {
                userData.clienteId = cliente.id;
              }
            }
            localStorage.setItem("user", JSON.stringify(userData));
          } catch { /* si no tiene cliente vinculado aún, se mostrará aviso al reservar */ }
        }

        if (roles.includes("ADMIN")) {
          this.$router.push("/admin");
        } else {
          this.$router.push("/cliente");
        }
      } catch {
        this.error = "Usuario o contraseña incorrectos.";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sand);
  position: relative;
  overflow: hidden;
  padding: 24px;
}

.bg-decoration { position: absolute; inset: 0; pointer-events: none; }
.bg-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.18;
}
.bg-circle-1 {
  width: 600px; height: 600px;
  background: radial-gradient(circle, var(--terracotta) 0%, transparent 70%);
  top: -200px; left: -200px;
}
.bg-circle-2 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, var(--gold) 0%, transparent 70%);
  bottom: -100px; right: -100px;
}
.bg-dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(var(--border-strong) 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.4;
}

.login-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  width: 100%;
  max-width: 960px;
  min-height: 580px;
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  position: relative;
}

/* Left */
.login-left {
  background: linear-gradient(145deg, var(--ink) 0%, #2C2118 100%);
  padding: 56px 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
  position: relative;
  overflow: hidden;
}
.login-left::before {
  content: '';
  position: absolute;
  width: 300px; height: 300px;
  background: radial-gradient(circle, var(--terracotta) 0%, transparent 70%);
  bottom: -100px; right: -100px;
  opacity: 0.25;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--gold);
  font-weight: 600;
  font-size: 15px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.brand-icon {
  width: 40px; height: 40px;
  background: rgba(201,168,76,0.15);
  border: 1px solid rgba(201,168,76,0.3);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: var(--gold);
}

.hero-title {
  font-family: var(--font-display);
  font-size: 48px;
  line-height: 1.1;
  color: var(--white);
  font-weight: 700;
}
.hero-title em {
  font-style: italic;
  color: var(--terracotta-light);
}
.hero-sub {
  color: rgba(255,255,255,0.55);
  font-size: 15px;
  max-width: 300px;
  line-height: 1.7;
}
.hero-badges {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}
.badge {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255,255,255,0.7);
  font-size: 13px;
}
.badge-icon { color: var(--gold); font-size: 10px; }

/* Right */
.login-right {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  background: var(--white);
}
.form-card { width: 100%; max-width: 360px; }
.form-header { margin-bottom: 32px; }
.form-header h2 {
  font-family: var(--font-display);
  font-size: 26px;
  color: var(--ink);
  margin-bottom: 6px;
}
.form-header p { color: var(--ink-soft); font-size: 14px; }

.form-body { display: flex; flex-direction: column; gap: 20px; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 13px; font-weight: 500; color: var(--ink-soft); }

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.input-icon {
  position: absolute;
  left: 14px;
  color: rgba(26,22,18,0.35);
  pointer-events: none;
}
.input-wrap input {
  width: 100%;
  padding: 13px 40px 13px 42px;
  border: 1.5px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--sand);
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--ink);
  transition: border-color var(--transition), box-shadow var(--transition);
  outline: none;
}
.input-wrap input::placeholder { color: rgba(26,22,18,0.3); }
.input-wrap input:focus {
  border-color: var(--terracotta);
  box-shadow: 0 0 0 3px rgba(196,98,45,0.12);
  background: var(--white);
}
.pass-toggle {
  position: absolute;
  right: 14px;
  background: none; border: none; cursor: pointer;
  color: rgba(26,22,18,0.4);
  padding: 0;
  display: flex;
  transition: color var(--transition);
}
.pass-toggle:hover { color: var(--terracotta); }

.field--error .input-wrap input {
  border-color: #d9534f;
  background: #fff8f8;
}

.error-msg {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: var(--radius-sm);
  color: #dc2626;
  font-size: 13px;
}

.btn-login {
  width: 100%;
  padding: 14px;
  background: var(--terracotta);
  color: var(--white);
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition), transform var(--transition), box-shadow var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  margin-top: 4px;
}
.btn-login:hover:not(:disabled) {
  background: var(--terracotta-light);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(196,98,45,0.3);
}
.btn-login:disabled { opacity: 0.7; cursor: not-allowed; }

.spinner {
  width: 20px; height: 20px;
  border: 2.5px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.slide-err-enter-active { animation: fadeUp 0.3s ease both; }
.slide-err-leave-active { animation: fadeUp 0.2s ease both reverse; }

@media (max-width: 680px) {
  .login-container { grid-template-columns: 1fr; }
  .login-left { display: none; }
  .login-right { padding: 40px 24px; }
}
</style>
