-- Habilita Realtime para la tabla "mensajes".
-- Sin esto, el chat guarda los mensajes bien (por eso aparecen al
-- recargar) pero nunca llega el evento en vivo al otro lado.
-- Correr en Supabase → SQL Editor → New query → pegar → Run.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'mensajes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE mensajes;
  END IF;
END $$;

-- Verificación: "mensajes" tiene que aparecer en esta lista
SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
