# Del Valle — Frontend

Aplicación web en React para el sistema de inventarios de Constructora Del Valle S.A. Se conecta con el backend Express, muestra existencias, alertas de reorden y órdenes posiblemente duplicadas, y permite registrar movimientos y órdenes de compra.

## Requisitos

- Node.js 18 o posterior.
- Backend iniciado en `http://localhost:3000`.
- Base de datos MySQL migrada y un usuario creado para iniciar sesión.

## Instalación y ejecución

Desde esta carpeta:

```bash
npm install
```

Copia `.env.example` a `.env` si la API no está en la URL predeterminada. Vite expone las variables `VITE_*` al navegador, por lo que no se deben guardar secretos en este archivo.

```dotenv
VITE_API_URL=http://localhost:3000/api
```

Inicia el modo de desarrollo:

```bash
npm run dev
```

Abre la URL que informa Vite, normalmente `http://localhost:5173`. El comando contempla rutas de Windows que contienen `#`, que de otro modo impiden cargar el cliente de Vite y dejan la página en blanco. El backend debe permitir el origen `http://localhost:5173` en `CORS_ORIGINS`.

Para generar una compilación:

```bash
npm run build
```

## Autenticación

La aplicación ofrece inicio de sesión y registro. El JWT se guarda en `localStorage` y se envía en el encabezado `Authorization: Bearer <token>` para las rutas protegidas. Cerrar sesión elimina el token local.

## Vistas

- **Panel general:** KPIs, alertas de reorden y coincidencias de órdenes.
- **Materiales:** inventario con búsqueda y stock calculado por material.
- **Órdenes de compra:** listado y creación de una orden con un detalle.
- **Acciones rápidas:** registro de entradas, salidas o traslados de inventario.

La navegación utiliza rutas hash (`#/resumen`, `#/materiales` y `#/ordenes`). Los componentes compartidos están en `src/components/`, la comunicación HTTP y las operaciones de inventario en `src/services/`, y el mapeo de rutas en `src/routes.js`.
