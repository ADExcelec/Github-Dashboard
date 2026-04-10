# PRD Orchestrator Backend

Backend Express para crear PRDs y publicarlos en GitHub (`product-docs`) usando GitHub App.

## Scripts

- `npm run dev`: inicia servidor en modo desarrollo
- `npm run build`: compila TypeScript
- `npm run start`: ejecuta build compilado

## Configuracion

1. Copia `.env.example` a `.env`.
2. Define credenciales de GitHub App.
3. Ejecuta `npm install` y luego `npm run dev`.

## Endpoint inicial

- `POST /api/prd`
  - Valida payload
  - Reserva `PRD-XXX` en `prd/indices/<cliente>/<proyecto>/sequence.json`
  - Genera markdown cerrado
  - Publica archivo en `prd/clientes/<cliente>/<proyecto>/PRD-XXX-<slug>.md`

## Nota de seguridad

No uses `VITE_GITHUB_TOKEN` para escrituras. Todas las mutaciones GitHub deben pasar por este backend.
