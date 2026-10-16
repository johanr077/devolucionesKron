# Kron · Reporte de devoluciones

App móvil (Next.js 14 + Tailwind) para registrar devoluciones y mercancía no entregada:
OCR de la nota → formulario → Google Sheets → Telegram + correo a Cuentas por Cobrar.

## Desarrollo
```bash
npm install
cp .env.example .env.local   # completa las variables
npm run dev
```

## Despliegue
1. `git init && git add . && git commit -m "Reporte de devoluciones" && git branch -M main`
2. Crea el repo en GitHub y `git remote add origin <url> && git push -u origin main`
3. En Vercel: Add New → Project → importa el repo → carga las variables de `.env.example`.
4. En Vercel → Storage → crea un Blob store y conéctalo al proyecto (genera `BLOB_READ_WRITE_TOKEN`).

Opcional: copia el logo oficial a `public/` y reemplaza el "krön" de `src/app/page.tsx` por `<Image>`.
