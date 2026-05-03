# Arquitectura - Financial Dashboard DataOps

## Descripcion general

Financial Dashboard DataOps es una Single Page Application construida con React y Vite que muestra un dashboard financiero con login, filtros de ticker y graficos interactivos. La aplicacion se alimenta prioritariamente de un dataset generado por un pipeline DataOps en Python.

El cambio principal respecto a una SPA puramente estatica es que la obtencion y preparacion de datos se mueve fuera del navegador. El pipeline extrae datos, los transforma, valida su calidad y publica un JSON listo para el frontend.

## Diagrama de arquitectura

```mermaid
graph TB
    subgraph "Fuentes"
        API[Alpha Vantage API]
        Mock[Mock determinista]
    end

    subgraph "Pipeline DataOps"
        Extract[Extract]
        Transform[Transform]
        Validate[Validate]
        SQLite[(SQLite)]
        Dataset[stocks.json]
    end

    subgraph "GitHub Pages"
        SPA[React + Vite SPA]
    end

    subgraph "Navegador"
        Login[Pantalla de Login]
        Auth[AuthContext]
        Dashboard[Dashboard]
        Charts[Graficos Recharts]
    end

    API --> Extract
    Mock --> Extract
    Extract --> Transform
    Transform --> Validate
    Validate --> SQLite
    Validate --> Dataset
    Dataset --> SPA
    SPA --> Login
    Login --> Auth
    Auth --> Dashboard
    Dashboard --> Charts
```

## Flujo de datos

```mermaid
sequenceDiagram
    participant Scheduler as GitHub Actions / Docker
    participant ETL as Prefect ETL
    participant API as Alpha Vantage
    participant DB as SQLite
    participant JSON as stocks.json
    participant React as Dashboard React
    actor User

    Scheduler->>ETL: Ejecuta financial_etl_pipeline
    ETL->>API: Solicita TIME_SERIES_DAILY por ticker
    alt API disponible
        API-->>ETL: Datos diarios
    else API no disponible o limite excedido
        ETL->>ETL: Genera mock determinista
    end
    ETL->>ETL: Normaliza y calcula metricas
    ETL->>ETL: Valida calidad de datos
    ETL->>DB: Guarda copia auditable
    ETL->>JSON: Publica dataset frontend
    User->>React: Accede al dashboard
    React->>JSON: Carga datos procesados
    React-->>User: Renderiza precio y volumen
```

## Estructura relevante

```text
etl/
  flow.py                 Pipeline Extract, Transform, Validate, Load
  requirements.txt        Dependencias Python
  tests/test_flow.py      Tests del pipeline con cobertura
public/data/
  stocks.json             Dataset generado para el dashboard
src/
  services/stockService.js Lee stocks.json y usa API/mock como fallback
  pages/Dashboard.jsx     Dashboard financiero
.github/workflows/
  ci.yml                  Validacion frontend + ETL
  deploy.yml              Generacion dataset + build + GitHub Pages
Dockerfile.etl            Imagen del pipeline
Docker-compose.yml        Prefect server + worker ETL
```

## Decisiones de diseno

| Decision | Alternativa | Justificacion |
| --- | --- | --- |
| Prefect | Airflow | Menor complejidad operativa y suficiente para un ETL academico |
| JSON estatico | API backend | Compatible con GitHub Pages y facil de reproducir |
| SQLite | PostgreSQL | Trazabilidad local sin levantar infraestructura extra |
| Mock determinista | Mock aleatorio | Tests y demos reproducibles |
| React + Vite | Next.js | No se necesita SSR ni backend Node |
| HashRouter | BrowserRouter | Evita problemas de rutas en GitHub Pages |
| Docker Compose | Kubernetes | Complejidad adecuada para el alcance de la practica |

## Calidad de datos

El pipeline valida:

- columnas obligatorias;
- dataset no vacio;
- fechas no duplicadas por ticker;
- precios positivos;
- `high >= low`;
- volumen no negativo.

## CI/CD

```mermaid
graph LR
    Push[Push / Pull Request] --> Front[Lint + tests React]
    Push --> ETLTests[Tests ETL + cobertura]
    ETLTests --> Docker[Build Docker ETL]
    Main[Merge a main] --> Generate[Generar stocks.json]
    Generate --> Build[Build React]
    Build --> Pages[Deploy GitHub Pages]
```

## Despliegue objetivo AWS

La carpeta `infrastructure/` se reserva para el despliegue objetivo en AWS mediante Terraform. La arquitectura propuesta es ejecutar el pipeline en una instancia EC2 o tarea programada y publicar el dataset resultante para que el dashboard lo consuma.
