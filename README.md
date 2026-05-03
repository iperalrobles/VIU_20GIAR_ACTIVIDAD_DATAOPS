# VIU 20GIAR - Actividad

Proyecto de Metodologías de Desarrollo y Despliegue de Aplicaciones para Ciencia de Datos.

## Actividad solicitada

La presentación debe cubrir los siguientes puntos:

### 1. Introducción (2 min)
- Nombre del proyecto y equipo
- Problema que resuelve
- Tecnologías principales usadas

### 2. Arquitectura del Sistema (3 min)
- Diagrama de arquitectura (obligatorio)
- Flujo de datos desde la fuente hasta el consumidor
- Decisiones de diseño y por qué se tomaron

### 3. Implementación (5 min)
- Demostración en vivo del pipeline funcionando
- Código más relevante (2-3 snippets)
- Dificultades encontradas y cómo se resolvieron

### 4. Metodología Ágil Aplicada (2 min)
- Cómo se organizó el trabajo (SCRUM/Kanban)
- Sprints completados y backlog
- Velocidad del equipo y retrospectiva

### 5. Resultados y Métricas (3 min)
- Métricas de negocio y técnicas alcanzadas
- Qué funciona, qué falta, qué se mejoraría
- Comparación con el plan inicial

### 6. Conclusiones (2 min)
- Aprendizajes principales
- Próximos pasos si se continuara el proyecto

---

## Sobre el proyecto

### Financial Dashboard

Aplicación web de tipo Single Page Application (SPA) que muestra un dashboard financiero de stocks. Permite al usuario autenticarse con credenciales predefinidas y visualizar gráficos de precios y volumen de acciones, con filtros por ticker y rango temporal.

Los datos se obtienen de la API gratuita de Alpha Vantage, con datos mock como fallback.

### Tecnologías

- **Frontend:** React + Vite
- **Gráficos:** Recharts
- **Datos:** Alpha Vantage API
- **Hosting:** GitHub Pages (SPA estática)

### Metodología

El trabajo se organiza utilizando **Kanban** con tickets gestionados en [Trello](https://trello.com/b/tBDHhGKS/dashboard-financiero-kanban). Cada ticket representa una unidad de trabajo independiente que se desarrolla en su propia feature branch y se integra a `main` mediante Pull Requests con revisión obligatoria.

### Pipelines CI/CD

El proyecto cuenta con dos pipelines de GitHub Actions:

- **CI (feature branches):** Se ejecuta en cada push a ramas de feature. Corre linting (ESLint) y tests (Vitest) automáticamente. El PR no puede mergearse si el pipeline falla.
- **CD (main):** Se ejecuta en cada merge a `main`. Hace build de producción y despliega automáticamente a GitHub Pages.

---

## Uso del Dashboard

### Acceso

La aplicación está desplegada en: https://mmarmol.github.io/VIU_20GIAR_ACTIVIDAD/

**Credenciales de acceso:**

| Campo | Valor |
|-------|-------|
| Usuario | `administrador` |
| Contraseña | `viu2026` |

### Funcionalidades

Al iniciar sesión se accede al dashboard financiero con las siguientes funcionalidades:

**Gráfico de precio de cierre:** Gráfico de línea temporal que muestra la evolución del precio de cierre de la acción seleccionada. Incluye tooltip interactivo que muestra fecha y precio al pasar el cursor.

**Gráfico de volumen de operaciones:** Gráfico de barras que muestra el volumen diario de operaciones de la acción seleccionada. El eje Y está formateado en millones (M).

**Filtro por ticker:** Selector desplegable para elegir entre las acciones disponibles:
- AAPL (Apple)
- GOOGL (Google)
- MSFT (Microsoft)
- AMZN (Amazon)
- TSLA (Tesla)

**Filtro por rango temporal:** Botones para filtrar el periodo de datos visualizado:
- 1S (1 semana)
- 1M (1 mes)
- 3M (3 meses) - seleccionado por defecto
- 6M (6 meses)
- 1A (1 año)

**Cerrar sesión:** Botón en la esquina superior derecha que cierra la sesión y redirige a la pantalla de login.

### Datos

Los datos se obtienen de la API de Alpha Vantage (tier gratuito, 25 requests/día). Cuando la API no está disponible o se excede el límite, la aplicación utiliza datos mock generados automáticamente que simulan un año de cotizaciones.

### Ejecución local

```bash
git clone https://github.com/mmarmol/VIU_20GIAR_ACTIVIDAD.git
cd VIU_20GIAR_ACTIVIDAD
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Documentación adicional

- [ARQUITECTURA.md](ARQUITECTURA.md) - Arquitectura del sistema, decisiones de diseño y diagramas
