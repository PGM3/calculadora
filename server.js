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

//GENERAR PDF
const PDFDocument = require('pdfkit-table');
const fs = require('fs');

const configurarEstilosBase = (doc) => {
    doc.font('Helvetica');
    doc.fontSize(12);
    doc.fillColor('#333333');
};

const crearHeaderMejorado = (doc) => {
    const logoPath = path.join(__dirname, 'public', 'views', 'Images', 'LogoTSolar.jpg');
    const tSolarPath = path.join(__dirname, 'public', 'views', 'Images', 'TSOLAR.jpeg');

    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 40, { width: 100 });
    }

    doc.font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#666666')
        .text('Tecnología Solar de México S.A. de C.V.', 180, 45)
        .fontSize(9)
        .text('Tel: (999) 999-9999', 180, 60)
        .text('www.tsolarmex.com', 180, 75);

    if (fs.existsSync(tSolarPath)) {
        doc.image(tSolarPath, 400, 40, { width: 150, height: 60 });
    }
};

const agregarPiePaginaMejorado = (doc) => {
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);

        doc.moveTo(50, doc.page.height - 60)
            .lineTo(545, doc.page.height - 60)
            .lineWidth(0.5)
            .strokeColor('#2c88b0')
            .stroke();

        doc.fontSize(8)
            .fillColor('#666666')
            .text('DOCUMENTO CONFIDENCIAL',
                50,
                doc.page.height - 50,
                { align: 'left', width: 200 })
            .text('Tecnología Solar de México S.A. de C.V. | RFC: TSM123456789',
                { align: 'center', width: 495 })
            .text(`Página ${i + 1} de ${totalPages}`,
                { align: 'right', width: 495 });
    }
};

app.get('/generarPDF/:id_cliente', (req, res) => {
    const doc = new PDFDocument({
        size: 'A4',
        margins: {
            top: 120,
            bottom: 80,
            left: 50,
            right: 50
        },
        bufferPages: true
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=propuesta_tecnica.pdf');
    doc.pipe(res);

    const query = `
        SELECT 
            c.*,
            s.*,
            u.*,
            m.*,
            i.*,
            e.nombre_estado,
            e.irradiacion_solar,
            GROUP_CONCAT(
                JSON_OBJECT(
                    'bimestre', (@row_number:=@row_number + 1),
                    'inicio', DATE_FORMAT(co.fecha_inicio, '%d/%m/%Y'),
                    'fin', DATE_FORMAT(co.fecha_termino, '%d/%m/%Y'),
                    'consumo', co.consumo_energetico,
                    'dias', co.dias_totales
                )
                ORDER BY co.fecha_inicio
            ) as consumos_json
        FROM (SELECT @row_number:=0) r, clientes c
        JOIN sistemas s ON c.id_cliente = s.id_cliente
        JOIN ubicaciones u ON s.id_ubicacion = u.id_ubicacion
        JOIN modulos m ON s.id_sistema = m.id_sistema
        JOIN inversores i ON s.id_sistema = i.id_sistema
        JOIN estados e ON u.id_estado = e.id_estado
        JOIN consumos co ON s.id_sistema = co.id_sistema
        WHERE c.id_cliente = ?
        GROUP BY c.id_cliente`;

    conexion.query(query, [req.params.id_cliente], async (error, results) => {
        if (error) {
            console.error('Error en la consulta:', error);
            return res.status(500).send('Error al generar PDF');
        }

        const datos = results[0];
        const consumos = JSON.parse(`[${datos.consumos_json}]`);

        try {
            // PORTADA
            crearHeaderMejorado(doc);
            doc.rect(0, 130, 595.28, 80)
                .fill('#1a5f7a');

            doc.fontSize(28)
                .fillColor('#ffffff')
                .text('PROPUESTA TÉCNICA', 0, 155, {
                    align: 'center',
                    width: 595.28
                });

            doc.fontSize(20)
                .text('SISTEMA FOTOVOLTAICO', 0, 185, {
                    align: 'center',
                    width: 595.28
                });

            doc.rect(150, 280, 295.28, 60)
                .fillAndStroke('#2c88b0', '#1a5f7a');

            doc.fontSize(24)
                .fillColor('#ffffff')
                .text(datos.tipo_sistema, 0, 300, {
                    align: 'center',
                    width: 595.28
                });

            doc.fontSize(16)
                .fillColor('#1a5f7a')
                .text(`Cliente: ${datos.nombre_cliente}`, 0, 400, {
                    align: 'center',
                    width: 595.28
                });

            const fechaFormateada = new Date().toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            doc.fontSize(14)
                .text(fechaFormateada, 0, 430, {
                    align: 'center',
                    width: 595.28
                });

            doc.rect(150, 500, 295.28, 2)
                .fill('#2c88b0');

            // 1. DATOS DEL CLIENTE
            doc.addPage();
            crearHeaderMejorado(doc);
            doc.fontSize(16)
                .fillColor('#1a5f7a')
                .text('1. DATOS DEL CLIENTE', 50, 150)
                .moveDown();

            const datosCliente = [
                ['Referencia:', datos.referencia],
                ['Nombre:', datos.nombre_cliente],
                ['Teléfono:', datos.telefono],
                ['Correo:', datos.correo],
                ['Dirección:', datos.direccion],
                ['Estado:', datos.nombre_estado],
                ['Tipo de Propiedad:', datos.tipo_propiedad]
            ];

            datosCliente.forEach(([label, value]) => {
                doc.fontSize(12)
                    .fillColor('#2c88b0')
                    .text(label, 50, null, { continued: true })
                    .fillColor('#333333')
                    .text(`  ${value}`)
                    .moveDown();
            });

            // 2. ANÁLISIS DE CONSUMO
            doc.addPage();
            crearHeaderMejorado(doc);
            doc.fontSize(16)
                .fillColor('#1a5f7a')
                .text('2. ANÁLISIS DE CONSUMO', 50, 150)
                .moveDown();

            const promedios = [
                ['Promedio Diario:', `${parseFloat(datos.promedio_diario).toFixed(2)} kWh`],
                ['Promedio Mensual:', `${parseFloat(datos.promedio_mensual).toFixed(2)} kWh`],
                ['Promedio Anual:', `${parseFloat(datos.promedio_anual).toFixed(2)} kWh`]
            ];

            promedios.forEach(([label, value]) => {
                doc.fontSize(12)
                    .fillColor('#2c88b0')
                    .text(label, 50, null, { continued: true })
                    .fillColor('#333333')
                    .text(`  ${value}`)
                    .moveDown();
            });

            doc.moveDown();
            doc.fontSize(14)
                .fillColor('#1a5f7a')
                .text('Histórico de Consumos Bimestrales')
                .moveDown();

            const tableData = {
                headers: ['Bimestre', 'Periodo', 'Días', 'Consumo (kWh)'],
                rows: consumos.map((c, i) => [
                    `Bimestre ${i + 1}`,
                    `${c.inicio} - ${c.fin}`,
                    c.dias,
                    c.consumo
                ])
            };

            await doc.table(tableData, {
                prepareHeader: () => doc.font('Helvetica-Bold').fontSize(12),
                prepareRow: () => doc.font('Helvetica').fontSize(11),
                width: 495,
                padding: 5,
                align: 'center'
            });

            // 3. ESPECIFICACIONES TÉCNICAS
            doc.addPage();
            crearHeaderMejorado(doc);
            doc.fontSize(16)
                .fillColor('#1a5f7a')
                .text('3. ESPECIFICACIONES TÉCNICAS', 50, 150)
                .moveDown();

            const datosTecnicos = [
                ['Tipo de Sistema:', datos.tipo_sistema],
                ['Potencia Pico:', `${parseFloat(datos.potencia_pico).toFixed(2)} kWp`],
                ['Irradiación Solar:', `${datos.irradiacion_solar} kWh/m²/día`],
                ['Marca de Módulos:', datos.marca_modulo],
                ['Potencia de Módulos:', `${parseFloat(datos.potencia_nominal_salida)} W`],
                ['Cantidad de Módulos:', datos.modulos_utilizar],
                ['Marca de Inversor:', datos.marca_inversor],
                ['Potencia de Inversor:', `${parseFloat(datos.potencia_nominal_salida)} W`]
            ];

            datosTecnicos.forEach(([label, value]) => {
                doc.fontSize(12)
                    .fillColor('#2c88b0')
                    .text(label, 50, null, { continued: true })
                    .fillColor('#333333')
                    .text(`  ${value}`)
                    .moveDown();
            });

            agregarPiePaginaMejorado(doc);
            doc.end();

        } catch (err) {
            console.error('Error al generar el PDF:', err);
            res.status(500).send('Error al generar el PDF');
        }
    });
});


const port = 3000;
app.listen(port, () => {
    console.log(`Servidor iniciado en http://localhost:${port}`);
});