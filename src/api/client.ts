const API_URL = '';

// Переменные для управления процессом обновления токена
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Обновление access токена с помощью refresh токена
 */
async function refreshAccessToken(): Promise<string | null> {
  // Если уже идет процесс обновления, ждем его завершения
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = typeof window !== 'undefined' 
    ? localStorage.getItem('refreshToken') 
    : null;

  if (!refreshToken) {
    return null;
  }

  isRefreshing = true;
  refreshPromise = fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
      const data = await response.json();
      // Сохраняем оба токена
      if (typeof window !== 'undefined' && data.accessToken && data.refreshToken) {
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      return data.accessToken;
    })
    .catch(() => {
      return null;
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // Определяем, является ли body FormData
  const isFormData = options.body instanceof FormData;
  
  const headers: HeadersInit = {
    ...options.headers,
  };

  // Устанавливаем Content-Type только для не-FormData запросов
  // Для FormData браузер сам установит правильный Content-Type с boundary
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    let error: any = { error: 'Ошибка запроса' };
    
    // Пытаемся парсить JSON, если это JSON ответ
    if (contentType && contentType.includes('application/json')) {
      try {
        error = await response.json();
      } catch (jsonError) {
        // Если не удалось распарсить JSON, используем текст ответа
        const text = await response.text().catch(() => 'Ошибка запроса');
        error = { error: text || 'Ошибка запроса' };
      }
    } else {
      // Если это не JSON, пытаемся получить текст
      try {
        const text = await response.text();
        error = { error: text || 'Ошибка запроса' };
      } catch (textError) {
        error = { error: `Ошибка ${response.status}: ${response.statusText}` };
      }
    }
    
    let errorMessage = error.error || error.message || `Ошибка ${response.status}: ${response.statusText}`;
    
    // Обработка 401 ошибки (недействительный токен)
    if (response.status === 401 && typeof window !== 'undefined') {
      // Пытаемся обновить токен
      const newAccessToken = await refreshAccessToken();
      
      if (newAccessToken) {
        // Токены уже сохранены в refreshAccessToken
        
        // Обновляем заголовок и повторяем запрос
        const newHeaders: HeadersInit = {
          ...headers,
          'Authorization': `Bearer ${newAccessToken}`,
        };
        
        const retryResponse = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers: newHeaders,
        });
        
        if (!retryResponse.ok) {
          // Если повторный запрос тоже не удался, разлогиниваем
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('activeMode');
          window.dispatchEvent(new CustomEvent('auth:logout'));
          throw new Error(errorMessage);
        }
        
        return retryResponse.json();
      } else {
        // Если не удалось обновить токен, разлогиниваем
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('activeMode');
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    }
    
    // В режиме разработки показываем детали ошибки
    if (process.env.NODE_ENV === 'development' && error.details) {
      console.error('Детали ошибки API:', error.details);
      const errorDetails = typeof error.details === 'object' 
        ? JSON.stringify(error.details, null, 2)
        : error.details;
      errorMessage = `${errorMessage}\n\nДетали:\n${errorDetails}`;
    }
    
    // Логируем полную информацию об ошибке для отладки
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      error: error,
      endpoint: endpoint
    });
    
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, data?: any) => {
    if (data instanceof FormData) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      return apiRequest<T>(endpoint, {
        method: 'POST',
        body: data,
        headers,
      });
    }
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  patch: <T>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};
