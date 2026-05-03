# Sprint DataOps - Automatizacion del dashboard financiero

## Objetivo del sprint

Convertir el dashboard financiero existente en una solucion DataOps reproducible, con un pipeline ETL orquestado, datos validados, contenedorizacion, CI/CD y documentacion actualizada.

## Product Backlog seleccionado

| Ticket | Historia de usuario | Criterios de aceptacion | Estado |
| --- | --- | --- | --- |
| DATAOPS-01 | Como analista quiero un pipeline ETL financiero para no depender de consultas manuales a la API | Extrae datos por ticker, usa fallback mock, transforma metricas y genera salida reutilizable | Done |
| DATAOPS-02 | Como responsable de calidad quiero validaciones de datos antes de publicar el dataset | Valida columnas, precios positivos, fechas no duplicadas, volumen y coherencia high/low | Done |
| DATAOPS-03 | Como usuario del dashboard quiero consumir datos ya procesados por DataOps | La app lee `public/data/stocks.json` y conserva fallback API/mock | Done |
| DATAOPS-04 | Como equipo DevOps quiero ejecutar el ETL en Docker con Prefect | Dockerfile ETL, Docker Compose y Prefect UI muestran ejecuciones del flujo | Done |
| DATAOPS-05 | Como equipo quiero evidencias reproducibles en CI/CD | GitHub Actions valida frontend, ETL, cobertura y build Docker | Done |
| DATAOPS-06 | Como profesor quiero documentacion clara de arquitectura y reproducibilidad | README y ARQUITECTURA describen flujo DataOps, decisiones y demo | Done |

## Sprint Backlog tecnico

- Implementar `etl/flow.py` con tareas Prefect: extract, transform, validate, load y publish.
- Crear tests de ETL con cobertura minima del 70%.
- Publicar dataset frontend en `public/data/stocks.json`.
- Modificar `stockService.js` para priorizar el dataset DataOps.
- Mostrar en dashboard la fuente de datos cargada.
- Configurar `Dockerfile.etl` y `docker-compose.yml`.
- Ajustar dependencias compatibles con Prefect (`griffe` y `pydantic`).
- Actualizar workflows de CI/CD.
- Actualizar README y arquitectura.

## Definicion de terminado

- `npm run lint` pasa correctamente.
- `npm run test` pasa correctamente.
- `npm run build` pasa correctamente.
- `pytest etl/tests --cov=etl --cov-report=term-missing --cov-fail-under=70` pasa correctamente.
- `docker compose run --rm etl-worker` registra una ejecucion en Prefect UI.
- El dashboard carga datos desde `public/data/stocks.json`.

## Demo del sprint

1. Ejecutar `docker compose up -d prefect-server`.
2. Ejecutar `docker compose run --rm etl-worker`.
3. Abrir Prefect UI en `http://localhost:4200/flow-runs` y mostrar el flow run completado.
4. Ejecutar `npm run dev` y abrir el dashboard.
5. Comprobar que la fuente de datos indica `Dataset DataOps validado`.

## Retrospectiva

### Que salio bien

- Se mantuvo la aplicacion React existente sin rehacerla.
- El pipeline funciona sin API key gracias a datos mock deterministas.
- Prefect aporta trazabilidad visual para la defensa.

### Que se puede mejorar

- Programar el pipeline en un deployment Prefect periodico.
- Publicar el dataset en S3 en lugar de servirlo solo como JSON estatico.
- Separar entornos dev/staging/prod con variables especificas.

### Acciones de mejora

- Crear un deployment programado diario para el ETL.
- Anadir Terraform para S3/EC2 como despliegue objetivo.
- Incorporar alertas si falla la validacion de calidad.
