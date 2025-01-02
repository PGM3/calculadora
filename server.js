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


// Ruta para obtener un sistema específico
app.get('/obtenerSistema/:id_cliente', (req, res) => {
    const query = `
    SELECT
        c.referencia,
        c.nombre_cliente,
        c.telefono,
        c.correo,
        s.id_sistema,
        s.tipo_sistema,
        m.modulos_utilizar,
        m.potencia_nominal_salida as potencia_modulo,
        m.marca_modulo,
        i.potencia_nominal_salida as potencia_inversor,
        i.marca_inversor,
        u.direccion,
        u.tipo_propiedad,
        u.id_estado,
        e.irradiacion_solar,
        GROUP_CONCAT(
            JSON_OBJECT(
                'fecha_inicio', DATE_FORMAT(co.fecha_inicio, '%Y-%m-%d'),
                'fecha_termino', DATE_FORMAT(co.fecha_termino, '%Y-%m-%d'),
                'consumo_energetico', co.consumo_energetico,
                'dias_totales', co.dias_totales
            )
        ) as consumos_json
    FROM sistemas s
    JOIN clientes c ON s.id_cliente = c.id_cliente
    JOIN modulos m ON s.id_sistema = m.id_sistema
    JOIN inversores i ON s.id_sistema = i.id_sistema
    JOIN ubicaciones u ON s.id_ubicacion = u.id_ubicacion
    JOIN estados e ON u.id_estado = e.id_estado
    JOIN consumos co ON s.id_sistema = co.id_sistema
    WHERE s.id_cliente = ?
    GROUP BY s.id_sistema`;

    conexion.query(query, [req.params.id_cliente], (error, results) => {
        if (error) {
            console.log('Error:', error);
            return res.status(500).json({ success: false, message: 'Error en consulta' });
        }
        console.log('Datos encontrados:', results[0]);
        res.json({ success: true, data: results[0] });
    });
});

app.put('/actualizarSistemaFotovoltaico', (req, res) => {
    const {
        id,
        referencia,
        cliente,
        telefono,
        correo,
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
        potenciaInversor
    } = req.body;

    conexion.beginTransaction(error => {
        if (error) {
            return res.status(500).json({ success: false, message: 'Error al iniciar la transacción' });
        }

        // Actualizar cliente
        const queryCliente = `
            UPDATE clientes 
            SET referencia = ?, nombre_cliente = ?, telefono = ?, correo = ?
            WHERE id_cliente = ?`;

        conexion.query(queryCliente, [referencia, cliente, telefono, correo, id], (error) => {
            if (error) {
                return conexion.rollback(() => {
                    res.status(500).json({ success: false, message: 'Error al actualizar cliente' });
                });
            }

            // Actualizar ubicación
            const queryUbicacion = `
                UPDATE ubicaciones u
                JOIN sistemas s ON s.id_ubicacion = u.id_ubicacion
                SET u.direccion = ?, u.tipo_propiedad = ?, u.id_estado = ?
                WHERE s.id_cliente = ?`;

            conexion.query(queryUbicacion, [ubicacion, tipoPropiedad, id_estado, id], (error) => {
                if (error) {
                    return conexion.rollback(() => {
                        res.status(500).json({ success: false, message: 'Error al actualizar ubicación' });
                    });
                }

                // Actualizar sistema
                const querySistema = `
                    UPDATE sistemas 
                    SET tipo_sistema = ?, potencia_pico = ?, promedio_diario = ?, 
                        promedio_mensual = ?, promedio_anual = ?
                    WHERE id_cliente = ?`;

                conexion.query(querySistema, [tipoSistema, potenciaPico, promedioDiario, promedioMensual, promedioAnual, id], (error) => {
                    if (error) {
                        return conexion.rollback(() => {
                            res.status(500).json({ success: false, message: 'Error al actualizar sistema' });
                        });
                    }

                    // Actualizar módulos
                    const queryModulos = `
                        UPDATE modulos m
                        JOIN sistemas s ON s.id_sistema = m.id_sistema
                        SET m.marca_modulo = ?, m.potencia_nominal_salida = ?, m.modulos_utilizar = ?
                        WHERE s.id_cliente = ?`;

                    conexion.query(queryModulos, [marcaModulo, potenciaModulo, modulosUtilizar, id], (error) => {
                        if (error) {
                            return conexion.rollback(() => {
                                res.status(500).json({ success: false, message: 'Error al actualizar módulos' });
                            });
                        }

                        // Actualizar inversores
                        const queryInversores = `
                            UPDATE inversores i
                            JOIN sistemas s ON s.id_sistema = i.id_sistema
                            SET i.marca_inversor = ?, i.potencia_nominal_salida = ?
                            WHERE s.id_cliente = ?`;

                        conexion.query(queryInversores, [marcaInversor, potenciaInversor, id], (error) => {
                            if (error) {
                                return conexion.rollback(() => {
                                    res.status(500).json({ success: false, message: 'Error al actualizar inversores' });
                                });
                            }

                            // Actualizar consumos
                            datosBimestres.forEach((bimestre, index) => {
                                const queryUpdateConsumo = `
                                    UPDATE consumos c
                                    JOIN sistemas s ON c.id_sistema = s.id_sistema
                                    SET 
                                        c.fecha_inicio = ?,
                                        c.fecha_termino = ?,
                                        c.consumo_energetico = ?,
                                        c.dias_totales = ?
                                    WHERE s.id_cliente = ? 
                                    AND c.fecha_inicio = ?`;

                                conexion.query(queryUpdateConsumo, [
                                    bimestre.inicio,
                                    bimestre.fin,
                                    bimestre.consumo,
                                    bimestre.totalDias,
                                    id,
                                    bimestre.inicio
                                ], (error) => {
                                    if (error) {
                                        return conexion.rollback(() => {
                                            res.status(500).json({ success: false, message: 'Error al actualizar consumo' });
                                        });
                                    }

                                    if (index === datosBimestres.length - 1) {
                                        conexion.commit(error => {
                                            if (error) {
                                                return conexion.rollback(() => {
                                                    res.status(500).json({ success: false, message: 'Error al confirmar los cambios' });
                                                });
                                            }
                                            res.json({ success: true, message: 'Sistema actualizado exitosamente' });
                                        });
                                    }
                                });
                            });
                        });
                    });
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

//pdf
const PDFDocument = require('pdfkit-table');
const fs = require('fs');
const { createCanvas } = require('canvas');
const Chart = require('chart.js/auto');

// Ruta para generar PDF
app.get('/generarPDF/:id_cliente', async (req, res) => {
    const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 120, bottom: 80, left: 50, right: 50 },
        bufferPages: true
    });

    const agregarSeparadorVisual = (y = null) => {
        const posY = y || doc.y;
        doc.save()
            .moveTo(50, posY)
            .lineTo(545, posY)
            .lineWidth(2)
            .strokeColor('#2c88b0')
            .stroke()
            .moveDown(2);
    };

    const agregarCajaSombreada = (texto, y = null) => {
        const posY = y || doc.y + 5;
        doc.save()
            .rect(40, posY, 515, 35)
            .fillAndStroke('#f0f7fa', '#2c88b0');
        doc.fillColor('#1a5f7a')
            .fontSize(16)
            .text(texto, 0, posY + 10, { align: 'center', width: 595.28 });
        doc.moveDown(1.5);
    };

    const crearEncabezado = () => {
        const logoPath = path.join(__dirname, 'public', 'views', 'Images', 'LogoTSolar.jpg');
        const tSolarPath = path.join(__dirname, 'public', 'views', 'Images', 'TSOLAR.jpeg');

        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 40, { width: 100 });
        }
        if (fs.existsSync(tSolarPath)) {
            doc.image(tSolarPath, 300, 40, { width: 250, height: 60 });
        }
    };

    const agregarPie = () => {
        const totalPages = doc.bufferedPageRange().count;
        const paginasConContenido = doc.bufferedPageRange().start + doc.bufferedPageRange().count;

        for (let i = 0; i < paginasConContenido; i++) {
            doc.switchToPage(i);
            doc.fontSize(9)
                .fillColor('#666666');

            const options = { lineBreak: false };

            doc.text('Tecnología Solar de México S.A. de C.V.', 50, doc.page.height - 70, options);
            doc.text('Tel: (999) 999-9999', 250, doc.page.height - 70, options);
            doc.text('www.tsolarmex.com', 450, doc.page.height - 70, options);
        }
    };

    const generarGraficoConsumo = async (consumos) => {
        const canvas = createCanvas(600, 400);
        const ctx = canvas.getContext('2d');

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: consumos.map(c => c.inicio),
                datasets: [{
                    label: 'Consumo Bimestral (kWh)',
                    data: consumos.map(c => c.consumo),
                    backgroundColor: '#2c88b0',
                    borderColor: '#1a5f7a',
                    borderWidth: 1
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Histórico de Consumo Bimestral',
                        font: { size: 16 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Consumo (kWh)'
                        }
                    }
                }
            }
        });

        return canvas.toBuffer();
    };

    //  res.setHeader('Content-Type', 'application/pdf');
    //  res.setHeader('Content-Disposition', 'attachment; filename=${datos.referencia}_propuesta_Tecnica.pdf');
    //  doc.pipe(res);


    const query = `
        SELECT
            c.*, s.*, u.*,
            m.modulos_utilizar,
        m.potencia_nominal_salida as potencia_modulo,
        m.marca_modulo,
        i.potencia_nominal_salida as potencia_inversor,
        i.marca_inversor,
            e.nombre_estado, e.irradiacion_solar,
            GROUP_CONCAT(
                JSON_OBJECT(
                    'inicio', DATE_FORMAT(co.fecha_inicio, '%d/%m/%Y'),
                    'fin', DATE_FORMAT(co.fecha_termino, '%d/%m/%Y'),
                    'consumo', co.consumo_energetico,
                    'dias', co.dias_totales
                )
                ORDER BY co.fecha_inicio DESC
            ) as consumos_json
        FROM clientes c
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

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${datos.referencia}_propuesta_tecnica.pdf`);
        doc.pipe(res);


        //FECHAS PARA EL PDF
        const obtenerNombreMes = (fecha) => {
            const [dia, mes, año] = fecha.split('/');
            const fechaObj = new Date(año, mes - 1, dia);
            return fechaObj.toLocaleString('es-ES', { month: 'long' });
        }

        // Extraer la primera fecha de inicio (más antigua) y la última fecha de fin (más reciente) 
        let fechaInicio = consumos[0].inicio;
        let fechaFin = consumos[0].fin;

        // Iterar sobre todos los consumos para encontrar las fechas correctas 
        consumos.forEach(consumo => {
            if (new Date(consumo.inicio.split('/').reverse().join('-')) < new Date(fechaInicio.split('/').reverse().join('-'))) {
                fechaInicio = consumo.inicio;
            }
            if (new Date(consumo.fin.split('/').reverse().join('-')) > new Date(fechaFin.split('/').reverse().join('-'))) {
                fechaFin = consumo.fin;
            }
        });


        // Portada
        crearEncabezado();
        doc.rect(0, 130, 595.28, 80).fill('#1a5f7a');
        doc.fontSize(28).fillColor('#ffffff').text('PROPUESTA TÉCNICA', 0, 155, { align: 'center', width: 595.28 });
        doc.fontSize(20).text('SISTEMA FOTOVOLTAICO', 0, 185, { align: 'center', width: 595.28 });

        doc.rect(150, 280, 295.28, 60).fillAndStroke('#2c88b0', '#1a5f7a');
        doc.fontSize(24).fillColor('#ffffff').text(datos.tipo_sistema, 0, 300, { align: 'center', width: 595.28 });

        doc.fontSize(16).fillColor('#1a5f7a').text(`Cliente: ${datos.nombre_cliente}`, 0, 400, { align: 'center', width: 595.28 });
        doc.fontSize(14).text(new Date().toLocaleDateString('es-MX', {
            year: 'numeric', month: 'long', day: 'numeric'
        }), 0, 430, { align: 'center', width: 595.28 });

        // Datos del cliente
        doc.addPage();
        crearEncabezado();
        agregarCajaSombreada('DATOS DEL CLIENTE');

        const datosCliente = [
            ['Referencia:', datos.referencia],
            ['Nombre:', datos.nombre_cliente],
            ['Teléfono:', datos.telefono],
            ['Correo:', datos.correo],
            ['Ubicación:', datos.direccion],
            ['Irradiación Solar:', `${datos.irradiacion_solar} kWh/m²/día`],
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

        // Análisis de consumo
        doc.addPage();
        crearEncabezado();
        agregarCajaSombreada('ANÁLISIS DE CONSUMO');

        doc.fontSize(11).fillColor('#333333')
            .text(`En la siguiente tabla se muestra el consumo de ${datos.nombre_cliente} del último año comprendido en el periodo del día ${fechaInicio.split('/')[0]} del mes  ${obtenerNombreMes(fechaInicio)} del año ${fechaInicio.split('/')[2]} al día ${fechaFin.split('/')[0]} del mes de  ${obtenerNombreMes(fechaFin)} del año ${fechaFin.split('/')[2]}.`, 50, doc.y + 10,
                {
                    align: 'justify',
                    width: 495
                })
            .moveDown();

        // Tabla de consumos bimestrales
        doc.fontSize(14).fillColor('#1a5f7a')
            .text('Histórico de Consumos Bimestrales', { align: 'center' })
            .moveDown();

        const tablaDatos = {
            headers: ['Periodo', 'Inicio', 'Fin', 'Días', 'Consumo (kWh)'],
            rows: consumos.map((c, index) => [
                `Bimestre ${index + 1}`,
                c.inicio,
                c.fin,
                c.dias,
                c.consumo.toLocaleString('es-MX')
            ])
        };

        doc.table(tablaDatos, {
            prepareHeader: () => doc.fontSize(10).fillColor('#1a5f7a'),
            prepareRow: () => doc.fontSize(10).fillColor('#333333'),
            width: 495,
            headerBackground: '#2c88b0',
            columnSpacing: 10,
            padding: 5,
            align: ['left', 'center', 'center', 'center', 'right']
        });

        doc.moveDown();
        agregarSeparadorVisual();

        //Datos de promedio de consumo
        const datosConsumo = [
            ['Promedio Diario:', `${datos.promedio_diario} kWh`],
            ['Promedio Mensual:', `${datos.promedio_mensual} kWh`],
            ['Consumo Anual:', `${datos.promedio_anual} kWh`],
        ];

        doc.fontSize(14).fillColor('#1a5f7a')
            .text('Promedios de Consumo Energético', { align: 'center' });

        doc.fontSize(11).fillColor('#333333')
            .text(`Se muestran los promedios de consumo diario y mensual de energía eléctrica del cliente, también se muestra el consumo anual del cliente.`, 50, doc.y + 10,
                { align: 'justify', width: 495 })
            .moveDown();

        datosConsumo.forEach(([label, value]) => {
            doc.fontSize(11)
                .fillColor('#2c88b0')
                .text(label, 50, null, { continued: true })
                .fillColor('#333333')
                .text(`  ${value}`)
                .moveDown();
        });
        doc.moveDown();

        agregarSeparadorVisual();

        // Verificar espacio para el gráfico
        if (doc.y + 400 > doc.page.height - 100) {
            doc.addPage();
            crearEncabezado();
        }

        // Gráfico de consumo
        doc.fontSize(14).fillColor('#1a5f7a')
            .text('Gráfico de Consumo Bimestral', { align: 'center' })
            .moveDown()
            .fontSize(11).fillColor('#333333')
            .text('Este gráfico representa la tendencia del consumo eléctrico en los últimos bimestres, permitiendo visualizar los patrones de consumo y picos de demanda:', {
                align: 'justify',
                width: 495
            })
            .moveDown();

        const graficoBuffer = await generarGraficoConsumo(consumos);
        doc.image(graficoBuffer, 50, doc.y, {
            width: 500,
            height: 300
        });

        // Especificaciones técnicas
        doc.addPage();
        crearEncabezado();
        agregarCajaSombreada('ESPECIFICACIONES TÉCNICAS');

        doc.fontSize(11).fillColor('#333333')
            .text('Las siguientes especificaciones técnicas han sido cuidadosamente seleccionadas para garantizar el mejor rendimiento y eficiencia de su sistema fotovoltaico:', 50, doc.y + 10, {
                align: 'justify',
                width: 495
            })
            .moveDown();

        const datosTecnicos = [
            ['Tipo de Sistema:', datos.tipo_sistema],
            ['Potencia Pico:', `${datos.potencia_pico} kWp`],
            ['Marca de Módulos:', datos.marca_modulo],
            ['Potencia de Módulos:', `${datos.potencia_modulo} W`],
            ['Cantidad de Módulos:', datos.modulos_utilizar],
            ['Marca de Inversor:', datos.marca_inversor],
            ['Potencia de Inversor:', `${datos.potencia_inversor} W`]
        ];


        datosTecnicos.forEach(([label, value]) => {
            doc.fontSize(12)
                .fillColor('#2c88b0')
                .text(label, 50, null, { continued: true })
                .fillColor('#333333')
                .text(`  ${value}`)
                .moveDown();
        });

        // Después de los datos técnicos y antes del pie de página
        doc.addPage();
        crearEncabezado();
        agregarCajaSombreada('DESCRIPCIÓN TÉCNICA DEL SISTEMA PROPUESTO');

        doc.fontSize(11).fillColor('#333333')
            .text(`El sistema fotovoltaico propuesto interconectado a la red eléctrica tiene una capacidad de ${datos.potencia_pico} kWp y se estima que tendrá una generación cuatrimestral aproximadamente de ${datos.promedio_anual / 3} kwh.`, 50, doc.y + 10, {
                align: 'justify',
                width: 495
            })
            .moveDown();

        doc.text(`El sistema consiste en un arreglo serie de ${datos.modulos_utilizar} módulos fotovoltaicos de ${datos.potencia_modulo} Wh ${datos.marca_modulo}, cuya generación eléctrica será inyectada a la red mediante un inversor CD/CA de ${datos.potencia_inversor} kwp el cual cumple con las normas de CFE.`, 50, doc.y + 10, {
            align: 'justify',
            width: 495
        })
            .moveDown();

        doc.text('El inversor convierte de manera instantánea y continua la energía de corriente directa proveniente de los módulos fotovoltaicos a voltaje de corriente alterna compatible con la red eléctrica, realizando la sincronización y proporcionando las protecciones correspondientes.', {
            align: 'justify',
            width: 495
        });


        agregarPie();
        doc.end();
    });
});

//para el traductor de google
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; style-src 'self' 'unsafe-inline' https://www.gstatic.com;"
    );
    next();
});


// Iniciar el servidor
const port = 3000;
app.listen(port, () => {
    console.log(`Servidor iniciado en http://localhost:${port}`);
});