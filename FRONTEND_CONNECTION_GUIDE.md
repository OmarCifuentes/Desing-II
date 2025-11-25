# 🚀 Guía de Integración Frontend-Backend

**Estado Backend:** ✅ OPERATIVO  
**Nginx Gateway:** ✅ FUNCIONANDO  
**CORS:** ✅ CONFIGURADO

---

## ⚡ Inicio Rápido

### 1. Verificar que el Backend esté Corriendo
```powershell
# Desde: ProyectoFinal/
docker-compose ps
```

**Resultado esperado:** Todos los servicios en estado `Running`

### 2. Iniciar el Frontend
```bash
# Desde: Frontend-DII/
npm run dev
```

**URL:** http://localhost:3000

---

## 🧪 Pruebas de Conectividad

### Test 1: Health Check del Gateway
```powershell
Invoke-WebRequest -Uri http://localhost/health
```
✅ Esperado: `200 OK - "Gateway healthy"`

### Test 2: Login con Microsoft SSO
1. Abrir: http://localhost:3000/login
2. Click en "Iniciar Sesión con Microsoft"
3. Verificar redirección a Microsoft
4. Después de login, verificar token en cookie

### Test 3: Listar Personas
```powershell
# Con token JWT
$headers = @{
    "Authorization" = "Bearer YOUR_TOKEN_HERE"
}
Invoke-WebRequest -Uri http://localhost/personas -Headers $headers
```

### Test 4: Consulta RAG
```powershell
$body = @{
    question = "¿Cuántas personas hay registradas?"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer YOUR_TOKEN_HERE"
    "Content-Type" = "application/json"
}

Invoke-WebRequest -Uri http://localhost/rag/consulta -Method POST -Body $body -Headers $headers
```

---

## 📋 Endpoints Disponibles

### Autenticación
- `GET /auth/login` - Iniciar SSO
- `GET /auth/callback` - Callback OAuth2
- `POST /auth/logout` - Cerrar sesión

### Personas (usuarios)
- `GET /personas` - Listar todas
- `POST /personas` - Crear (multipart/form-data con imagen)
- `GET /personas/:id` - Obtener por ID
- `PUT /personas/:id` - Actualizar
- `DELETE /personas/:id` - Eliminar

### RAG/IA
- `POST /rag/consulta` - Consulta al LLM
  - Body: `{ "question": "tu pregunta" }`

### Logs de Auditoría
- `GET /logs` - Obtener todos los registros

---

## 🔧 Variables de Entorno del Frontend

Asegúrate de tener en `Frontend-DII/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost
NEXT_PUBLIC_AUTH_URL=http://localhost
```

> **Nota:** No incluir `/auth` o `/personas` en estas URLs, el frontend los agrega automáticamente

---

## ⚠️ Troubleshooting

### Error: CORS Policy
**Síntoma:** Error en consola del navegador sobre CORS  
**Solución:** ✅ Ya está resuelto en el backend
- Verifica que el frontend corra en `localhost:3000`
- Si usas otro puerto, actualizar `nginx.conf` línea 100+

### Error: Failed to Fetch
**Síntoma:** `TypeError: Failed to fetch`  
**Causa:** Backend no está corriendo  
**Solución:**
```powershell
cd ProyectoFinal
docker-compose up -d
```

### Error: 401 Unauthorized
**Síntoma:** Error 401 en requests API  
**Causa:** Token JWT expirado o inválido  
**Solución:**
1. Hacer logout
2. Volver a iniciar sesión con Microsoft
3. Nuevo token será generado

### Error: 404 Not Found
**Síntoma:** Endpoint no encontrado  
**Verifica:**
- URL correcta (sin doble slash `//`)
- Usar `/personas` no `/user` desde frontend
- Usar `/rag` no `/query` desde frontend

---

## ✅ Checklist de Validación

Antes de la demostración final, verificar:

- [ ] Backend corriendo: `docker-compose ps`
- [ ] Nginx accesible: `http://localhost/health`
- [ ] Frontend corriendo: `http://localhost:3000`
- [ ] Login SSO funciona
- [ ] Crear persona funciona (con imagen)
- [ ] Editar persona funciona
- [ ] Eliminar persona funciona
- [ ] Consulta RAG funciona
- [ ] Logs de auditoría visibles
- [ ] No hay errores CORS en consola

---

## 📊 Arquitectura de Conexión

```
Frontend (Next.js)          Nginx Gateway           Backend Services
localhost:3000       →      localhost:80      →     
                                                     
  /login            →       /auth/login       →     auth-service:8000
  /personas         →       /personas         →     user-crud-service:8080
                            (→/user)
  /rag              →       /rag              →     query-service:8081
                            (→/query)
  /logs             →       /logs             →     log-service:8082
                            (→/log)
```

### Mapeos Importantes
El gateway hace estos mapeos automáticamente:
- `/personas` → `/user` (user-crud-service)
- `/rag` → `/query` (query-service)
- `/logs` → `/log` (log-service)

---

## 🎯 Próximos Pasos

1. **Abrir el frontend**: http://localhost:3000
2. **Hacer login** con tu cuenta Microsoft
3. **Probar todas las funcionalidades**
4. **Verificar que no hay errores** en la consola del navegador

**¡El sistema está 100% listo para usar!** 🎉
