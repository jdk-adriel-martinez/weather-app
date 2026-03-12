# Weather App

Aplicacion de clima construida con Next.js para consultar el clima actual de una ciudad.

La app permite:
- buscar una ciudad
- ver temperatura actual
- ver humedad
- ver una descripcion breve del clima
- manejar errores cuando la ciudad no existe o la consulta falla

## Requisitos previos

- Node.js `>= 20.9.0`
- `pnpm` instalado
- una API key de OpenWeatherMap

## Instalacion

Desde la carpeta del proyecto:

```bash
cd weather-app
pnpm install
```

## Variables de entorno

Crea un archivo `.env.local` en la raiz del proyecto con:

```env
OPENWEATHER_API_KEY=tu_api_key
```

Notas:
- `OPENWEATHER_API_KEY` es la variable recomendada.
- El proyecto tambien acepta `WEATHER_API_KEY` como fallback.
- La API key se usa del lado del servidor a traves de las rutas internas de Next.js.

## Ejecutar en desarrollo

```bash
pnpm dev
```

Luego abre:

```text
http://localhost:3000
```

## Ejecutar en produccion

Compilar:

```bash
pnpm build
```

Levantar el servidor compilado:

```bash
pnpm start
```

## Pruebas

Ejecutar todos los tests:

```bash
pnpm test
```

Ejecutar tests en modo watch:

```bash
pnpm test:watch
```

Generar reporte de cobertura:

```bash
pnpm test:coverage
```

## Cobertura minima

El proyecto esta configurado con Jest para exigir una cobertura global minima del `80%` en:

- `statements`
- `branches`
- `functions`
- `lines`

## Que validan las pruebas

Las pruebas cubren los puntos principales del ejercicio:

- la busqueda exitosa y la visualizacion del clima
- el manejo de error cuando la ciudad es invalida
- el funcionamiento del input y del boton de busqueda

Ademas, tambien se prueban hooks, servicios y rutas API internas.

## Comandos utiles

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm test
pnpm test:watch
pnpm test:coverage
```

## Problemas comunes

Si la app no devuelve resultados, revisa primero:

- que `.env.local` exista en la raiz del proyecto
- que `OPENWEATHER_API_KEY` tenga un valor valido
- que hayas reiniciado el servidor despues de cambiar variables de entorno
