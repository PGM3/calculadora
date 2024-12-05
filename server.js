const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const conexion = require('./public/views/src/controllers/conexion.js');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/guardarSistemaFotovoltaico', (req, res) => {
    console.log("Datos recibidos:", req.body);

    const {
        referencia,
        cliente,
        tipoSistema,
        datosBimestres,
        totalDias,
        ubicacion,
        tipoPropiedad,
        id_estado,
        potenciaPico,
        promedioDiario,
        promedioMensual,
        promedioAnual,
        marcaModulo,
        potenciaModulo,
        modulosUtilizar,
        marcaInversor,
        potenciaInversor,
        telefono,
        correo
    } = req.body;

    conexion.beginTransaction(error => {
        if (error) {
            console.error("Error al iniciar la transacción:", error);
            return res.status(500).json({ success: false, message: 'Error al iniciar la transacción.' });
        }

        const queryCliente = `INSERT INTO clientes (referencia, nombre_cliente, telefono, correo) VALUES (?, ?, ?, ?)`;
        const valoresCliente = [referencia, cliente, telefono, correo];

        conexion.query(queryCliente, valoresCliente, (error, results) => {
            if (error) {
                console.error("Error al guardar los datos del cliente:", error);
                return conexion.rollback(() => res.status(500).json({ success: false, message: 'Error al guardar los datos del cliente.' }));
            }

            const id_cliente = results.insertId;

            const queryUbicacion = `INSERT INTO ubicaciones (direccion, tipo_propiedad, id_estado) VALUES (?, ?, ?)`;
            const valoresUbicacion = [ubicacion, tipoPropiedad, id_estado];

            conexion.query(queryUbicacion, valoresUbicacion, (error, results) => {
                if (error) {
                    console.error("Error al guardar la ubicación:", error);
                    return conexion.rollback(() => res.status(500).json({ success: false, message: 'Error al guardar la ubicación.' }));
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
                    }

                    const id_sistema = results.insertId;

                    const valoresConsumo = datosBimestres.map(bimestre => [id_sistema, bimestre.inicio, bimestre.fin, bimestre.consumo, bimestre.totalDias]);
                    const queryConsumo = 'INSERT INTO consumos (id_sistema, fecha_inicio, fecha_termino, consumo_energetico, dias_totales) VALUES ?';

                    conexion.query(queryConsumo, [valoresConsumo], (error) => {
                        if (error) {
                            console.error("Error al guardar los consumos:", error);
                            return conexion.rollback(() => res.status(500).json({ success: false, message: 'Error al guardar los consumos.' }));
                        }

                        const queryInversores = `INSERT INTO inversores (id_sistema, marca_inversor, potencia_nominal_salida) VALUES (?, ?, ?)`;
                        const valoresInversores = [id_sistema, marcaInversor, potenciaInversor];

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
                                }

                                conexion.commit(error => {
                                    if (error) {
                                        console.error("Error al confirmar la transacción:", error);
                                        return conexion.rollback(() => res.status(500).json({ success: false, message: 'Error al confirmar la transacción.' }));
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


//TABLA DE REGISTROS
app.get('/obtenerRegistros', (req, res) => {
    const query = `
        SELECT 
            clientes.id_cliente, 
            clientes.referencia, 
            clientes.nombre_cliente, 
            sistemas.tipo_sistema
        FROM sistemas
        INNER JOIN clientes ON sistemas.id_cliente = clientes.id_cliente
        LIMIT 0, 25
    `;

    conexion.query(query, (error, results) => {
        if (error) {
            console.error('Error en la consulta:', error);
            return res.status(500).json({ success: false, message: 'Error al obtener los registros.' });
        }
        if (results.length === 0) {
            return res.json({ success: true, message: 'No se encontraron registros.', data: [] });
        }
        res.json({ success: true, data: results });
    });
});

app.get('/obtenerEstados', (req, res) => {
    const query = `
        SELECT id_estado, nombre_estado, irradiacion_solar
        FROM estados
        ORDER BY nombre_estado;
    `;

    conexion.query(query, (error, results) => {
        if (error) {
            console.error('Error al obtener los estados:', error);
            return res.status(500).json({ success: false, message: 'Error al obtener los estados.' });
        }
        res.json({ success: true, data: results });
    });
});

//BOTON DE REGISTRAR
app.get('/obtenerRegistro/:id', (req, res) => {
    const id_cliente = req.params.id;
    
    // Primero obtenemos los datos principales
    const queryPrincipal = `
        SELECT 
            c.id_cliente,
            c.referencia,
            c.nombre_cliente,
            s.tipo_sistema,
            u.direccion as ubicacion,
            u.tipo_propiedad,
            u.id_estado,
            e.irradiacion_solar
        FROM clientes c
        JOIN sistemas s ON c.id_cliente = s.id_cliente
        JOIN ubicaciones u ON s.id_ubicacion = u.id_ubicacion
        JOIN estados e ON u.id_estado = e.id_estado
        WHERE c.id_cliente = ?
    `;

    // Consulta para obtener los consumos
    const queryConsumos = `
        SELECT 
            c.fecha_inicio,
            c.fecha_termino,
            c.consumo_energetico as consumo
        FROM consumos c
        JOIN sistemas s ON c.id_sistema = s.id_sistema
        WHERE s.id_cliente = ?
        ORDER BY c.id_consumo
    `;

    conexion.query(queryPrincipal, [id_cliente], (error, resultadosPrincipales) => {
        if (error) {
            return res.json({ success: false, message: 'Error al obtener datos principales' });
        }

        conexion.query(queryConsumos, [id_cliente], (error, resultadosConsumos) => {
            if (error) {
                return res.json({ success: false, message: 'Error al obtener consumos' });
            }

            const datos = {
                ...resultadosPrincipales[0],
                consumos: resultadosConsumos
            };

            res.json({ success: true, data: datos });
        });
    });
});

//ruta de actualización
app.put('/actualizarRegistro/:id', (req, res) => {
    const id_cliente = req.params.id;
    const datos = req.body;

    conexion.beginTransaction(error => {
        if (error) {
            return res.json({ success: false, message: 'Error al iniciar la transacción' });
        }

        // Actualizar ubicación
        const queryUbicacion = `
            UPDATE ubicaciones u
            JOIN sistemas s ON u.id_ubicacion = s.id_ubicacion
            SET 
                u.direccion = ?,
                u.tipo_propiedad = ?,
                u.id_estado = ?
            WHERE s.id_cliente = ?
        `;

        conexion.query(queryUbicacion, 
            [datos.ubicacion, datos.tipoPropiedad, datos.idEstado, id_cliente], 
            (error) => {
                if (error) {
                    return conexion.rollback(() => {
                        res.json({ success: false, message: 'Error al actualizar ubicación' });
                    });
                }

                // Actualizar consumos
                datos.consumos.forEach((consumo, index) => {
                    const queryConsumo = `
                        UPDATE consumos c
                        JOIN sistemas s ON c.id_sistema = s.id_sistema
                        SET 
                            c.fecha_inicio = ?,
                            c.fecha_termino = ?,
                            c.consumo_energetico = ?
                        WHERE s.id_cliente = ? AND c.id_consumo = ?
                    `;

                    conexion.query(queryConsumo, 
                        [consumo.fechaInicio, consumo.fechaFin, consumo.consumo, id_cliente, index + 1],
                        (error) => {
                            if (error) {
                                return conexion.rollback(() => {
                                    res.json({ success: false, message: 'Error al actualizar consumos' });
                                });
                            }
                        });
                });

                conexion.commit(error => {
                    if (error) {
                        return conexion.rollback(() => {
                            res.json({ success: false, message: 'Error al confirmar la transacción' });
                        });
                    }
                    res.json({ success: true, message: 'Registro actualizado correctamente' });
                });
            });
    });
});


const port = 3000;
app.listen(port, () => {
    console.log(`Servidor iniciado en http://localhost:${port}`);
});