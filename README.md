<pre style="font-family: 'Courier New', monospace; white-space: pre; overflow-x: auto;">
 ██████╗ ██████╗ ██████╗ ███████╗██████╗ ██████╗  █████╗ ██╗███╗   ██╗
██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔══██╗██║████╗  ██║
██║     ██║   ██║██║  ██║█████╗  ██████╔╝██████╔╝███████║██║██╔██╗ ██║
██║     ██║   ██║██║  ██║██╔══╝  ██╔══██╗██╔══██╗██╔══██║██║██║╚██╗██║
╚██████╗╚██████╔╝██████╔╝███████╗██████╔╝██║  ██║██║  ██║██║██║ ╚████║
 ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝     
                             By Isanchezv
</pre>

---

### Tabla de Contenidos

1. [¿Qué es Codebrain?]()
2. [Características]()
3. [Instalación]()
4. [Configuración]()
5. [Uso]()
   - [Menú interactivo]()
   - [⚡ Scan]()
   - [🐛 Bugs]()
   - [📊 Score]()
   - [🧠 Explain]()
   - [🩺 Doctor]()
6. [Modo IA]()
7. [Reglas de análisis]()
   - [Seguridad (SEC)]()
   - [TypeScript (TS)]()
   - [Calidad (QA)]()
   - [Dead Code (DC)]()
   - [Performance (PERF)]()
   - [React (RCT)]()
   - [Tamaño (SIZE)]()
   - [Complejidad (CPLX)]()
   - [Entorno (ENV)]()
8. [Sistema de puntuación]()
9. [Estructura del proyecto]()
10. [Stack tecnológico]()
11. [Lenguajes soportados]()

---

# ¿Qué es Codebrain?

Codebrain es un CLI de análisis de código que combina análisis estático profundo con inteligencia artificial (Claude de Anthropic) para detectar bugs, vulnerabilidades de seguridad, problemas de calidad y deuda técnica en tus proyectos.
Funciona con cualquier proyecto moderno: TypeScript, JavaScript, React, Astro, Node.js, Python, Vue, Svelte y más. Puedes usarlo en modo estático (sin API key, instantáneo) o en modo IA para análisis profundo con contexto real.

---

# Características

### Análisis estático

- 45+ reglas organizadas por categoría y severidad
- Detección de secretos hardcodeados (API keys, passwords, tokens)
- Análisis de vulnerabilidades de seguridad (XSS, SQL injection, eval, etc.)
- Análisis de calidad de código (empty catch, any types, console.logs, etc.)
- Complejidad ciclomática estimada por archivo
- Detección de código muerto (TODOs, FIXMEs, HACKs)
- Métricas detalladas: líneas, blancos, comentarios, código

### Análisis con IA (Claude)

- **Explain**: Claude explica el propósito, exports, arquitectura y calidad de un archivo
- **Code Review**: revisión profunda de correctness, seguridad, performance y tests
- **Bug Analysis**: Claude analiza bugs lógicos, race conditions y validaciones faltantes con el - contexto del análisis estático
- **Architecture Review**: evaluación estratégica de la arquitectura del proyecto

### Experiencia de usuario

- Menú interactivo con banner gradient en terminal
- Filtros interactivos por categoría y severidad
- Output agrupado por archivo con íconos y colores
- Barras de score visuales por categoría
- Modo dual: estático o IA o ambos
- Compatible con cualquier terminal con color

---

# Instalación

### Requisitos previos

- Node.js 18 o superior
- npm, pnpm o bun

Desde el zip
```
bashunzip codebrain-cli.zip
cd codebrain
npm install
```

Ejecutar en desarrollo
```
npm run dev
```

Compilar y ejecutar en producción
```
bashnpm run build
node dist/cli.js
```

Instalar globalmente (opcional)
```
npm run build
npm link

# Luego desde cualquier carpeta:
codebrain
```
---

# Configuración
API Key de Claude (para modo IA)
Codebrain funciona perfectamente sin API key en modo estático. Para activar el análisis con IA, necesitas una API key de Anthropic:
```
bash# Opción 1: variable de entorno temporal
export ANTHROPIC_API_KEY=sk-ant-api03-...

# Opción 2: agregar a tu .bashrc / .zshrc
echo 'export ANTHROPIC_API_KEY=sk-ant-api03-...' >> ~/.zshrc
source ~/.zshrc

# Opción 3: .env en la raíz del proyecto
echo "ANTHROPIC_API_KEY=sk-ant-api03-..." > .env
```

>Importante: Nunca subas tu API key a git. Asegúrate de tener .env en tu .gitignore.

Puedes obtener una API key en console.anthropic.com.

---

# Uso

Menú interactivo
Al ejecutar Codebrain sin argumentos, se abre el menú principal interactivo:
```
bashnpm run dev
# o
node dist/cli.js
```

Navega con las flechas del teclado y selecciona con Enter. Ctrl+C en cualquier momento regresa al menú.

---

# ⚡ Scan
Escaneo completo del proyecto. Es el comando más completo: muestra estructura de archivos, issues por archivo agrupados, score y opcionalmente análisis de arquitectura con IA.

### Lo que hace:

- Pregunta qué categorías analizar (Security, Quality, Types, Performance, Complexity, Dead - Code, Style)
- Pregunta el nivel mínimo de severidad a mostrar
- Escanea todos los archivos del proyecto (ignorando node_modules, dist, .git, etc.)
- Muestra el árbol de archivos del proyecto
- Muestra el score y grade del proyecto
- Lista todos los issues agrupados por archivo, con línea, código de regla y sugerencia de fix
- Muestra un resumen por severidad y categoría con estadísticas del proyecto
- Ofrece análisis de arquitectura con IA (si tienes API key)

### Categorías disponibles:
| Categoría      | Descripción                              |
|----------------|------------------------------------------|
| 🔐 Security    | Vulnerabilidades, secretos, inyección    |
| ✨ Quality     | Calidad general del código               |
| 🏷️ Types       | Problemas de tipado TypeScript          |
| ⚡ Performance  | Problemas de rendimiento                |
| 🔀 Complexity  | Complejidad ciclomática                 |
| 💀 Dead Code   | TODOs, FIXMEs, código comentado         |
| 🎨 Style       | Estilo y convenciones                   |

### Niveles de severidad:
| Nivel        | Descripción                                                      |
|--------------|------------------------------------------------------------------|
| 🔴 Critical   | Fix inmediato — puede causar brechas o crashes                 |
| 🟠 Error      | Problema real que debe corregirse                              |
| 🟡 Warning    | Mala práctica o riesgo potencial                                |
| ⚪ Hint       | Sugerencia de mejora                                            |


# 🐛 Bugs

Reporte de bugs enfocado en lo que importa: critical, errors y warnings. Soporta tres modos:

- **Modo estático** — Sin API key, análisis por reglas, instantáneo.
- **Modo IA** — Claude analiza los archivos más relevantes (los que más issues tienen) con contexto del análisis estático para encontrar bugs lógicos, race conditions y validaciones faltantes que las reglas no detectan.
- **Modo Both** — Primero el análisis estático completo, luego Claude añade análisis profundo.

#### El output muestra issues agrupados por severidad:
- CRITICAL — Fondo rojo, fix inmediato
- Errors — Rojo, alta prioridad
- Warnings — Amarillo, a revisar

#### Cada issue incluye:
- Archivo y número de línea
- Código de regla (ej. SEC001)
- Descripción del problema
- Sugerencia de fix

---

# 📊 Score
Score de salud del proyecto de 0 a 100 con grade (S, A, B, C, D, F) y breakdown por categoría.
#### Sistema de grades:
| Score      | Grade | Significado        |
|------------|-------|--------------------|
| 95–100     | S     | Perfecto 🏆        |
| 85–94      | A     | Excelente 🔥       |
| 75–84      | B     | Bueno ✅           |
| 60–74      | C     | Regular ⚠️        |
| 45–59      | D     | Necesita trabajo   |
| 0–44       | F     | Crítico 💀         |

El score por categoría muestra barras visuales individuales para Security, Quality, Types, Complexity, Performance y Dead Code, junto con el número de issues por categoría.

Al final lista los top 10 issues críticos/errors más importantes para saber exactamente por dónde empezar.

---

# 🧠 Explain

#### Análisis profundo de un archivo individual. Primero muestra información estática:
- Lenguaje detectado
- Líneas totales, de código, comentarios y blancos
- Complejidad ciclomática (simple / moderate / complex / very complex)
- Tamaño en bytes/KB
- Lista de exports del archivo
- Lista de funciones y métodos
- Issues estáticos del archivo (security + quality)

#### Luego, si tienes API key, ofrece tres opciones con IA:
- Explain — Claude explica el propósito, cómo funciona, sus exports y le da un rating 1–10 con justificación
- Review — Claude hace code review completo: correctness, seguridad, performance, mantenibilidad y tests faltantes con ejemplos de código
- Both — Ambos

---

# 🩺 Doctor

Health check del entorno de desarrollo. Verifica el estado del proyecto en múltiples dimensiones:

### Grupos de verificación:
#### Environment
- Node.js instalado (muestra versión)
- Package manager (npm, pnpm o bun)
- Git instalado

#### Project
- `package.json` existe
- Repositorio git inicializado
- `.gitignore` presente
- `README.md` presente

#### TypeScript
- `tsconfig.json` existe
- `strict: true` activado

#### Security
- `.env` está en `.gitignore`
- `.env` no contiene secretos largos
- `npm audit` sin vulnerabilidades críticas

#### Quality
- ESLint configurado
- Prettier configurado
- Script `test` definido
- Script `build` definido

#### CI/CD
- GitHub Actions configurado (`.github/workflows`)

#### Astro (si el proyecto usa Astro)
- `astro.config.mjs` o `astro.config.ts` existe
- `src/pages` existe

Cada check se muestra como `✔` (verde) o `✗` (rojo) con la sugerencia de fix para los que fallan. Al final resume cuántos checks son required vs recommended y si el proyecto está saludable.

---

# Modo IA

Codebrain usa **Claude Sonnet** de Anthropic para análisis profundo. El modo IA nunca reemplaza al análisis estático, lo complementa.

#### Cómo funciona
- El análisis estático corre siempre primero
- El resultado se pasa como contexto a Claude
- Claude analiza los archivos más relevantes (priorizados por cantidad de issues)
- El resultado combinado se muestra en el mismo output

#### Límites de tokens

> Para evitar costos innecesarios, Codebrain limita el contenido enviado a Claude:
- Máximo 8 archivos por análisis de bugs
- Máximo 6,000 caracteres por archivo en explain
- Máximo 8,000 caracteres en code review
- El análisis de arquitectura recibe los 50 paths principales + stats del proyecto

#### Sin API key
Si no tienes API key, Codebrain funciona perfectamente en modo estático. Al final de cada comando verás:
>💡 Set ANTHROPIC_API_KEY to enable AI-powered analysis

---

# Reglas de análisis

### Seguridad (SEC)
| Código  | Severidad     | Descripción |
|---------|--------------|-------------|
| SEC001  | 🔴 Critical  | Contraseña hardcodeada en código |
| SEC002  | 🔴 Critical  | API key hardcodeada |
| SEC003  | 🔴 Critical  | Token detectado (sk-, ghp_, AKIA, etc.) |
| SEC004  | 🔴 Critical  | Private key hardcodeada |
| SEC010  | 🔴 Critical  | Uso de eval() — code injection |
| SEC011  | 🟠 Error     | new Function() dinámico |
| SEC012  | 🔴 Critical  | Variable en exec() — command injection |
| SEC013  | 🟠 Error     | innerHTML = — XSS |
| SEC014  | 🟠 Error     | document.write() — XSS |
| SEC015  | 🟡 Warning   | dangerouslySetInnerHTML sin sanitizar |
| SEC020  | 🟠 Error     | Hash MD5 — algoritmo roto |
| SEC021  | 🟡 Warning   | Hash SHA-1 — algoritmo débil |
| SEC022  | 🟡 Warning   | Math.random() no es criptográficamente seguro |
| SEC030  | 🟡 Warning   | URL HTTP (no HTTPS) |
| SEC031  | 🔴 Critical  | rejectUnauthorized: false — SSL desactivado |
| SEC032  | 🟡 Warning   | CORS wildcard origin: '*' |
| SEC040  | 🔴 Critical  | Interpolación en SQL SELECT — SQL injection |
| SEC041  | 🔴 Critical  | Interpolación en SQL write — SQL injection |
| SEC050  | 🔴 Critical  | Path controlado por usuario — path traversal |
| SEC060  | ⚪ Hint      | Object.assign({}) — posible prototype pollution |
| SEC070  | 🟡 Warning   | Statement debugger en código |
| SEC071  | 🟡 Warning   | TODO de seguridad sin resolver |

---

### TypeScript (TS)

| Código | Severidad   | Descripción |
|--------|------------|-------------|
| TS001  | 🟡 Warning  | Tipo any explícito |
| TS002  | 🟡 Warning  | Cast as any |
| TS003  | 🟡 Warning  | @ts-ignore suprimiendo error |
| TS004  | 🟠 Error    | @ts-nocheck desactivando todo TS |

---

### Calidad (QA)

| Código | Severidad   | Descripción |
|--------|------------|-------------|
| QA001  | 🟠 Error    | Catch vacío — errores silenciados |
| QA002  | 🟡 Warning  | Catch con solo un comentario |
| QA003  | 🟡 Warning  | Promise.all() sin manejo de error |
| QA010  | 🟡 Warning  | console.log() en código |
| QA011  | ⚪ Hint      | console.error() sin logger estructurado |

---

### Dead Code (DC)

| Código | Severidad   | Descripción |
|--------|------------|-------------|
| DC001  | ⚪ Hint      | TODO sin resolver |
| DC002  | 🟡 Warning  | FIXME — código roto conocido |
| DC003  | ⚪ Hint      | HACK — deuda técnica |

---

### Performance (PERF)

| Código  | Severidad   | Descripción |
|---------|------------|-------------|
| PERF001 | ℹ️ Info     | Promise.all + .map — buen patrón paralelo |
| PERF002 | 🟡 Warning  | await dentro de loop — posible problema de rendimiento |

---

### React (RCT)

| Código | Severidad   | Descripción |
|--------|------------|-------------|
| RCT001  | 🟡 Warning  | async directo en useEffect |
| RCT002  | 🟡 Warning  | key={index} en lista React |

---

### Tamaño (SIZE)

| Código   | Severidad   | Descripción |
|----------|------------|-------------|
| SIZE001  | 🟡 Warning  | Archivo mayor a 400 líneas |
| SIZE002  | 🟠 Error    | Archivo mayor a 800 líneas |

---

### Complejidad (CPLX)

| Código   | Severidad   | Descripción |
|----------|------------|-------------|
| CPLX001  | 🟡 Warning  | Complejidad ciclomática > 20 |
| CPLX002  | 🟠 Error    | Complejidad ciclomática > 40 |

---

### Entorno (ENV)

| Código  | Severidad   | Descripción |
|---------|------------|-------------|
| ENV001  | ⚪ Hint      | process.env.X sin fallback (?? o ||)

---

### Sistema de puntuación

El score parte de **100** y se reduce según los issues encontrados:

| Severidad   | Penalización |
|------------|-------------|
| 🔴 Critical | −20 puntos  |
| 🟠 Error    | −10 puntos  |
| 🟡 Warning  | −3 puntos   |
| ⚪ Hint / ℹ Info | 0 puntos |

El score mínimo es 0. El score del proyecto es global (todos los archivos), y adicionalmente se calcula un score por categoría para el breakdown.

---

# Estructura del proyecto
```
codebrain/
├── src/
│   ├── cli.ts             ← Punto de entrada (shebang node)
│   ├── menu.ts            ← Menú interactivo principal
│   │
│   ├── core/
│   │   ├── types.ts       ← Interfaces y tipos base
│   │   ├── utils.ts       ← Lectura de archivos, detección de lenguaje,
│   │   │                     complejidad, helpers
│   │   └── analyzer.ts    ← Orquestador: combina reglas, calcula score
│   │
│   ├── security/
│   │   ├── rules.ts       ← 22 reglas de seguridad (SEC001–SEC071)
│   │   └── quality.ts     ← 21 reglas de calidad (TS, QA, DC, PERF, RCT)
│   │
│   ├── ai/
│   │   └── client.ts      ← Claude API: explain, bugs, review, ...
│   │
│   ├── commands/
│   │   ├── scan.ts        ← Escaneo completo del proyecto
│   │   ├── bugs.ts        ← Bug report (estático / IA / ambos)
│   │   ├── explain.ts     ← Explicación de archivo
│   │   ├── score.ts       ← Score con breakdown por categoría
│   │   └── doctor.ts      ← Health check del entorno
│   │
│   └── utils/
│       └── display.ts     ← Formateo, colores, tablas, árbol de archivos
│
├── package.json
└── tsconfig.json
```

#### Stack tecnológico
| Paquete     | Uso |
|-------------|-----|
| chalk       | Colores y estilos en terminal |
| figlet      | Banner ASCII al inicio |
| inquirer    | Menús y prompts interactivos |
| ora         | Spinners de carga |
| globby      | Glob de archivos con soporte ESM |
| typescript  | Tipado estático completo |
| tsx         | Ejecución de TS sin compilar (dev) |


#### Lenguajes soportados
| Extensión | Lenguaje               | Cobertura |
|-----------|------------------------|-----------|
| `.ts`       | TypeScript             | Completo  |
| `.tsx`      | TypeScript (React)     | Completo  |
| `.js`       | JavaScript             | Completo  |
| `.jsx`      | JavaScript (React)     | Completo  |
| `.mjs`      | JavaScript ESM        | Completo  |
| `.cjs`      | JavaScript CJS        | Completo  |
| `.astro`    | Astro                  | Completo  |
| `.vue`      | Vue                    | Completo  |
| `.svelte`   | Svelte                 | Completo  |
| `.py`       | Python                 | Seguridad + calidad básica |
| `.css`      | CSS                    | Tamaño    |
| `.scss`     | SCSS                   | Tamaño    |