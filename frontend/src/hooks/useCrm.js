import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { cleanParams } from './usePublic';

// All CRM data access in one place. Query keys are grouped by resource
// ('leads', 'customers', …) so a mutation can refresh everything
// related with one invalidateQueries call.

const get = (url, params) => api.get(url, { params: params && cleanParams(params) }).then((r) => r.data);
const data = (p) => p.then((r) => r.data);

/** Wraps useMutation with the toast + invalidation pattern every CRM write uses. */
function useAction(mutationFn, { success, invalidate = [], onSuccess } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (result, vars) => {
      if (success) toast.success(typeof success === 'function' ? success(result, vars) : success);
      invalidate.forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
      onSuccess?.(result, vars);
    },
    onError: (err) => toast.error(err.message),
  });
}

// ---------- dashboard ----------
export const useOverview = () => useQuery({ queryKey: ['dashboard'], queryFn: () => get('/dashboard/overview').then((r) => r.data) });

// ---------- people ----------
export const useAgents = () => useQuery({ queryKey: ['agents'], queryFn: () => get('/users/agents').then((r) => r.data), staleTime: 5 * 60_000 });
export const useTeam = () => useQuery({ queryKey: ['team'], queryFn: () => get('/users').then((r) => r.data) });
export const useChangeRole = () =>
  useAction(({ id, role }) => api.patch(`/users/${id}/role`, { role }), { success: 'Role updated', invalidate: ['team', 'agents'] });
export const useSetActive = () =>
  useAction(({ id, active }) => api.patch(`/users/${id}/active`, { active }), {
    success: (_r, v) => (v.active ? 'Account reactivated' : 'Account deactivated'),
    invalidate: ['team', 'agents'],
  });

// ---------- leads ----------
export const useLeads = (params) =>
  useQuery({ queryKey: ['leads', cleanParams(params)], queryFn: () => get('/leads', params), placeholderData: keepPreviousData });
export const useLead = (id) => useQuery({ queryKey: ['leads', 'one', id], queryFn: () => get(`/leads/${id}`).then((r) => r.data), enabled: Boolean(id) });

const LEAD_RELATED = ['leads', 'dashboard', 'customers'];
export const useCreateLead = (opts) => useAction((body) => data(api.post('/leads', body)), { success: 'Lead added', invalidate: LEAD_RELATED, ...opts });
export const useUpdateLead = (opts) =>
  useAction(({ id, ...body }) => data(api.patch(`/leads/${id}`, body)), { success: 'Lead updated', invalidate: LEAD_RELATED, ...opts });
export const useConvertLead = () =>
  useAction((id) => data(api.post(`/leads/${id}/convert`)), { success: 'Customer profile created', invalidate: LEAD_RELATED });
export const useDeleteLead = (opts) => useAction((id) => api.delete(`/leads/${id}`), { success: 'Lead deleted', invalidate: LEAD_RELATED, ...opts });

/**
 * Pipeline moves are optimistic: the card lands in its new column immediately
 * and snaps back with an error toast if the API rejects the move.
 */
export function useMoveStage(listKey) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => data(api.patch(`/leads/${id}/stage`, body)),
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: listKey });
      const previous = qc.getQueryData(listKey);
      qc.setQueryData(listKey, (old) => old && { ...old, data: old.data.map((l) => (l._id === id ? { ...l, status: stage } : l)) });
      return { previous };
    },
    onError: (err, _v, ctx) => {
      qc.setQueryData(listKey, ctx.previous);
      toast.error(err.message);
    },
    onSuccess: (_d, { stage }) => {
      if (stage === 'won') toast.success('Deal won. Customer profile updated.');
    },
    onSettled: () => LEAD_RELATED.forEach((key) => qc.invalidateQueries({ queryKey: [key] })),
  });
}

// ---------- customers ----------
export const useCustomers = (params) =>
  useQuery({ queryKey: ['customers', cleanParams(params)], queryFn: () => get('/customers', params), placeholderData: keepPreviousData });
export const useCustomer = (id) => useQuery({ queryKey: ['customers', 'one', id], queryFn: () => get(`/customers/${id}`).then((r) => r.data) });
export const useCustomerMatches = (id) =>
  useQuery({ queryKey: ['customers', 'matches', id], queryFn: () => get(`/customers/${id}/matches`).then((r) => r.data) });
export const useCreateCustomer = (opts) =>
  useAction((body) => data(api.post('/customers', body)), { success: 'Customer added', invalidate: ['customers'], ...opts });
export const useUpdateCustomer = (opts) =>
  useAction(({ id, ...body }) => data(api.patch(`/customers/${id}`, body)), { success: 'Customer updated', invalidate: ['customers'], ...opts });
export const useAddInteraction = (opts) =>
  useAction(({ id, ...body }) => data(api.post(`/customers/${id}/interactions`, body)), { success: 'Interaction logged', invalidate: ['customers'], ...opts });

// ---------- properties (management) ----------
export const useManagedProperties = (params) =>
  useQuery({
    queryKey: ['properties', 'manage', cleanParams(params)],
    queryFn: () => get('/properties', { ...params, scope: 'manage' }),
    placeholderData: keepPreviousData,
  });
export const useManagedProperty = (id) =>
  useQuery({ queryKey: ['properties', 'id', id], queryFn: () => get(`/properties/id/${id}`).then((r) => r.data), enabled: Boolean(id) });
export const useSaveProperty = (opts) =>
  useAction(({ id, ...body }) => data(id ? api.patch(`/properties/${id}`, body) : api.post('/properties', body)), {
    success: (_r, v) => (v.id ? 'Property updated' : 'Property added'),
    invalidate: ['properties', 'property', 'dashboard'],
    ...opts,
  });
export const useDeleteProperty = () =>
  useAction((id) => api.delete(`/properties/${id}`), { success: 'Property deleted', invalidate: ['properties', 'dashboard'] });
