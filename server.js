const express = require('express');
const path = require('path');
const bodyParser = require('body-parser'); 
const app = express();


app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Importar la conexión
const conexion = require('./public/views/src/controllers/conexion.js');

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo salió mal!');
});

// Iniciar servidor
const port = 3000;
app.listen(port, () => {
    console.log(`Servidor iniciado en http://localhost:${port}`);
});