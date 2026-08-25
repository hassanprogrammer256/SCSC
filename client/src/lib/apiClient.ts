import axios, { type InternalAxiosRequestConfig } from "axios";
import type { AppDispatch, RootState } from "@/app/store";
import { clearSession, setAccessToken } from "@/features/auth/authSlice";
import { endpoints } from "@/lib/endpoints";

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };
type StoreLike = { getState: () => RootState; dispatch: AppDispatch };

let boundStore: StoreLike | null = null;

// store.ts imports this module, so this can't import `store` back without
// forming a cycle that leaves authReducer in its TDZ when store.ts runs
// configureStore(). store.ts calls this once the store instance exists instead.
export function attachStore(store: StoreLike) {
  boundStore = store;
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = boundStore?.getState().auth.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config as RetryableConfig | undefined;

    if (error.response?.status === 401 && config && !config._retry && config.url !== endpoints.refresh) {
      config._retry = true;
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}${endpoints.refresh}`,
          {},
          { withCredentials: true },
        );
        boundStore?.dispatch(setAccessToken(data.access));
        config.headers.Authorization = `Bearer ${data.access}`;
        return apiClient(config);
      } catch {
        boundStore?.dispatch(clearSession());
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401) boundStore?.dispatch(clearSession());
    return Promise.reject(error);
  },
);

type PaginatedResponse<T> = { results: T[]; next: string | null };

// Every list endpoint is paginated server-side (PAGE_SIZE=20, see
// common/pagination.py) — there is no screen in this app where a partial
// list is ever an acceptable result (a roster, activity list, or
// submissions table missing rows past page 1 is a silent data-loss bug,
// not a UX nicety to skip). Every list-fetching thunk crawls every page via
// this instead of reading page 1 alone. `next` is DRF's own absolute URL —
// axios uses it as-is (ignoring baseURL) when a URL is already absolute.
export async function fetchAllPages<T>(url: string): Promise<T[]> {
  const results: T[] = [];
  let next: string | null = url;
  while (next) {
    const { data }: { data: PaginatedResponse<T> | T[] } = await apiClient.get<PaginatedResponse<T> | T[]>(next);
    if (Array.isArray(data)) {
      results.push(...data);
      break;
    }
    results.push(...data.results);
    next = data.next;
  }
  return results;
}
