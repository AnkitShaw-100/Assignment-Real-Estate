import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { useSession } from '../auth/AuthContext';

const get = (url, params) => api.get(url, { params }).then((r) => r.data);

/** Drops empty values so the URL/query key stays clean */
export function cleanParams(params) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null));
}

export function useProperties(params, options = {}) {
  const clean = cleanParams(params);
  return useQuery({
    queryKey: ['properties', clean],
    queryFn: () => get('/properties', clean),
    placeholderData: keepPreviousData, // keep showing old results while new filters load
    ...options,
  });
}

export function useProperty(slug) {
  return useQuery({
    queryKey: ['property', slug],
    queryFn: () => get(`/properties/${slug}`).then((r) => r.data),
    enabled: Boolean(slug),
  });
}

export function useSimilar(slug) {
  return useQuery({
    queryKey: ['property', slug, 'similar'],
    queryFn: () => get(`/properties/${slug}/similar`).then((r) => r.data),
    enabled: Boolean(slug),
  });
}

export function useCities() {
  return useQuery({ queryKey: ['cities'], queryFn: () => get('/properties/cities').then((r) => r.data), staleTime: 30 * 60_000 });
}

export function usePublicStats() {
  return useQuery({ queryKey: ['stats'], queryFn: () => get('/stats/public').then((r) => r.data), staleTime: 10 * 60_000 });
}

export function useSendInquiry() {
  return useMutation({ mutationFn: (body) => api.post('/leads/inquiry', body).then((r) => r.data.data) });
}

export function useMyInquiries() {
  const { isSignedIn } = useSession();
  return useQuery({ queryKey: ['my-inquiries'], queryFn: () => get('/leads/mine').then((r) => r.data), enabled: isSignedIn });
}

export function useSavedProperties() {
  const { isSignedIn } = useSession();
  return useQuery({ queryKey: ['saved'], queryFn: () => get('/users/me/saved').then((r) => r.data), enabled: isSignedIn });
}

/**
 * Heart toggle with an optimistic update: the heart fills instantly and
 * rolls back with a toast if the request fails.
 */
export function useSaveToggle() {
  const qc = useQueryClient();
  const { isSignedIn, me, openSignIn } = useSession();
  const savedIds = new Set((me?.savedProperties ?? []).map(String));

  const mutation = useMutation({
    mutationFn: ({ id, save }) => (save ? api.post(`/users/me/saved/${id}`) : api.delete(`/users/me/saved/${id}`)),
    onMutate: async ({ id, save }) => {
      await qc.cancelQueries({ queryKey: ['me'] });
      const previous = qc.getQueryData(['me']);
      qc.setQueryData(['me'], (old) =>
        old && {
          ...old,
          savedProperties: save ? [...old.savedProperties, id] : old.savedProperties.filter((s) => String(s) !== String(id)),
        },
      );
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      qc.setQueryData(['me'], ctx.previous);
      toast.error(err.message);
    },
    onSuccess: (_d, { save }) => toast.success(save ? 'Saved to your homes' : 'Removed from saved homes'),
    onSettled: () => qc.invalidateQueries({ queryKey: ['saved'] }),
  });

  return {
    isSaved: (id) => savedIds.has(String(id)),
    toggle: (id) => {
      if (!isSignedIn) return openSignIn();
      mutation.mutate({ id, save: !savedIds.has(String(id)) });
    },
  };
}
