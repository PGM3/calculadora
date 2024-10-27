const mysql = require('mysql2');

const conexion = mysql.createConnection({
    host: 'localhost',
    database: "calculadorasfv",
    user: 'root',
    password: ''
});

// Conectar a la base de datos
conexion.connect(error => {
    if(error) {
        console.error('Error al conectar a la base de datos:', error);
        return;
    }
    console.log('Conectado exitosamente a la base de datos');
});

// Manejar el cierre de conexión cuando la aplicación se cierre
process.on('SIGINT', () => {
    conexion.end(err => {
        if(err) {
            console.error('Error al cerrar la conexión:', err);
        }
        console.log('Conexión a la base de datos cerrada');
        process.exit();
    });
});

// Exportar la conexión
module.exports = conexion;