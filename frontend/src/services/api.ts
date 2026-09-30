import { User, Title, TimelineEvent, WatchSpace, RecommendationItem, HistoryItem, Analytics } from '../types';

const API_BASE = '/api/v1';

export function getToken(): string | null {
  return localStorage.getItem('netflix_token');
}

export function setToken(token: string) {
  localStorage.setItem('netflix_token', token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('netflix_refresh_token');
}

export function setRefreshToken(token: string) {
  localStorage.setItem('netflix_refresh_token', token);
}

export function removeToken() {
  localStorage.removeItem('netflix_token');
  localStorage.removeItem('netflix_refresh_token');
}

export function clearTokens() {
  removeToken();
}

let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

function onTokenRefreshed(token: string | null) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    if (!res.ok) {
      removeToken();
      return null;
    }
    const data = await res.json();
    if (data.accessToken) {
      setToken(data.accessToken);
      if (data.refreshToken) {
        setRefreshToken(data.refreshToken);
      }
      return data.accessToken;
    }
    return null;
  } catch {
    removeToken();
    return null;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  // Handle 401 Unauthorized with automatic refresh token rotation
  if (response.status === 401 && !isRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/register')) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await tryRefreshToken();
      isRefreshing = false;
      onTokenRefreshed(newToken);

      if (newToken) {
        return request<T>(endpoint, options, true);
      } else {
        removeToken();
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    } else {
      return new Promise<T>((resolve, reject) => {
        addRefreshSubscriber((newToken) => {
          if (newToken) {
            resolve(request<T>(endpoint, options, true));
          } else {
            reject(new Error('Session expired. Please sign in again.'));
          }
        });
      });
    }
  }

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || errorData.error || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const data = await request<{ accessToken: string; refreshToken: string; user: User }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    setToken(data.accessToken);
    if (data.refreshToken) {
      setRefreshToken(data.refreshToken);
    }
    return data;
  },

  async register(email: string, displayName: string, password: string, role = 'VIEWER') {
    const data = await request<{ accessToken: string; refreshToken: string; user: User }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ email, displayName, password, role }) }
    );
    setToken(data.accessToken);
    if (data.refreshToken) {
      setRefreshToken(data.refreshToken);
    }
    return data;
  },

  logout() {
    clearTokens();
  },

  async getCurrentUser(): Promise<User> {
    return request<User>('/auth/me');
  },

  async updateProfile(data: { displayName?: string; subtitleLocale?: string; password?: string }): Promise<User> {
    return request<User>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Titles
  async getTitles(): Promise<Title[]> {
    return request<Title[]>('/titles');
  },

  async getTitle(titleId: string): Promise<Title> {
    return request<Title>(`/titles/${titleId}`);
  },

  async getTimeline(titleId: string, from?: number, to?: number): Promise<{ titleId: string; events: TimelineEvent[] }> {
    const query = from !== undefined && to !== undefined ? `?from=${from}&to=${to}` : '';
    return request<{ titleId: string; events: TimelineEvent[] }>(`/titles/${titleId}/timeline${query}`);
  },

  // Watch Spaces
  async createWatchSpace(titleId: string, maxParticipants = 25, aiVerbosity = 'normal', votingEnabled = true): Promise<WatchSpace> {
    return request<WatchSpace>('/watch-spaces', {
      method: 'POST',
      body: JSON.stringify({ titleId, maxParticipants, aiVerbosity, votingEnabled })
    });
  },

  async joinSpaceById(spaceId: string): Promise<WatchSpace> {
    return request<WatchSpace>(`/watch-spaces/${spaceId}/join`, { method: 'POST' });
  },

  async joinSpaceByCode(inviteCode: string): Promise<WatchSpace> {
    return request<WatchSpace>('/watch-spaces/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode })
    });
  },

  async getWatchSpace(spaceId: string): Promise<WatchSpace> {
    return request<WatchSpace>(`/watch-spaces/${spaceId}`);
  },

  async endWatchSpace(spaceId: string): Promise<WatchSpace> {
    return request<WatchSpace>(`/watch-spaces/${spaceId}/end`, { method: 'POST' });
  },

  async getAnalytics(spaceId: string): Promise<Analytics> {
    return request<Analytics>(`/watch-spaces/${spaceId}/analytics`);
  },

  async getActiveSpaces(): Promise<WatchSpace[]> {
    return request<WatchSpace[]>('/watch-spaces');
  },

  async getMySpaces(): Promise<WatchSpace[]> {
    return request<WatchSpace[]>('/watch-spaces/me');
  },

  async getLiveKitToken(spaceId: string): Promise<{ token: string }> {
    return request<{ token: string }>(`/watch-spaces/${spaceId}/livekit-token`);
  },

  // AI Copilot
  async askAi(spaceId: string, currentTs: number, question: string): Promise<{ answer: string; sourceEvents: string[]; latencyMs: number }> {
    return request<{ answer: string; sourceEvents: string[]; latencyMs: number }>(`/watch-spaces/${spaceId}/ai/ask`, {
      method: 'POST',
      body: JSON.stringify({ currentTs, question })
    });
  },

  // Recommendations & History
  async getRecommendations(): Promise<{ items: RecommendationItem[] }> {
    return request<{ items: RecommendationItem[] }>('/users/me/recommendations');
  },

  async getHistory(): Promise<HistoryItem[]> {
    return request<HistoryItem[]>('/users/me/history');
  },

  async recordInteraction(titleId: string, watchedSeconds: number, completed = false, rating?: number) {
    return request('/interactions', {
      method: 'POST',
      body: JSON.stringify({ titleId, watchedSeconds, completed, rating })
    });
  },

  // Admin
  async validateTimeline(titleId: string, uploadData: any) {
    return request<{ valid: boolean; totalEvents: number; errors: string[] }>(`/admin/titles/${titleId}/timeline/validate`, {
      method: 'POST',
      body: JSON.stringify(uploadData)
    });
  },

  async uploadTimeline(titleId: string, uploadData: any) {
    return request<{ titleId: string; events: TimelineEvent[] }>(`/admin/titles/${titleId}/timeline`, {
      method: 'POST',
      body: JSON.stringify(uploadData)
    });
  }
};
