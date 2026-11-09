require('dotenv').config();
const express = require('express');
const sequelize = require('./config/database');
require('./models');

const materialRoutes = require('./routes/materialRoutes');
const movimientoRoutes = require('./routes/movimientoRoutes');
const ordenCompraRoutes = require('./routes/ordenCompraRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const proveedorRoutes = require('./routes/proveedorRoutes');
const detalleOCRoutes = require('./routes/detalleOCRoutes');
const authRoutes = require('./routes/authRoutes');
const autenticar = require('./middleware/autenticar');

const app = express();
app.use(express.json());

const allowedOrigins = (
  process.env.CORS_ORIGINS
  || 'http://127.0.0.1:5500,http://localhost:5500,http://127.0.0.1:5173,http://localhost:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
  } else if (req.method === 'OPTIONS') {
    return res.sendStatus(origin ? 403 : 204);
  }
  return next();
});

app.get('/api/health', (req, res) => res.json({ estado: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api', autenticar);
app.use('/api', materialRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/movimientos', movimientoRoutes);
app.use('/api/ordenes', ordenCompraRoutes);
app.use('/api/ordenes/:ordenCompraId/detalles', detalleOCRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

app.use((error, req, res, next) => {
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ error: 'Ya existe un registro con uno de los valores únicos enviados.' });
  }
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({ error: 'No se puede completar la operación porque hay registros relacionados.' });
  }
  if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeDatabaseError') {
    return res.status(400).json({ error: error.message });
  }
  console.error(error);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

const port = Number(process.env.PORT) || 3000;

async function start() {
  await sequelize.authenticate();
  app.listen(port, () => {
    console.log(`API disponible en http://localhost:${port}`);
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error('No se pudo iniciar la API:', error);
    process.exitCode = 1;
  });
}

module.exports = app;
