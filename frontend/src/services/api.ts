const API_BASE_URL = 'http://localhost:8000/api/v1';

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = new Headers(options.headers || {});
  
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || 'API request failed');
  }

  return json;
}

export const api = {
  auth: {
    register: (username: string, email: string, password: string) => 
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      }),
    login: (email: string, password: string) => 
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    logout: () => 
      request('/auth/logout', { method: 'POST' }),
    me: () => 
      request('/auth/me'),
    updateAvatar: (avatar: string) => 
      request('/auth/avatar', {
        method: 'PUT',
        body: JSON.stringify({ avatar }),
      }),
  },
  users: {
    getStatistics: (id: string) => 
      request(`/users/${id}/statistics`),
  },
  rooms: {
    create: (options: { is_private?: boolean; trump_mode?: 'SEVENTH_CARD' | 'JOKER' } = {}) => 
      request('/rooms', {
        method: 'POST',
        body: JSON.stringify(options),
      }),
    get: (code: string) => 
      request(`/rooms/${code}`),
    join: (code: string) => 
      request(`/rooms/${code}/join`, { method: 'POST' }),
    leave: (code: string) => 
      request(`/rooms/${code}/leave`, { method: 'POST' }),
    toggleReady: (code: string) => 
      request(`/rooms/${code}/ready`, { method: 'POST' }),
    sendChat: (code: string, message: string) => 
      request(`/rooms/${code}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
    start: (code: string) => 
      request(`/rooms/${code}/start`, { method: 'POST' }),
  },
  games: {
    getState: (gameId: string) => 
      request(`/games/${gameId}/state`),
    placeBid: (gameId: string, value: number, isPass: boolean) => 
      request(`/games/${gameId}/bids`, {
        method: 'POST',
        body: JSON.stringify({ value, is_pass: isPass }),
      }),
    selectTrump: (gameId: string, suit: string) => 
      request(`/games/${gameId}/trump`, {
        method: 'POST',
        body: JSON.stringify({ suit }),
      }),
    revealTrump: (gameId: string) => 
      request(`/games/${gameId}/trump/reveal`, { method: 'POST' }),
    declareSingleHand: (gameId: string, play: boolean) => 
      request(`/games/${gameId}/single-hand`, {
        method: 'POST',
        body: JSON.stringify({ play }),
      }),
    playCard: (gameId: string, cardId: string) => 
      request(`/games/${gameId}/cards`, {
        method: 'POST',
        body: JSON.stringify({ cardId }),
      }),
    declarePair: (gameId: string) => 
      request(`/games/${gameId}/pair`, { method: 'POST' }),
    declareDouble: (gameId: string) => 
      request(`/games/${gameId}/double`, { method: 'POST' }),
    declareRedouble: (gameId: string) => 
      request(`/games/${gameId}/redouble`, { method: 'POST' }),
  }
};
