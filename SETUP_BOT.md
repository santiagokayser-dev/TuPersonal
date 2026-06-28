# Setup del Bot de Gastos

## Qué hace

1. Tu primo manda foto de un ticket por Telegram
2. Claude Vision extrae: monto, fecha, comercio, categoría
3. El bot le confirma y guarda en Supabase
4. Se agrupa automáticamente en reportes (ej: "Almuerzo Julio 2026")
5. Desde el panel web podés subir los reportes a Concur
6. Tu primo puede importar el resumen de tarjeta en CSV para hacer matching automático

---

## Variables de entorno (Vercel)

### Obligatorias para el bot

| Variable | Valor |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Token del bot (obtenelo de @BotFather) |
| `SUPABASE_URL` | URL de tu proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (no la anon key) |
| `ANTHROPIC_KEY` | Ya lo tenés |

### Opcionales pero recomendadas

| Variable | Descripción |
|---|---|
| `TELEGRAM_WEBHOOK_SECRET` | Cadena aleatoria para verificar que los mensajes vienen de Telegram |
| `TELEGRAM_ALLOWED_CHATS` | Chat IDs separados por coma (ej: `123456789,987654321`) — whitelist de quién puede usar el bot |

### Para Concur (cuando tengan credenciales)

| Variable | Descripción |
|---|---|
| `CONCUR_CLIENT_ID` | Client ID de la app de Concur |
| `CONCUR_CLIENT_SECRET` | Client Secret |
| `CONCUR_USERNAME` | Email del usuario en Concur |
| `CONCUR_PASSWORD` | Password del usuario en Concur |
| `CONCUR_BASE_URL` | `https://us.api.concursolutions.com` (o el de tu región) |

---

## Pasos para activar

### 1. Base de datos (Supabase)

Ejecutá el SQL de `supabase/schema_expenses.sql` en el SQL Editor de tu proyecto Supabase.

### 2. Crear el bot de Telegram

1. Abrí Telegram y buscá **@BotFather**
2. Mandá `/newbot`
3. Elegí un nombre y un username (ej: `GastosPrimoBot`)
4. Copiá el token que te da

### 3. Configurar el webhook

Una vez deployado en Vercel, registrá el webhook de Telegram:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://tu-dominio.vercel.app/api/telegram",
    "secret_token": "<TU_WEBHOOK_SECRET>"
  }'
```

### 4. Obtener el chat_id de tu primo

Después de configurar el webhook, hacé que tu primo le mande `/start` al bot.
El chat_id aparece en los logs de Vercel. Ponelo en `TELEGRAM_ALLOWED_CHATS`.

### 5. Panel web

Importá `ExpenseDashboard` en tu `App.jsx` y agregalo a tu navegación.

### 6. Concur (cuando tengan credenciales)

Para obtener credenciales de Concur API:
- Ir a App Center de Concur → Manage Apps → Register App
- O pedírselas al administrador de Concur de tu empresa
- El tipo de grant que usa este bot es `password` (Resource Owner)

---

## Uso del bot (para tu primo)

- **Foto** → el bot lee el ticket y pide confirmación
- `sí` → guarda el gasto
- `no` → cancela
- Texto libre → cambia el nombre del reporte (ej: `Viaje BsAs junio`)
- `/reportes` → ver todos los reportes y totales
- `/total` → total del mes actual
- `/sinmatch` → movimientos de tarjeta sin comprobante
- **CSV adjunto** → importa movimientos de tarjeta (hace matching automático)
