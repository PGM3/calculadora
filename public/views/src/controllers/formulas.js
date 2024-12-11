document.addEventListener('DOMContentLoaded', () => {
    const continuarBtn = document.querySelector('.continuar');
    if (continuarBtn) {
        continuarBtn.addEventListener('click', function () {
            if (validarDatosConsumo() && validarDatosUbicacion()) {
                const bimestres = [
                    { inicio: document.getElementById('iniPrimero').value, fin: document.getElementById('finPrimero').value, consumo: parseFloat(document.getElementById('cprimero').value) || 0, totalDias: 0 },
                    { inicio: document.getElementById('iniSegundo').value, fin: document.getElementById('finSegundo').value, consumo: parseFloat(document.getElementById('cSegundo').value) || 0, totalDias: 0 },
                    { inicio: document.getElementById('iniTercero').value, fin: document.getElementById('finTercero').value, consumo: parseFloat(document.getElementById('cTercero').value) || 0, totalDias: 0 },
                    { inicio: document.getElementById('iniCuarto').value, fin: document.getElementById('finCuarto').value, consumo: parseFloat(document.getElementById('cCuarto').value) || 0, totalDias: 0 },
                    { inicio: document.getElementById('iniQuinto').value, fin: document.getElementById('finQuinto').value, consumo: parseFloat(document.getElementById('cQuinto').value) || 0, totalDias: 0 },
                    { inicio: document.getElementById('iniSexto').value, fin: document.getElementById('finSexto').value, consumo: parseFloat(document.getElementById('cSexto').value) || 0, totalDias: 0 }
                ];

                let totalConsumo = 0, totalDias = 0, totalBimestres = 0;
                bimestres.forEach(bimestre => {
                    if (bimestre.inicio && bimestre.fin) {
                        const inicioDate = new Date(bimestre.inicio);
                        const finDate = new Date(bimestre.fin);
                        if (finDate >= inicioDate) {
                            bimestre.totalDias = Math.ceil((finDate - inicioDate) / (1000 * 60 * 60 * 24));
                            totalDias += bimestre.totalDias;
                            totalConsumo += bimestre.consumo;
                            totalBimestres++;
                        }
                    }
                });

                const promedioDiario = totalDias > 0 ? totalConsumo / totalDias : 0;
                const promedioMensual = totalBimestres > 0 ? totalConsumo / (totalBimestres * 2) : 0;
                const promedioAnual = totalBimestres > 0 ? totalConsumo / (totalBimestres / 6) : 0;
                const irradiacionSolar = parseFloat(localStorage.getItem('irradiacionSolar')) || 0;
                const eficienciaSistema = 0.76;
                const potenciaPico = promedioDiario / (irradiacionSolar * eficienciaSistema);

                localStorage.setItem('datosBimestres', JSON.stringify(bimestres));
                localStorage.setItem('totalDias', totalDias);
                localStorage.setItem('promedioDiario', promedioDiario);
                localStorage.setItem('promedioMensual', promedioMensual);
                localStorage.setItem('promedioAnual', promedioAnual);
                localStorage.setItem('potenciaPico', potenciaPico);

                window.location.href = '/views/resultadosSistema.html';
            }
        });
    } else {
        // Variables para la página de resultados
        const potenciaPicoInput = document.getElementById('potencia-pico');
        const potenciaModuloInput = document.getElementById('potencia-modulo');
        const potenciaInversorInput = document.getElementById('potencia-inversor');
        const modulosUtilizarInput = document.getElementById('modulos-utilizar');
        const marcaModuloInput = document.getElementById('marca-modulo');
        const marcaInversorInput = document.getElementById('marca-inversor');

        // Cargar valores iniciales
        if (potenciaPicoInput) {
            potenciaPicoInput.value = (parseFloat(localStorage.getItem('potenciaPico')) || 0).toFixed(3);
        }

        const promedioDiarioInput = document.getElementById('promedio-diario');
        if (promedioDiarioInput) {
            promedioDiarioInput.value = (parseFloat(localStorage.getItem('promedioDiario')) || 0).toFixed(3);
        }

        const promedioMensualInput = document.getElementById('promedio-mensual');
        if (promedioMensualInput) {
            promedioMensualInput.value = (parseFloat(localStorage.getItem('promedioMensual')) || 0).toFixed(3);
        }

        const promedioAnualInput = document.getElementById('promedio-anual');
        if (promedioAnualInput) {
            promedioAnualInput.value = (parseFloat(localStorage.getItem('promedioAnual')) || 0).toFixed(3);
        }

        function calcularComponentes(potenciaPico, potenciaModulo) {
            if (!potenciaPico || !potenciaModulo) {
                return { numeroModulos: 0, potenciaInversorRequerida: 0 };
            }
            // Cálculo de módulos
            const numeroModulos = Math.ceil((potenciaPico * 1000) / potenciaModulo);            // Cálculo de potencia del inversor
            const potenciaInversorRequerida = numeroModulos * potenciaModulo;

            console.log('Cálculos:', {
                potenciaPico,
                potenciaModulo,
                numeroModulos,
                potenciaInversorRequerida
            });

            return { numeroModulos, potenciaInversorRequerida };
        }

        function actualizarComponentes() {
            const potenciaModulo = parseFloat(potenciaModuloInput.value) || 0;
            const potenciaPicoVal = parseFloat(potenciaPicoInput.value) || 0;

            const resultado = calcularComponentes(potenciaPicoVal, potenciaModulo);

            if (modulosUtilizarInput) modulosUtilizarInput.value = resultado.numeroModulos;
            if (potenciaInversorInput) potenciaInversorInput.value = resultado.potenciaInversorRequerida;

            // Guardar en localStorage
            localStorage.setItem('modulosUtilizar', resultado.numeroModulos);
            localStorage.setItem('potenciaInversor', resultado.potenciaInversorRequerida);
        }


        // Event listeners
        if (marcaModuloInput) {
            marcaModuloInput.addEventListener('input', function () {
                localStorage.setItem('marcaModulo', this.value);
            });
        }

        if (potenciaModuloInput) {
            potenciaModuloInput.addEventListener('input', function () {
                localStorage.setItem('potenciaModulo', this.value);
                actualizarComponentes();
            });
        }

        if (marcaInversorInput) {
            marcaInversorInput.addEventListener('input', function () {
                localStorage.setItem('marcaInversor', this.value);
            });
        }

        // Realizar cálculo inicial si estamos en la página de resultados
        if (potenciaModuloInput) {
            actualizarComponentes();
        }
    }

    // Configuración del botón Guardar
    const guardarBtn = document.querySelector('.guardar');
    if (guardarBtn) {
        guardarBtn.addEventListener('click', guardarDatos);
    }
});

function obtenerDatosParaInsertar() {
    const tipoSistema = localStorage.getItem('tipoSistema');
    const datosBimestres = JSON.parse(localStorage.getItem('datosBimestres'));
    const totalDias = parseInt(localStorage.getItem('totalDias')) || 0;
    const ubicacion = localStorage.getItem('ubicacion') || '';
    const tipoPropiedad = localStorage.getItem('tipoPropiedad') || '';
    const id_estado = parseInt(localStorage.getItem('estadoSeleccionado'));
    const potenciaPico = parseFloat(localStorage.getItem('potenciaPico')) || 0;
    const promedioDiario = parseFloat(localStorage.getItem('promedioDiario')) || 0;
    const promedioMensual = parseFloat(localStorage.getItem('promedioMensual')) || 0;
    const promedioAnual = parseFloat(localStorage.getItem('promedioAnual')) || 0;
    const marcaModulo = localStorage.getItem('marcaModulo') || '';
    const potenciaModulo = parseFloat(localStorage.getItem('potenciaModulo')) || 0;
    const modulosUtilizar = parseInt(localStorage.getItem('modulosUtilizar')) || 0;
    const marcaInversor = localStorage.getItem('marcaInversor') || '';
    const potenciaInversor = parseFloat(localStorage.getItem('potenciaInversor')) || 0;

    return {
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
    };
}

async function solicitarDatosCliente() {
    const { value: formValues } = await Swal.fire({
        title: "Ingrese los datos del cliente",
        html: `
            <input id="swal-input-referencia" class="swal2-input" placeholder="Referencia">
            <input id="swal-input-nombre" class="swal2-input" placeholder="Nombre del Cliente">
            <input id="swal-input-telefono" class="swal2-input" placeholder="Teléfono">
            <input id="swal-input-correo" class="swal2-input" placeholder="Correo">
        `,
        focusConfirm: false,
        preConfirm: () => {
            return {
                referencia: document.getElementById("swal-input-referencia").value,
                cliente: document.getElementById("swal-input-nombre").value,
                telefono: document.getElementById("swal-input-telefono").value,
                correo: document.getElementById("swal-input-correo").value
            };
        }
    });

    if (formValues) {
        return formValues;
    } else {
        Swal.fire("Error", "Debe completar los datos del cliente", "error");
        return null;
    }
}

async function guardarDatos() {
    const datosCliente = await solicitarDatosCliente();
    if (!datosCliente) return;

    const datosParaInsertar = {
        ...obtenerDatosParaInsertar(),
        ...datosCliente
    };

    fetch('/guardarSistemaFotovoltaico', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosParaInsertar)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                Swal.fire('¡Éxito!', 'Los datos han sido guardados exitosamente.', 'success');
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        });
}


//EDITAR REGISTROS
