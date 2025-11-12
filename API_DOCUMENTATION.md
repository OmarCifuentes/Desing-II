# API Documentation - BackendJob

## Autenticación

### Registro

**Endpoint:** `POST /auth/register`

**Puerto:** 8080

**Acceso:** Público

**Request Body:**

```json
{
  "username": "string (mín 4 caracteres)",
  "password": "string (mín 6 caracteres)",
  "email": "string (formato email)",
  "role": "user | admin (opcional, default: user)"
}
```

**Response Exitoso (201):**

```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "string"
  }
}
```

**Errores Posibles:**

- 400: Usuario o email ya existe
- 500: Error del servidor

---

### Login

**Endpoint:** `POST /auth/login`

**Puerto:** 8080

**Acceso:** Público

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Response Exitoso (200):**

```json
{
  "message": "Login exitoso",
  "token": "string (JWT token - guardar para futuras peticiones)",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "string"
  }
}
```

**Importante:** Guardar el token y enviarlo en todas las peticiones protegidas:

Authorization: Bearer {token}

**Errores Posibles:**

- 400: Usuario y/o contraseña faltantes
- 401: Credenciales inválidas
- 500: Error del servidor

---

## Gestión de Usuarios

### Crear Usuario

**Endpoint:** `POST /user`

**Puerto:** 8080

**Acceso:** Requiere autenticación

**Headers:**

Authorization: Bearer {token}

Content-Type: application/json

**Request Body:**

```json
{
  "idType": "TI | CC",
  "id": "string (solo números, máx 10 dígitos)",
  "firstName": "string (sin números, máx 30 caracteres)",
  "lastName": "string (opcional, sin números, máx 30 caracteres)",
  "surname": "string (sin números, máx 60 caracteres)",
  "birthdate": "string (formato: YYYY-MM-DD)",
  "gender": "Masculino | Femenino | No binario | Prefiero no responder",
  "email": "string (formato email, único)",
  "phone": "string (10 dígitos exactos, único)",
  "photoBase64": "string (opcional, formato: data:image/..., máx 2MB)"
}
```

**Response Exitoso (201):**

```json
{
  "message": "Usuario creado con éxito",
  "data": {
    // Objeto usuario completo
  }
}
```

**Errores Posibles:**

- 400: Error de validación (detalles en response)
- 401: Token inválido o no proporcionado
- 500: Error del servidor

---

### Listar Todos los Usuarios

**Endpoint:** `GET /user/users`

**Puerto:** 8081

**Acceso:** Requiere autenticación

**Headers:**

Authorization: Bearer {token}

**Response Exitoso (200):**

```json
[
  {
    "idType": "string",
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "surname": "string",
    "birthdate": "string",
    "gender": "string",
    "email": "string",
    "phone": "string",
    "photoBase64": "string",
    "isDeleted": false,
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

---

### Obtener Usuario por ID

**Endpoint:** `GET /user/:id`

**Puerto:** 8081

**Acceso:** Requiere autenticación

**Headers:**

Authorization: Bearer {token}

**URL Params:**

- `id`: Número de documento del usuario

**Ejemplo:**

GET /user/1234567890

**Response Exitoso (200):**

```json
{
  // Objeto usuario completo
}
```

**Errores Posibles:**

- 404: Usuario no encontrado
- 401: Token inválido

---

### Modificar Usuario

**Endpoint:** `PATCH /user/:id`

**Puerto:** 8080

**Acceso:** Requiere autenticación

**Headers:**

Authorization: Bearer {token}

Content-Type: application/json

**URL Params:**

- `id`: Número de documento del usuario

**Request Body (campos opcionales):**

```json
{
  "phone": "string",
  "email": "string",
  "gender": "string"
  // Cualquier campo del modelo excepto id e idType
}
```

**Response Exitoso (200):**

```json
{
  "message": "Usuario modificado con éxito",
  "data": {
    // Usuario actualizado
  }
}
```

---

### Eliminar Usuario (Soft Delete)

**Endpoint:** `DELETE /user/:id`

**Puerto:** 8080

**Acceso:** Requiere autenticación + rol ADMIN

**Headers:**

Authorization: Bearer {token}

**URL Params:**

- `id`: Número de documento del usuario

**Response Exitoso (200):**

```json
{
  "message": "Usuario eliminado con éxito"
}
```

**Errores Posibles:**

- 403: Acceso denegado (requiere rol admin)
- 404: Usuario no encontrado

---

## Consultas en Lenguaje Natural (RAG)

### Toponimia (Origen del Nombre)

**Endpoint:** `POST /user/toponimia`

**Puerto:** 8081

**Acceso:** Requiere autenticación

**Headers:**

Authorization: Bearer {token}

Content-Type: application/json

**Request Body:**

```json
{
  "firstName": "string"
}
```

**Response Exitoso (200):**

```json
{
  "toponimia": "string (origen etimológico del nombre)",
  "nota": "string"
}
```

---

### Consulta RAG General

**Endpoint:** `POST /user/consulta`

**Puerto:** 8081

**Acceso:** Requiere autenticación

**Headers:**

Authorization: Bearer {token}

Content-Type: application/json

**Request Body:**

```json
{
  "pregunta": "string (pregunta en lenguaje natural)"
}
```

**Ejemplos de preguntas:**

- "¿Quién es el usuario más joven?"
- "¿Cuántos usuarios hay?"
- "¿Cuál es la edad promedio?"
- "¿Cuántos hombres hay?"

**Response Exitoso (200):**

```json
{
  "pregunta": "string",
  "respuesta": "string",
  "metodo": "Reglas programadas | OpenRouter AI",
  "contexto": "string (opcional)"
}
```

---

## Sistema de Logs

### Obtener Logs

**Endpoint:** `GET /log`

**Puerto:** 8082

**Acceso:** Público

**Query Params (opcionales):**

- `id`: Filtrar por número de documento
- `idType`: Filtrar por tipo (TI | CC)
- `dateFrom`: Fecha inicio (YYYY-MM-DD)
- `dateTo`: Fecha fin (YYYY-MM-DD)

**Ejemplos:**

GET /log

GET /log?id=1234567890

GET /log?idType=CC

GET /log?dateFrom=2024-11-01&dateTo=2024-11-30

GET /log?id=1234567890&dateFrom=2024-11-01

**Response Exitoso (200):**

```json
[
  {
    "userID": "string",
    "idType": "string",
    "action": "Created | Modified | Deleted | Read | ConsultaRAG",
    "data": "string (JSON stringificado)",
    "time": "string (ISO date)"
  }
]
```

---

### Obtener Logs por Usuario

**Endpoint:** `GET /log/:id`

**Puerto:** 8082

**Acceso:** Público

**URL Params:**

- `id`: Número de documento (solo números)

**Response Exitoso (200):**

```json
[
  // Array de logs del usuario específico
]
```

---

## Manejo de Imágenes

### Formato Base64

Las fotos de usuarios se envían en formato Base64:

```javascript
// Convertir archivo a Base64 en el frontend
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};
// Uso
const base64 = await fileToBase64(fileInput.files[0]);
// Resultado: "data:image/jpeg;base64,/9j/4AAQ..."
```

### Mostrar imagen

```html
<img src="{user.photoBase64}" alt="Foto de usuario">
```

---

## Manejo de Errores

### Estructura de errores

```json
{
  "error": "Mensaje de error principal",
  "details": ["Array de detalles (opcional)"]
}
```

### Códigos HTTP comunes

- **200**: Éxito (GET, PATCH)
- **201**: Recurso creado (POST)
- **400**: Datos inválidos
- **401**: No autenticado
- **403**: Sin permisos
- **404**: No encontrado
- **500**: Error del servidor

---

## Flujo de Autenticación Completo

```javascript
// 1. Registrar usuario
const register = await fetch('http://localhost:8080/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'usuario',
    password: 'password123',
    email: 'usuario@example.com'
  })
});
// 2. Login
const login = await fetch('http://localhost:8080/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'usuario',
    password: 'password123'
  })
});
const { token } = await login.json();
// 3. Usar token en peticiones protegidas
const users = await fetch('http://localhost:8081/user/users', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## URLs Base por Entorno

### Desarrollo Local

- APP: `http://localhost:8080`
- READUSER: `http://localhost:8081`
- LOGS: `http://localhost:8082`

### Producción

- APP: `https://api.tudominio.com` (por definir)
- READUSER: `https://api.tudominio.com` (por definir)
- LOGS: `https://api.tudominio.com` (por definir)

---

## Validaciones del Frontend

El frontend debe validar ANTES de enviar:

### Tipo de documento

- Solo "TI" o "CC"

### Número de documento

- Solo números
- Máximo 10 caracteres
- Ejemplo válido: "1234567890"

### Nombres y apellidos

- Sin números
- Solo letras y espacios
- Primer nombre: máx 30 caracteres
- Segundo nombre: máx 30 caracteres
- Apellidos: máx 60 caracteres

### Fecha de nacimiento

- Formato: YYYY-MM-DD
- Ejemplo: "1995-05-15"

### Género

- Solo estos valores:
  - "Masculino"
  - "Femenino"
  - "No binario"
  - "Prefiero no responder"

### Email

- Formato válido con @
- Único en el sistema

### Teléfono

- Exactamente 10 dígitos
- Solo números
- Único en el sistema
- Ejemplo: "3001234567"

### Foto

- Formato Base64: debe empezar con "data:image/"
- Tamaño máximo: 2MB


