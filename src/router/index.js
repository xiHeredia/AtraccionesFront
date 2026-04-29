import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import AdminDashboard from "../views/admin/AdminDashboard.vue";
import ClienteHome from "../views/cliente/ClienteHome.vue";
import AtraccionDetalle from "../views/cliente/AtraccionDetalle.vue";

const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", component: LoginView },
  { path: "/admin", component: AdminDashboard, meta: { requiresAuth: true, role: "ADMIN" } },
  { path: "/cliente", component: ClienteHome, meta: { requiresAuth: true } },
  { path: "/cliente/atraccion/:id", component: AtraccionDetalle, meta: { requiresAuth: true } },
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (to.meta.requiresAuth && !user?.token) return next("/login");
  const roles = (user?.roles || user?.Roles || []).map((r) => String(r).toUpperCase());
  if (to.meta.role && !roles.includes(to.meta.role)) return next("/cliente");
  next();
});

export default router;
