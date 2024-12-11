const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));
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
    ORDER BY clientes.id_cliente DESC
    LIMIT 25
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

//DATOS PARA EDICION
app.get('/obtenerDatosCompletos/:id_cliente', (req, res) => {
    const id_cliente = req.params.id_cliente;

    // Query para obtener todos los datos
    const queries = {
        cliente: 'SELECT * FROM clientes WHERE id_cliente = ?',
        sistema: `
            SELECT s.*, u.*, m.*, i.*
            FROM sistemas s
            JOIN ubicaciones u ON s.id_ubicacion = u.id_ubicacion
            JOIN modulos m ON s.id_sistema = m.id_sistema
            JOIN inversores i ON s.id_sistema = i.id_sistema
            WHERE s.id_cliente = ?
        `,
        bimestres: 'SELECT * FROM consumos WHERE id_sistema = (SELECT id_sistema FROM sistemas WHERE id_cliente = ?)'
    };

    // Ejecutar queries
    conexion.query(queries.cliente, [id_cliente], (error, clienteResults) => {
        if (error) return res.status(500).json({ success: false, message: 'Error al obtener datos del cliente' });

        conexion.query(queries.sistema, [id_cliente], (error, sistemaResults) => {
            if (error) return res.status(500).json({ success: false, message: 'Error al obtener datos del sistema' });

            conexion.query(queries.bimestres, [id_cliente], (error, bimestresResults) => {
                if (error) return res.status(500).json({ success: false, message: 'Error al obtener datos de consumos' });

                res.json({
                    success: true,
                    cliente: clienteResults[0],
                    sistema: sistemaResults[0],
                    bimestres: bimestresResults
                });
            });
        });
    });
});


//eliminar registro
app.delete('/eliminarRegistro/:id_cliente', (req, res) => {
    const id_cliente = req.params.id_cliente;
    
    const query = `
        DELETE c, s, u, m, i, co
        FROM clientes c
        LEFT JOIN sistemas s ON c.id_cliente = s.id_cliente
        LEFT JOIN ubicaciones u ON s.id_ubicacion = u.id_ubicacion
        LEFT JOIN modulos m ON s.id_sistema = m.id_sistema
        LEFT JOIN inversores i ON s.id_sistema = i.id_sistema
        LEFT JOIN consumos co ON s.id_sistema = co.id_sistema
        WHERE c.id_cliente = ?
    `;

    conexion.query(query, [id_cliente], (error, results) => {
        if (error) {
            console.error('Error al eliminar:', error);
            return res.status(500).json({ success: false, message: 'Error al eliminar el registro' });
        }
        res.json({ success: true, message: 'Registro eliminado correctamente' });
    });
});


//PDF
const PDFDocument = require('pdfkit');
const fs = require('fs');

app.get('/generarPDF/:id_cliente', (req, res) => {
    const id_cliente = req.params.id_cliente;
    const doc = new PDFDocument({margin: 50});

    // Configuración del documento
    doc.pipe(res);
    
    // Encabezado con logo
    doc.image('public/Images/LogoTSolar.jpg', 50, 45, {width: 100})
       .fontSize(20)
       .text('Propuesta Técnica Económica', 200, 45)
       .moveDown();

    // Consulta a la base de datos
    const query = `
        SELECT c.*, s.*, u.*, m.*, i.*
        FROM clientes c
        JOIN sistemas s ON c.id_cliente = s.id_cliente
        JOIN ubicaciones u ON s.id_ubicacion = u.id_ubicacion
        JOIN modulos m ON s.id_sistema = m.id_sistema
        JOIN inversores i ON s.id_sistema = i.id_sistema
        WHERE c.id_cliente = ?
    `;

    conexion.query(query, [id_cliente], (error, results) => {
        if (error) {
            res.status(500).send('Error al generar PDF');
            return;
        }

        const datos = results[0];

        // Información del cliente
        doc.fontSize(12)
           .text(`Cliente: ${datos.nombre_cliente}`)
           .text(`Referencia: ${datos.referencia}`)
           .text(`Ubicación: ${datos.direccion}`)
           .moveDown();

        // Detalles del sistema
        doc.fontSize(14)
           .text('Especificaciones del Sistema', {underline: true})
           .fontSize(12)
           .text(`Tipo de Sistema: ${datos.tipo_sistema}`)
           .text(`Potencia Pico: ${datos.potencia_pico} kWp`)
           .text(`Módulos: ${datos.modulos_utilizar} x ${datos.potencia_nominal_salida}W ${datos.marca_modulo}`)
           .text(`Inversor: ${datos.marca_inversor} ${datos.potencia_inversor}W`)
           .moveDown();

        // Finalizar PDF
        doc.end();
    });
});

const port = 3000;
app.listen(port, () => {
    console.log(`Servidor iniciado en http://localhost:${port}`);
});