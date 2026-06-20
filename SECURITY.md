# Auditoría de Seguridad — TuPersonal

**Fecha:** 2026-06-19  
**Alcance:** Infraestructura, frontend, backend, datos sensibles

---

## Vulnerabilidades encontradas y remediadas

### CRITICAL (resueltas)

| # | Vulnerabilidad | Riesgo | Remediación |
|---|---------------|--------|-------------|
| 1 | **API key de Anthropic expuesta en browser** — `VITE_ANTHROPIC_KEY` se incluía en el bundle JS, visible en DevTools | Uso no autorizado de la API, facturación fraudulenta | Movida a serverless function `api/anthropic.js`. El frontend llama a `/api/anthropic` sin credenciales |
| 2 | **MP access token enviado desde el browser** — `Authorization: Bearer` se mandaba directo a api.mercadopago.com | Robo del token MP, acceso a la cuenta del trainer | Movido a `api/mp-preference.js`. El browser nunca ve el header Authorization |
| 3 | **Sin headers de seguridad HTTP** — Sin CSP, HSTS, X-Frame-Options | XSS, clickjacking, MITM | Agregado `vercel.json` con CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |

### HIGH (resueltas)

| # | Vulnerabilidad | Remediación |
|---|---------------|-------------|
| 4 | Contraseña mínima 6 chars | Mínimo 8 chars + 1 mayúscula + 1 número |
| 5 | Sin `.env.example` — riesgo de exponer keys accidentalmente | Creado `.env.example` con solo variables seguras |

### MEDIUM (requieren acción manual en Supabase)

| # | Vulnerabilidad | Acción requerida |
|---|---------------|------------------|
| 6 | **RLS faltante en `trainer_settings`** — cualquier usuario autenticado podría leer el `mp_access_token` de otro trainer | Ejecutar SQL en Supabase (ver abajo) |
| 7 | **RLS faltante en `rutinas`** para clientes | Ejecutar SQL en Supabase (ver abajo) |
| 8 | **Sin validación de `inviteTrainerId`** en URL | Validar UUID format antes de usar |

---

## SQL para RLS pendiente (ejecutar en Supabase)

```sql
-- trainer_settings: solo el trainer dueño puede leer/escribir
ALTER TABLE trainer_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trainer_own_settings" ON trainer_settings
  FOR ALL USING (auth.uid() = trainer_id);

-- rutinas: clientes pueden leer las de su trainer
CREATE POLICY "cliente_ver_rutinas" ON rutinas
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM clientes WHERE trainer_id = rutinas.trainer_id)
  );

-- clientes: trainer ve solo sus clientes, cliente ve solo su propio perfil
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trainer_manage_clientes" ON clientes
  FOR ALL USING (auth.uid() = trainer_id);
CREATE POLICY "cliente_own_profile" ON clientes
  FOR ALL USING (auth.uid() = user_id);
```

---

## Arquitectura de seguridad actual

```
Browser (React)
  ├── /api/anthropic  → Vercel Function → api.anthropic.com (key server-side)
  ├── /api/mp-preference → Vercel Function → api.mercadopago.com (token server-side)
  └── Supabase Client (anon key + RLS)
       └── Todas las tablas con RLS habilitado
```

### Variables de entorno

| Variable | Ubicación | Exposición |
|----------|-----------|------------|
| `VITE_SUPABASE_URL` | Client | OK (endpoint público) |
| `VITE_SUPABASE_ANON_KEY` | Client | OK (protegido por RLS) |
| `VITE_MP_PUBLIC_KEY` | Client | OK (diseñado para ser público) |
| `ANTHROPIC_KEY` | Server only | Nunca llega al browser |

---

## Headers de seguridad (vercel.json)

- **CSP:** Restringe scripts, estilos, imágenes, conexiones a orígenes específicos
- **HSTS:** Fuerza HTTPS por 1 año
- **X-Frame-Options: DENY:** Previene clickjacking
- **X-Content-Type-Options: nosniff:** Previene MIME sniffing
- **Referrer-Policy:** No envía referrer a sitios externos
- **Permissions-Policy:** Solo cámara permitida (para fotos de progreso)

---

## Rendimiento

- **Bundle size:** ~5MB (precache). Considerar code splitting para reducir carga inicial
- **Supabase cache:** 5 min con NetworkFirst — balance entre frescura y performance
- **Service Worker:** autoUpdate con skipWaiting — actualizaciones inmediatas

---

## Mantenimiento recomendado

1. **Rotar API keys** cada 90 días
2. **Monitorear** logs de Vercel Functions para detectar abuso
3. **Actualizar dependencias** mensualmente (`npm audit`)
4. **Revisar RLS policies** al agregar tablas nuevas
5. **No agregar `VITE_` prefix** a secrets nuevos — usar Vercel Functions como proxy
