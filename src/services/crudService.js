import api from "./api";

export const unwrap = (payload) => payload?.data ?? payload?.items ?? payload ?? [];

export async function list(resource) {
  const { data } = await api.get(`/${resource}`);
  return unwrap(data);
}

export async function get(resource, id) {
  const { data } = await api.get(`/${resource}/${id}`);
  return data?.data ?? data;
}

export async function create(resource, body) {
  const { data } = await api.post(`/${resource}`, body);
  return data?.data ?? data;
}

export async function update(resource, id, body) {
  const { data } = await api.put(`/${resource}/${id}`, body);
  return data?.data ?? data;
}

export async function remove(resource, id) {
  const { data } = await api.delete(`/${resource}/${id}`);
  return data?.data ?? data;
}

export async function patch(resource, id, action, body) {
  const { data } = await api.patch(`/${resource}/${id}/${action}`, body);
  return data?.data ?? data;
}
