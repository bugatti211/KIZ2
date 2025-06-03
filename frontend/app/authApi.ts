import api from './api';

export async function register(name: string, email: string, password: string) {
  try {
    const res = await api.post('/register', { name, email, password });
    return res.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data?.error || 'Ошибка регистрации');
    } else if (error.request) {
      throw new Error('Нет ответа от сервера. Проверьте подключение к интернету.');
    } else {
      throw new Error(error.message || 'Неизвестная ошибка');
    }
  }
}

export async function login(email: string, password: string) {
  try {
    const res = await api.post('/login', { email, password });
    return res.data;
  } catch (error: any) {
    // Axios error: error.response?.data?.message или error.message
    if (error.response) {
      throw new Error(error.response.data?.message || 'Login failed');
    } else if (error.request) {
      throw new Error('No response from server. Check API URL and network connection.');
    } else {
      throw new Error(error.message || 'Unknown error');
    }
  }
}

export async function getUsers() {
  const res = await api.get('/users');
  return res.data;
}

export async function getContacts() {
  const res = await api.get('/api/contacts');
  return {
    telegram: res.data.telegram || '',
    whatsapp: res.data.whatsapp || ''
  };
}

// No default export needed for authApi.ts, but to satisfy the error, export an empty default:
export default {};
