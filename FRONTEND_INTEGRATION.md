# ⚛️ Guía de Integración Frontend (React / Next.js)

Esta guía detalla cómo consumir los microservicios del backend desde una aplicación Next.js (App Router).

---

## 1. Variables de Entorno (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:80
NEXT_PUBLIC_AUTH_URL=http://localhost:8000
```

---

## 2. Autenticación (Custom Hook)

El backend maneja OAuth2 con redirección. En Next.js, el flujo recomendado es:

1. Redirigir al usuario a `/auth/login`
2. Recibir el callback con `code`
3. Intercambiar `code` por tokens y guardarlos (Cookie/LocalStorage)

### `hooks/useAuth.ts`

```typescript
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);

  // 1. Iniciar Login
  const login = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_AUTH_URL}/auth/login`;
  };

  // 2. Procesar Callback (llamar en página /auth/callback)
  const handleCallback = async (code: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/auth/callback?code=${code}`);
      const data = await res.json();
      
      if (data.accessToken) {
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  // 3. Logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return { login, handleCallback, logout, user };
};
```

---

## 3. Cliente API (Axios Config)

Configura un cliente centralizado para manejar el token automáticamente.

### `lib/api.ts`

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## 4. Consumo de Servicios

### 👤 Gestión de Usuarios (CRUD)

```typescript
import api from '@/lib/api';

// Crear Usuario
export const createUser = async (userData: any) => {
  const { data } = await api.post('/user', userData);
  return data;
};

// Obtener Usuario
export const getUser = async (id: string) => {
  const { data } = await api.get(`/user/${id}`);
  return data;
};

// Subir Foto (Multipart)
export const uploadPhoto = async (id: string, file: File) => {
  const formData = new FormData();
  formData.append('photo', file);

  const { data } = await api.post(`/user/${id}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};
```

### 🤖 Chat Inteligente (RAG)

Componente de chat para interactuar con el Query Service.

```tsx
'use client';
import { useState } from 'react';
import api from '@/lib/api';

export default function ChatBot() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query) return;
    setLoading(true);
    
    try {
      const { data } = await api.post('/query/consulta', { pregunta: query });
      setResponse(data.respuesta);
    } catch (error) {
      setResponse('Error al consultar el servicio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold mb-2">Asistente IA</h3>
      <div className="flex gap-2">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej: ¿Cuántos usuarios hay?"
          className="border p-2 flex-1 rounded"
        />
        <button 
          onClick={handleAsk} 
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? '...' : 'Preguntar'}
        </button>
      </div>
      {response && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}
```

### 📜 Logs de Auditoría

```typescript
// Obtener logs filtrados
export const getLogs = async (filters: any) => {
  // filters: { userId, eventType, startDate, endDate }
  const params = new URLSearchParams(filters).toString();
  const { data } = await api.get(`/logs?${params}`);
  return data;
};
```

---

## 5. Manejo de Errores Comunes

| Status | Causa | Solución Frontend |
|--------|-------|-------------------|
| `401` | Token expirado/inválido | Redirigir a login (`useAuth().login()`) |
| `403` | Sin permisos | Mostrar mensaje "Acceso Denegado" |
| `429` | Rate Limit | Mostrar "Intente más tarde" y deshabilitar botón por 1 min |
| `503` | Servicio RAG caído | Mostrar "Servicio de IA temporalmente no disponible" |

---

## 6. Tipos TypeScript (Recomendado)

```typescript
export interface User {
  id: string;
  idType: 'CC' | 'TI';
  firstName: string;
  surname: string;
  email: string;
  photoUrl?: string;
  // ... otros campos
}

export interface QueryResponse {
  respuesta: string;
  intent: string;
  needsLLM: boolean;
}
```
