# Arquitectura - Financial Dashboard

## Descripcion general

Financial Dashboard es una Single Page Application (SPA) construida con React y Vite, desplegada en GitHub Pages. Permite visualizar datos financieros de acciones (stocks) con graficos interactivos y filtros.

La aplicacion es completamente estatica (sin backend). Los datos se obtienen desde la API de Alpha Vantage en el navegador del usuario, con datos mock como fallback.

## Diagrama de arquitectura

```mermaid
graph TB
    subgraph "GitHub Pages"
        SPA[SPA React + Vite]
    end

    subgraph "Navegador del usuario"
        Login[Pantalla de Login]
        Auth[AuthContext - Sesion]
        Router[React Router - HashRouter]
        Dashboard[Dashboard]
        Filters[Filtros - Ticker + Rango]
        PriceChart[Grafico de Precio]
        VolumeChart[Grafico de Volumen]
    end

    subgraph "Datos"
        API[Alpha Vantage API]
        Mock[Mock Data - Fallback]
    end

    SPA --> Router
    Router --> Login
    Router -->|Autenticado| Dashboard
    Login --> Auth
    Dashboard --> Filters
    Dashboard --> PriceChart
    Dashboard --> VolumeChart
    Filters -->|Ticker + Rango| PriceChart
    Filters -->|Ticker + Rango| VolumeChart
    PriceChart --> API
    API -->|Error / Limite| Mock
```

## Flujo de datos

```mermaid
sequenceDiagram
    actor User
    participant Login
    participant AuthContext
    participant Dashboard
    participant StockService
    participant AlphaVantage
    participant MockData

    User->>Login: Ingresa usuario y password
    Login->>AuthContext: Validar credenciales
    AuthContext-->>Login: OK / Error
    Login-->>User: Redirige al Dashboard / Muestra error

    User->>Dashboard: Selecciona ticker y rango
    Dashboard->>StockService: getStockData(ticker)
    StockService->>AlphaVantage: GET /query?function=TIME_SERIES_DAILY
    alt API responde OK
        AlphaVantage-->>StockService: Datos JSON
    else API falla o limite excedido
        StockService->>MockData: Cargar datos locales
        MockData-->>StockService: Datos mock
    end
    StockService-->>Dashboard: { data, source }
    Dashboard->>Dashboard: Filtrar por rango temporal
    Dashboard->>Dashboard: Renderizar graficos
```

## Estructura del proyecto

```
src/
  components/          Componentes reutilizables
    Navbar.jsx         Barra de navegacion con logout
    PriceChart.jsx     Grafico de linea (precio de cierre)
    VolumeChart.jsx    Grafico de barras (volumen)
    TickerSelector.jsx Selector de ticker (AAPL, GOOGL, etc)
    RangeSelector.jsx  Botones de rango temporal (1S, 1M, 3M, 6M, 1A)
    ProtectedRoute.jsx Proteccion de rutas privadas
  pages/               Paginas de la aplicacion
    Login.jsx          Pantalla de login
    Dashboard.jsx      Dashboard principal con graficos y filtros
  context/             Estado global
    AuthContext.jsx     Proveedor de autenticacion
    auth-context.js    Definicion del contexto
    useAuth.js         Hook para acceder al contexto de auth
  services/            Logica de datos
    stockService.js    Servicio que consulta Alpha Vantage o mock
    mockData.js        Datos mock para 5 tickers
  test/                Configuracion de tests
    setup.js           Setup de jest-dom
```

## Decisiones de diseno

| Decision | Alternativa | Por que |
|----------|-------------|---------|
| React + Vite | Next.js, CRA | No necesitamos SSR. Vite es mas rapido para desarrollo y build |
| HashRouter | BrowserRouter | GitHub Pages no soporta rutas SPA con BrowserRouter |
| Recharts | Chart.js, D3 | API declarativa que encaja con React, facil de usar |
| Alpha Vantage | Yahoo Finance, Finnhub | API gratuita con datos diarios, no requiere registrar app |
| Mock data como fallback | Solo API | El tier gratuito tiene limite de 25 req/dia, mock garantiza que la demo siempre funcione |
| sessionStorage | localStorage | La sesion se limpia al cerrar el navegador, mas seguro para credenciales hardcodeadas |
| Context API | Redux, Zustand | Para un solo estado global (auth) no se justifica una libreria externa |

## Pipelines CI/CD

```mermaid
graph LR
    subgraph "CI - Feature branches"
        Push[Push a cualquier branch] --> Lint[ESLint]
        Lint --> Tests[Vitest]
        Tests -->|Falla| Reject[Build rechazado]
        Tests -->|Pasa| OK[Check verde]
    end

    subgraph "CD - main"
        Merge[Merge a main] --> Lint2[ESLint]
        Lint2 --> Tests2[Vitest]
        Tests2 --> Build[npm run build]
        Build --> Deploy[GitHub Pages]
    end
```

Los pipelines estan documentados en detalle en [CI_CD_GUIDE.md](CI_CD_GUIDE.md).

## Tecnologias

| Tecnologia | Version | Uso |
|------------|---------|-----|
| React | 19 | Framework UI |
| Vite | 8 | Build tool y dev server |
| React Router | 7 | Routing SPA |
| Recharts | 3 | Graficos |
| Vitest | 4 | Testing |
| React Testing Library | 16 | Testing de componentes |
| ESLint | 10 | Linting |
| GitHub Actions | - | CI/CD |
| GitHub Pages | - | Hosting |
