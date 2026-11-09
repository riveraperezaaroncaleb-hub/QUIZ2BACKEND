# Quiz #2 — Control de Inventario

API REST para la **Opción 2: Control de Inventario para Constructora Del Valle S.A.** El sistema administra materiales, proveedores, órdenes de compra y movimientos de inventario. Calcula existencias a partir de entradas y salidas, genera alertas cuando un material llega a su punto de reorden y detecta posibles órdenes de compra duplicadas.

## Tecnologías

- [Node.js](https://nodejs.org/) 18 o posterior
- [Express](https://expressjs.com/) 4
- [Sequelize](https://sequelize.org/) 6
- [MySQL](https://www.mysql.com/) y el driver `mysql2`
- [dotenv](https://www.npmjs.com/package/dotenv) para la configuración mediante variables de entorno

## Arquitectura

```text
src/
├── app.js
├── migrations/
│   ├── 20261109000000-create-inventory-tables.js
│   └── 20261109130000-create-usuarios.js
├── config/
│   └── database.js
├── models/
│   ├── Categoria.js
│   ├── DetalleOC.js
│   ├── Material.js
│   ├── Movimiento.js
│   ├── OrdenCompra.js
│   ├── Proveedor.js
│   ├── Usuario.js
│   └── index.js
├── middleware/
│   └── autenticar.js
├── controllers/
│   ├── authController.js
│   ├── categoriaController.js
│   ├── crudControllerFactory.js
│   ├── detalleOCController.js
│   ├── materialController.js
│   ├── movimientoController.js
│   ├── ordenCompraController.js
│   └── proveedorController.js
├── routes/
│   ├── authRoutes.js
│   ├── categoriaRoutes.js
│   ├── detalleOCRoutes.js
│   ├── materialRoutes.js
│   ├── movimientoRoutes.js
│   ├── ordenCompraRoutes.js
│   └── proveedorRoutes.js
├── services/
│   ├── duplicadosService.js
│   ├── reordenService.js
│   └── tokenService.js
└── seeders/
    └── seed.js

config/
└── config.js
.sequelizerc
```

- **config:** conexión de Sequelize a MySQL.
- **models:** modelos de datos y asociaciones entre categorías, materiales, proveedores, órdenes, detalles y movimientos.
- **controllers:** validación de solicitudes y respuestas HTTP.
- **routes:** definición de los endpoints de la API.
- **services:** lógica de cálculo del punto de reorden y detección de duplicados.
- **seeders:** inicialización de tablas y carga de datos de ejemplo.
- **app.js:** configuración de Express y arranque del servidor.

## Requisitos previos

- Node.js 18 o posterior y npm.
- MySQL Server instalado y en ejecución. MySQL Workbench puede utilizarse para administrar la instancia.
- Una base de datos MySQL y un usuario con permisos para crear y modificar tablas.

## Instalación y configuración

1. **Clona el repositorio** y accede al directorio del proyecto:

   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd <DIRECTORIO_DEL_REPOSITORIO>
   ```

2. **Instala las dependencias:**

   ```bash
   npm install
   ```

3. **Crea la base de datos** en MySQL o desde MySQL Workbench:

   ```sql
   CREATE DATABASE inventario_compras
     CHARACTER SET utf8mb4
     COLLATE utf8mb4_unicode_ci;
   ```

4. **Configura las variables de entorno.** Copia `.env.example` como `.env`:

   ```bash
   # Windows PowerShell
   Copy-Item .env.example .env

   # macOS / Linux
   cp .env.example .env
   ```

   Edita `.env` y especifica los datos de conexión de tu servidor MySQL:

   ```dotenv
   NODE_ENV=development
   PORT=3000
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=inventario_compras
   DB_USER=root
   DB_PASSWORD=tu_contraseña
   JWT_SECRET=PEGA_AQUI_UN_SECRETO_ALEATORIO
   JWT_EXPIRES_IN=1h
   ```

   Genera el valor de `JWT_SECRET` con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` y pégalo en `.env`. Debe ser privado y tener al menos 32 caracteres. No compartas ni subas el archivo `.env` al repositorio.

5. **Inicializa las tablas y carga los datos de ejemplo:**

   ```bash
   npm run db:migrate
   npm run seed
   ```

   La migración crea las tablas y relaciones del modelo. El seeder carga una categoría, un proveedor y existencias iniciales para Cemento 50kg, Varilla #3, Block 12x20x40 y Arena; puede ejecutarse nuevamente sin duplicar esos registros iniciales.

6. **Inicia el servidor:**

   ```bash
   npm start
   ```

   Para desarrollo con recarga automática:

   ```bash
   npm run dev
   ```

   La API queda disponible en `http://localhost:3000` (o en el puerto definido en `PORT`). Al iniciar, verifica la conexión con MySQL; aplica primero las migraciones para preparar el esquema.

## Endpoints principales

Todas las rutas están bajo el prefijo `/api`. Los cuerpos de solicitud y las respuestas utilizan JSON.
Salvo `/api/health`, `/api/auth/register` y `/api/auth/login`, todos los endpoints requieren autenticación JWT. Envía el token en el encabezado `Authorization: Bearer <token>`.

### Registrar cuenta e iniciar sesión

`POST /api/auth/register`:

```json
{
  "nombre": "Nombre del usuario",
  "correo": "usuario@example.com",
  "password": "una-clave-segura"
}
```

`POST /api/auth/login` usa `correo` y `password` con el mismo formato. Ambos endpoints devuelven un objeto `token`; úsalo en las solicitudes protegidas:

```http
Authorization: Bearer <token>
```

La contraseña se almacena como hash y el token expira según `JWT_EXPIRES_IN` (por defecto, una hora).

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/health` | Comprueba que el servidor esté activo. |
| `POST` | `/api/auth/register` | Registra una cuenta y devuelve un JWT. |
| `POST` | `/api/auth/login` | Valida credenciales y devuelve un JWT. |
| `GET` | `/api/auth/me` | Devuelve la cuenta asociada al JWT. |
| `GET`, `POST` | `/api/categorias` | Lista y crea categorías. |
| `GET`, `PATCH`, `DELETE` | `/api/categorias/:id` | Consulta, actualiza o elimina una categoría. |
| `GET`, `POST` | `/api/materiales` | Lista y crea materiales. |
| `GET`, `PATCH`, `DELETE` | `/api/materiales/:id` | Consulta, actualiza o elimina un material. |
| `GET` | `/api/materiales/:id/stock` | Devuelve el stock calculado, el punto de reorden y el estado del material (`NORMAL` o `REORDEN`). |
| `GET` | `/api/alertas/reorden` | Lista los materiales activos cuyo stock está por debajo de su punto de reorden. |
| `GET`, `POST` | `/api/proveedores` | Lista y crea proveedores. |
| `GET`, `PATCH`, `DELETE` | `/api/proveedores/:id` | Consulta, actualiza o elimina un proveedor. |
| `POST` | `/api/movimientos` | Registra una entrada, salida o traslado de un material y devuelve el stock actualizado. |
| `GET` | `/api/movimientos` y `/api/movimientos/:id` | Consulta movimientos; se conservan como bitácora y no se editan ni eliminan desde la API. |
| `GET`, `POST` | `/api/ordenes` | Lista y crea órdenes de compra. Al crear, se envían los detalles dentro de la orden. |
| `GET`, `PATCH`, `DELETE` | `/api/ordenes/:id` | Consulta, actualiza o elimina una orden de compra. |
| `GET`, `POST` | `/api/ordenes/:ordenCompraId/detalles` | Lista o agrega detalles a una orden. |
| `GET`, `PATCH`, `DELETE` | `/api/ordenes/:ordenCompraId/detalles/:id` | Consulta, actualiza o elimina un detalle de la orden. |
| `GET` | `/api/ordenes/posibles-duplicados` | Busca órdenes con el mismo proveedor, material y cantidad, registradas dentro de un intervalo de hasta 48 horas. |

### Consultar stock

```http
GET /api/materiales/1/stock
```

El punto de reorden se calcula como **PR = d × L + SS**, donde `d` es la demanda diaria, `L` el tiempo de entrega en días y `SS` el stock de seguridad.

### Consultar alertas

```http
GET /api/alertas/reorden
```

La respuesta contiene el total y la lista de materiales que requieren reorden.

### Registrar un movimiento

```http
POST /api/movimientos
Content-Type: application/json
```

Ejemplo de entrada:

```json
{
  "materialId": 1,
  "tipo": "entrada",
  "cantidad": 25,
  "referencia": "REC-2026-001",
  "observaciones": "Recepción de compra"
}
```

Los valores admitidos para `tipo` son `entrada`, `salida` y `traslado`. Una salida que exceda el stock disponible es rechazada. Un traslado requiere `ubicacionOrigen` y `ubicacionDestino` diferentes; no modifica el stock total del material.

### Detectar posibles órdenes duplicadas

```http
GET /api/ordenes/posibles-duplicados
```

Devuelve pares sospechosos cuando comparten proveedor y tienen al menos un detalle con el mismo material y cantidad, con fechas separadas por un máximo de 48 horas. Este endpoint informa coincidencias; no elimina ni modifica órdenes.

## Migraciones

Las migraciones se ejecutan con Sequelize CLI y quedan registradas en `SequelizeMeta`. Para aplicar la siguiente migración:

```bash
npm run db:migrate
```

Para revertir la migración más reciente:

```bash
npm run db:migrate:undo
```

El servidor no crea ni altera tablas automáticamente: aplica las migraciones antes de iniciarlo. En bases de datos previamente creadas con `sequelize.sync()`, revisa o respalda el esquema antes de migrar, ya que las migraciones iniciales están destinadas a una base vacía.
