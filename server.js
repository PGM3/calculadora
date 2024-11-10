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

// Ruta para guardar el sistema fotovoltaico y los consumos
app.post('/guardarSistemaFotovoltaico', (req, res) => {
    console.log("Datos recibidos:", req.body); // Registra todos los datos recibidos

    const {
        referencia,
        cliente,
        tipoSistema,
        datosBimestres,
        ubicacion,
        tipoPropiedad,
        horasSolares,  // Asegúrate de que este campo coincida con la base de datos
        potenciaPico,
        promedioDiario,
        promedioMensual,
        promedioAnual,
        marcaModulo,
        potenciaModulo,
        modulosUtilizar,
        marcaInversor,
        potenciaInversor,
        inversoresUtilizar,
        telefono,
        correo
    } = req.body;

    conexion.beginTransaction(error => {
        if (error) {
            console.error("Error al iniciar la transacción:", error);
            return res.status(500).json({ success: false, message: 'Error al iniciar la transacción.' });
            console.log("no se inició la transacción.");
        }

        const queryCliente = `INSERT INTO clientes (referencia, nombre_cliente, telefono, correo) VALUES (?, ?, ?, ?)`;
        const valoresCliente = [referencia, cliente, telefono, correo];

        conexion.query(queryCliente, valoresCliente, (error, results) => {
            if (error) {
                console.error("Error al guardar los datos del cliente:", error);
                return conexion.rollback(() => res.status(500).json({ success: false, message: 'Error al guardar los datos del cliente.' }));
                console.log("Datos del cliente.");
            }

            const id_cliente = results.insertId;

            const queryUbicacion = `INSERT INTO ubicaciones (direccion, tipo_propiedad, horas_solares) VALUES (?, ?, ?)`;
            const valoresUbicacion = [ubicacion, tipoPropiedad, horasSolares];

            conexion.query(queryUbicacion, valoresUbicacion, (error, results) => {
                if (error) {
                    console.error("Error al guardar la ubicación:", error);
                    return conexion.rollback(() => res.status(500).json({ success: false, message: 'Error al guardar la ubicación.' }));
                    console.log("Datos de la ubicacion.");
                }

                const id_ubicacion = results.insertId;

                const querySistema = `
                    INSERT INTO sistemas (id_cliente, tipo_sistema, potencia_pico, promedio_diario, promedio_mensual, promedio_anual, id_ubicacion)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
                const valoresSistema = [id_cliente, tipoSistema, potenciaPico, promedioDiario, promedioMensual, promedioAnual, id_ubicacion];

                conexion.query(querySistema, valoresSistema, (error, results) => {
                    if (error) {
                        console.error("Error al guardar el sistema:", error);
                        return conexion.rollback(() => res.status(500).json({ success: false, message: 'Error al guardar el sistema.' }));
                        console.log("Datos del sistema.");
                    }

                    const id_sistema = results.insertId;

                    const valoresConsumo = datosBimestres.map(bimestre => [id_sistema, bimestre.inicio, bimestre.fin, bimestre.consumo]);
                    const queryConsumo = 'INSERT INTO consumos (id_sistema, fecha_inicio, fecha_termino, consumo_energetico) VALUES ?';

                    conexion.query(queryConsumo, [valoresConsumo], (error) => {
                        if (error) {
                            console.error("Error al guardar los consumos:", error);
                            return conexion.rollback(() => res.status(500).json({ success: false, message: 'Error al guardar los consumos.' }));
                            console.log("Datos del consumo.");
                        }

                        const queryInversores = `INSERT INTO inversores (id_sistema, marca_inversor, potencia_nominal_salida, inversores_utilizar) VALUES (?, ?, ?, ?)`;
                        const valoresInversores = [id_sistema, marcaInversor, potenciaInversor, inversoresUtilizar];

                        conexion.query(queryInversores, valoresInversores, (error) => {
                            if (error) {
                                console.error("Error al guardar los inversores:", error);
                                return conexion.rollback(() => res.status(500).json({ success: false, message: 'Error al guardar los inversores.' }));
                            }

                            const queryModulos = `INSERT INTO modulos (id_sistema, marca_modulo, potencia_nominal_salida, modulos_utilizar) VALUES (?, ?, ?, ?)`;
                            const valoresModulos = [id_sistema, marcaModulo, potenciaModulo, modulosUtilizar];

                            conexion.query(queryModulos, valoresModulos, (error) => {
                                if (error) {
                                    console.error("Error al guardar los módulos:", error);
                                    return conexion.rollback(() => res.status(500).json({ success: false, message: 'Error al guardar los módulos.' }));
                                    console.log("Datos del modulo.");
                                }

                                conexion.commit(error => {
                                    if (error) {
                                        console.error("Error al confirmar la transacción:", error);
                                        return conexion.rollback(() => res.status(500).json({ success: false, message: 'Error al confirmar la transacción.' }));
                                        console.log("Datos del commit.");
                                    }
                                    res.json({ success: true, message: 'Sistema fotovoltaico y todos los datos guardados correctamente.' });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

app.get('/obtenerRegistros', (req, res) => {
    const query = `
        SELECT 
            clientes.referencia, 
            clientes.nombre_cliente, 
            sistemas.tipo_sistema
        FROM
            sistemas
        INNER JOIN clientes ON sistemas.id_cliente = clientes.id_cliente
        LIMIT 0, 25
    `;

    conexion.query(query, (error, results) => {
        if (error) {
            console.error('Error en la consulta:', error); // Para depuración
            return res.status(500).json({ success: false, message: 'Error al obtener los registros.' });
        }

        // Si no hay resultados, puedes enviar un mensaje claro
        if (results.length === 0) {
            return res.json({ success: true, message: 'No se encontraron registros.', data: [] });
        }

        // Responder con los resultados
        res.json({ success: true, data: results });
    });
});

// Iniciar servidor
const port = 3000;
app.listen(port, () => {
    console.log(`Servidor iniciado en http://localhost:${port}`);
});