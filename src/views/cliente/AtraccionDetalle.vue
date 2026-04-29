<template>
  <div class="page">
    <AppNav />
    <main class="wrap">
      <button class="back" @click="$router.push('/cliente')">← Volver</button>
      <div v-if="loading" class="loading">Cargando detalle...</div>
      <div v-else-if="error" class="notice bad">{{ error }}</div>
      <section v-else class="detail">
        <div class="cover" :style="{ backgroundImage: `url(${mainImage})` }"></div>
        <div class="info">
          <p class="eyebrow">{{ atraccion.destinoNombre || 'Atracción' }}</p>
          <h1>{{ atraccion.nombre }}</h1>
          <p class="desc">{{ atraccion.descripcion || 'Sin descripción registrada.' }}</p>

          <!-- incluyes: AtraccionIncluyeResponse[] = { atId, incId, incluyeDescripcion } -->
          <div class="chips">
            <span v-for="x in incluyes" :key="x.incId">{{ x.incluyeDescripcion }}</span>
          </div>

          <form class="booking" @submit.prevent="reservar">
            <h2>Crear reserva</h2>
            <!-- clienteId se llena automáticamente desde el perfil del usuario logueado -->
            <input type="hidden" v-model="form.clienteId" />
            <div v-if="!form.clienteId" class="notice bad">
              No se encontró tu perfil de cliente. Contacta al administrador.
            </div>

            <label>Ticket *</label>
            <select v-model="form.ticketId" @change="syncTicket">
              <option value="">Seleccione ticket</option>
              <!-- TicketResponse: { id, atraccionId, titulo, precio, cuposDisponibles } -->
              <option v-for="t in ticketsAtraccion" :key="t.id" :value="t.id">
                {{ t.titulo }} - ${{ money(t.precio) }} - cupos {{ t.cuposDisponibles }}
              </option>
            </select>

            <label>Horario *</label>
            <select v-model="form.horarioId">
              <option value="">Seleccione horario</option>
              <!-- HorarioResponse: { id, ticketId, fecha, horaInicio, horaFin, cuposDisponibles } -->
              <option v-for="h in horariosTicket" :key="h.id" :value="h.id">
                {{ h.fecha }} {{ h.horaInicio }} - {{ h.horaFin }} / cupos {{ h.cuposDisponibles }}
              </option>
            </select>

            <label>Cantidad *</label>
            <input v-model="form.cantidad" type="number" min="1" />

            <div class="total">
              <span>Total estimado</span>
              <strong>${{ money(total) }}</strong>
            </div>

            <div v-if="formError" class="notice bad">{{ formError }}</div>
            <div v-if="ok" class="notice ok">{{ ok }}</div>

            <button class="btn" :disabled="saving">
              {{ saving ? 'Reservando...' : 'Confirmar reserva' }}
            </button>
          </form>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import AppNav from "../../components/AppNav.vue";
import api from "../../services/api";
import {
  obtenerAtraccionDetalle,
  obtenerTickets,
  obtenerHorarios,
  crearReservaCompleta,
} from "../../services/atraccionService";

export default {
  components: { AppNav },

  data: () => ({
    loading: false,
    saving: false,
    error: "",
    formError: "",
    ok: "",
    atraccion: {},
    tickets: [],   // TicketResponse[]
    horarios: [],  // HorarioResponse[]
    incluyes: [],  // AtraccionIncluyeResponse[]
    imagenes: [],  // ImagenAtraccionResponse[]
    form: {
      clienteId: "",
      ticketId: "",
      horarioId: "",
      cantidad: 1,
    },
    fallback:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  }),

  computed: {
    // TicketResponse usa "atraccionId" (no "atId")
    ticketsAtraccion() {
      return this.tickets.filter(
        (t) => Number(t.atraccionId) === Number(this.$route.params.id)
      );
    },

    // HorarioResponse usa "ticketId" (no "tickId")
    horariosTicket() {
      return this.horarios.filter(
        (h) => Number(h.ticketId) === Number(this.form.ticketId)
      );
    },

    selectedTicket() {
      return this.tickets.find((t) => Number(t.id) === Number(this.form.ticketId));
    },

    total() {
      return (
        Number(this.form.cantidad || 0) * Number(this.selectedTicket?.precio || 0)
      );
    },

    // ImagenAtraccionResponse usa "imagenUrl"
    mainImage() {
      return this.imagenes[0]?.imagenUrl || this.fallback;
    },
  },

  async mounted() {
    // Intentar cargar clienteId: primero desde localStorage, si no buscar en el API
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user?.clienteId) {
      this.form.clienteId = user.clienteId;
    } else if (user) {
      // clienteId no guardado aún — buscarlo con el endpoint directo
      try {
        // Primero intentar con usuarioId guardado en localStorage
        let usuarioId = user.usuarioId ?? user.UsuarioId;
        // Si no hay usuarioId (sesión antigua), buscarlo por login
        if (!usuarioId) {
          const usuRes = await api.get("/usuarios");
          const usuarios = usuRes.data?.data ?? usuRes.data ?? [];
          const userName = user.userName ?? user.UserName ?? "";
          const match = usuarios.find(u =>
            String(u.login ?? "").toLowerCase() === userName.toLowerCase()
          );
          if (match) usuarioId = match.id;
        }
        if (usuarioId) {
          const cliRes = await api.get(`/clientes/usuario/${usuarioId}`);
          const cliente = cliRes.data?.data ?? cliRes.data;
          if (cliente?.id) {
            this.form.clienteId = cliente.id;
            user.clienteId = cliente.id;
            user.usuarioId = usuarioId;
            localStorage.setItem("user", JSON.stringify(user));
          }
        }
      } catch { /* no tiene cliente vinculado */ }
    }
    this.load();
  },

  methods: {
    money(v) {
      return Number(v || 0).toFixed(2);
    },

    async load() {
      this.loading = true;
      try {
        const id = this.$route.params.id;

        const [det, t, h] = await Promise.all([
          obtenerAtraccionDetalle(id), // GET /atracciones/{id}/detalle
          obtenerTickets(),            // GET /tickets
          obtenerHorarios(),           // GET /horarios
        ]);

        // Todos los endpoints devuelven ApiResponse<T> con envelope { data, message }
        this.atraccion = det.data ?? det;
        this.tickets   = t.data   ?? t   ?? [];
        this.horarios  = h.data   ?? h   ?? [];

        // Carga secundaria: incluyes e imágenes por atracción
        try {
          const [inc, img] = await Promise.all([
            // GET /api/v1/atracciones-incluye/atraccion/{atId}
            // Retorna: ApiResponse<AtraccionIncluyeResponse[]>
            // AtraccionIncluyeResponse: { atId, incId, incluyeDescripcion }
            api.get(`/atracciones-incluye/atraccion/${id}`),

            // GET /api/v1/imagenes-atraccion/atraccion/{atId}
            // Retorna: ApiResponse<ImagenAtraccionResponse[]>
            // ImagenAtraccionResponse: { atId, imgId, imagenUrl, imagenDescripcion }
            api.get(`/imagenes-atraccion/atraccion/${id}`),
          ]);

          this.incluyes = inc.data?.data ?? inc.data ?? [];
          this.imagenes = img.data?.data ?? img.data ?? [];
        } catch {
          // No crítico: la vista carga igual sin chips ni imagen de portada
        }
      } catch (e) {
        this.error = e.userMessage || "No se pudo cargar el detalle.";
      } finally {
        this.loading = false;
      }
    },

    syncTicket() {
      this.form.horarioId = "";
    },

    validate() {
      if (!this.form.clienteId) return "No se encontró tu perfil de cliente. Contacta al administrador.";
      if (!this.form.ticketId)  return "Selecciona un ticket.";
      if (!this.form.horarioId) return "Selecciona un horario.";
      if (Number(this.form.cantidad) < 1) return "La cantidad debe ser mínimo 1.";
      const h = this.horarios.find(
        (x) => Number(x.id) === Number(this.form.horarioId)
      );
      if (h && Number(this.form.cantidad) > Number(h.cuposDisponibles)) {
        return "La cantidad supera los cupos disponibles del horario.";
      }
      return "";
    },

    async reservar() {
      this.formError = this.validate();
      if (this.formError) return;

      this.saving = true;
      this.ok = "";
      try {
        // CrearReservaCompletaRequest: { clienteId, horarioId, origenCanal, items[{ticketId,cantidad}] }
        const payload = {
          clienteId:   Number(this.form.clienteId),
          horarioId:   Number(this.form.horarioId),
          origenCanal: "WEB",
          items: [
            {
              ticketId: Number(this.form.ticketId),
              cantidad: Number(this.form.cantidad),
            },
          ],
        };

        const r = await crearReservaCompleta(payload); // POST /reservas-completa
        // ReservaCompletaResponse: { reservaId, codigo, subtotal, valorIva, total }
        const data = r.data ?? r;
        this.ok = `Reserva creada correctamente. Código: ${data.codigo || data.reservaId || "generado"}`;
      } catch (e) {
        this.formError = e.userMessage || "No se pudo crear la reserva.";
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
.page { min-height: 100vh; background: var(--sand); }
.wrap { max-width: 1180px; margin: auto; padding: 28px; }
.back { border: 0; background: white; border-radius: 12px; padding: 10px 14px; margin-bottom: 18px; cursor: pointer; }
.detail { display: grid; grid-template-columns: 1.1fr .9fr; gap: 24px; }
.cover { min-height: 620px; background-size: cover; background-position: center; border-radius: 28px; box-shadow: var(--shadow-soft); }
.info { background: white; border: 1px solid var(--border); border-radius: 28px; padding: 28px; box-shadow: var(--shadow-soft); }
.eyebrow { color: var(--terracotta); text-transform: uppercase; letter-spacing: .12em; font-size: 12px; font-weight: 800; }
.info h1 { font-family: var(--font-display); font-size: 46px; line-height: 1.05; margin: 8px 0 14px; }
.desc { color: rgba(26,22,18,.65); }
.chips { display: flex; gap: 8px; flex-wrap: wrap; margin: 16px 0; }
.chips span { background: var(--sand-dark); border-radius: 999px; padding: 7px 10px; font-size: 12px; }
.booking { margin-top: 20px; border-top: 1px solid var(--border); padding-top: 20px; display: grid; gap: 10px; }
.booking h2 { font-size: 22px; }
.booking label { font-weight: 800; font-size: 13px; }
input, select { border: 1.5px solid var(--border-strong); border-radius: 12px; padding: 11px 12px; }
.total { display: flex; justify-content: space-between; align-items: center; background: var(--sand); border-radius: 16px; padding: 14px; }
.total strong { font-size: 26px; }
.btn { border: 0; background: var(--ink); color: white; border-radius: 14px; padding: 13px 16px; font-weight: 800; cursor: pointer; }
.notice { padding: 12px 14px; border-radius: 14px; }
.bad { background: #fdebea; color: #8c2922; }
.ok  { background: #e9f5ec; color: #285c35; }
.loading { text-align: center; padding: 50px; }
@media (max-width: 900px) {
  .detail { grid-template-columns: 1fr; }
  .cover  { min-height: 300px; }
  .info h1 { font-size: 34px; }
}
</style>
