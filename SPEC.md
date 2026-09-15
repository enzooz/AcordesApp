# SPEC: AcordesApp

## Tech Stack
- **HTML5 + CSS3 + Vanilla JS** (sin frameworks)
- **Responsive** (mobile-first con hamburger menu)
- **localStorage** para persistencia
- **Sin backend ni dependencias**

## Estructura de Datos

```javascript
// Cada canción
{
  id: "uuid",
  title: "Flaca",
  author: "Andrés Calamaro",
  content: "[C]Flaca no [Am]te meta[Em]s conmigo\n[C]que yo no [G]quiero...",
  order: 1,
  createdAt: 1234567890,
  updatedAt: 1234567890
}

// Canción en el culto del día (copia)
{
  ...song,
  cultoId: "uuid",
  originalId: "uuid-original",
  addedAt: 1234567890
}
```

## Funcionalidades

| # | Feature | Detalle |
|---|---------|---------|
| 1 | **Sidebar** | Home, Buscar, Agregar canción, Culto del día. En móvil: hamburger menu |
| 2 | **Lista de canciones** | Muestra "TÍTULO - AUTOR". Orden de carga por defecto |
| 3 | **Filtros** | Pestañas: Por carga / Por autor / Alfabético |
| 4 | **Buscador** | Filtra en tiempo real por título o autor |
| 5 | **Agregar canción** | Form: título, autor, contenido (con acordes [C] entre corchetes) |
| 6 | **Editar canción** | Mismo form, pre-cargado |
| 7 | **Eliminar canción** | Botón con confirmación |
| 8 | **Reordenar** | Flechas ↑↓ para cambiar posición en la lista |
| 9 | **Vista de canción** | Acordes sobre la letra, estilo LaCuerda |
| 10 | **Transportar tono** | Botones +/- semitonos y botón Reiniciar sobre la vista |
| 11 | **Persistencia** | Todo en localStorage, se carga al iniciar |
| 12 | **Culto del día** | Lista de canciones seleccionadas para el culto. Copia independiente de las originales |

## Formato de Canciones

**Soporte completo de acordes complejos:** `[C]`, `[Am7]`, `[Bbmaj7]`, `[C13(2)]`, `[Gmadd9]`, `[F5+/B]`, etc.

**Entrada (editor):**
```
[C]Flaca no [Am]te metas [Em]conmigo
[C]que yo no [G]quiero

[Bbmaj7]  [Am7]  [Gm7]  [C11]
Te amo Cristo, tú sabes cuanto te amo
```

**Salida (vista canción):**
```
  C          Am        Em
Flaca no te metas conmigo
  C          G
que yo no quiero

  Bbmaj7  Am7  Gm7  C11
Te amo Cristo, tú sabes cuanto te amo
```

Los acordes entre corchetes `[C]` se renderizan **encima** de la letra, alineados con la sílaba donde están puestos. Soporta acordes con séptimas, adicionales, suspensiones, slash chords, etc.

## Layout (Responsive)

### Desktop (≥768px)
```
┌──────────┬────────────────────────┐
│ SIDEBAR  │ CONTENIDO PRINCIPAL    │
│ ─────── │ ──────────────────────  │
│ Inicio   │ [Pestañas: Carga/      │
│ Buscar   │  Autor/Alfabético]     │
│ Agregar  │ [Buscador]             │
│          │ ┌────────────────────┐ │
│          │ │ Flaca - Calamaro   │ │
│          │ │ Sabor a Mí - ...   │ │
│          │ └────────────────────┘ │
└──────────┴────────────────────────┘
```

### Móvil (<768px)
```
┌────────────────────────────┐
│ ☰  AcordesApp       [Buscar]│
├────────────────────────────┤
│ [Pestañas: Carga/          │
│  Autor/Alfabético]         │
│ ┌────────────────────────┐ │
│ │ Flaca - Calamaro       │ │
│ │ Sabor a Mí - ...       │ │
│ └────────────────────────┘ │
└────────────────────────────┘
```

### Vista Canción
```
┌────────────────────────────┐
│ ← Volver   Flaca - Calamaro│
│ [Re] [Bm] [+] [-] [Reiniciar]│
│ ────────────────────────── │
│ [C]Flaca no [Am]te metas  │
│ [Em]conmigo                │
│ [C]que yo no [G]quiero    │
│ [Agregar al culto de hoy]  │
│ [Editar] [Eliminar]        │
└────────────────────────────┘
```

### Vista Culto del Día
```
┌────────────────────────────┐
│ Culto del día    [Limpiar] │
│ ┌────────────────────────┐ │
│ │ Flaca - Calamaro   ▲▼×│ │
│ │ Sabor a Mí - ...   ▲▼×│ │
│ └────────────────────────┘ │
└────────────────────────────┘
```

## Transporte de tono

```javascript
// Mapa de acordes
const CHORDS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

// Transportar +1: C → C#, D → D#, etc.
// Transportar -1: C# → C, D → D#, etc.
// Reconocer acordes en texto: /[A-G][^\]]*/g (soporta acordes complejos)
// Ejemplo: Bbmaj7 → Bmaj7, C13(2) → C#13(2), Gmadd9 → G#madd9
```

## Almacenamiento (localStorage)

```javascript
// Canciones principales
localStorage.setItem('acordesSongs', JSON.stringify(songs));
const songs = JSON.parse(localStorage.getItem('acordesSongs')) || [];

// Culto del día (lista independiente)
localStorage.setItem('acordesCulto', JSON.stringify(cultoSongs));
const cultoSongs = JSON.parse(localStorage.getItem('acordesCulto')) || [];
```

## Archivos

```
Acordes/
├── SPEC.md         ← Este archivo
├── index.html      ← Estructura HTML
├── style.css       ← Estilos (responsive)
├── app.js          ← Toda la lógica JS
├── data.js         ← Estructura de datos inicial
├── manifest.json   ← Configuración PWA
├── sw.js           ← Service Worker (cache offline)
└── servidor.bat    ← Levanta servidor local
```

## PWA + Servidor Local

### Cómo usar

1. Ejecutá `servidor.bat` (doble clic)
2. Abri la IP que aparece en la consola desde el navegador del celular
3. En Chrome, toca "Agregar a pantalla de inicio"
4. La app queda instalada y funciona offline

### Requisitos
- Python 3 instalado en el PC
- Ambos dispositivos en la misma red WiFi

### Archivos PWA
- `manifest.json`: configuración de la app (nombre, colores, ícono)
- `sw.js`: service worker para cachear archivos y funcionar offline
- `servidor.bat`: script para levantar Python HTTP server en puerto 8000
