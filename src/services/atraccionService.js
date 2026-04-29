import api from "./api";

export const obtenerAtracciones = async () => {
  const response = await api.get("/atracciones");
  return response.data;
};

export const obtenerAtraccionDetalle = async (id) => {
  const response = await api.get(`/atracciones/${id}/detalle`);
  return response.data;
};

export const crearAtraccion = async (atraccion) => {
  const response = await api.post("/atracciones", atraccion);
  return response.data;
};

export const actualizarAtraccion = async (id, atraccion) => {
  const response = await api.put(`/atracciones/${id}`, atraccion);
  return response.data;
};

export const eliminarAtraccion = async (id) => {
  const response = await api.delete(`/atracciones/${id}`);
  return response.data;
};

export const buscarAtracciones = async (filtro) => {
  const response = await api.post("/atracciones/buscar", filtro);
  return response.data;
};

export const obtenerTickets = async () => {
  const response = await api.get("/tickets");
  return response.data;
};

export const obtenerHorarios = async () => {
  const response = await api.get("/horarios");
  return response.data;
};

export const crearReservaCompleta = async (reserva) => {
  const response = await api.post("/reservas-completa", reserva);
  return response.data;
};

export const obtenerReservas = async () => {
  const response = await api.get("/reservas");
  return response.data;
};
