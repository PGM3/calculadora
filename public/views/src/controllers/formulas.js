document.addEventListener('DOMContentLoaded', () => {
    // Botón Continuar para realizar cálculos en la interfaz principal
    const continuarBtn = document.querySelector('.continuar');
    if (continuarBtn) {
        continuarBtn.addEventListener('click', function () {
            // Validar datos antes de realizar cálculos
            if (validarDatosConsumo() && validarDatosUbicacion()) {
                const bimestres = [
                    { inicio: document.getElementById('iniPrimero').value, fin: document.getElementById('finPrimero').value, consumo: parseFloat(document.getElementById('cprimero').value) || 0 },
                    { inicio: document.getElementById('iniSegundo').value, fin: document.getElementById('finSegundo').value, consumo: parseFloat(document.getElementById('cSegundo').value) || 0 },
                    { inicio: document.getElementById('iniTercero').value, fin: document.getElementById('finTercero').value, consumo: parseFloat(document.getElementById('cTercero').value) || 0 },
                    { inicio: document.getElementById('iniCuarto').value, fin: document.getElementById('finCuarto').value, consumo: parseFloat(document.getElementById('cCuarto').value) || 0 },
                    { inicio: document.getElementById('iniQuinto').value, fin: document.getElementById('finQuinto').value, consumo: parseFloat(document.getElementById('cQuinto').value) || 0 },
                    { inicio: document.getElementById('iniSexto').value, fin: document.getElementById('finSexto').value, consumo: parseFloat(document.getElementById('cSexto').value) || 0 }
                ];

                let totalConsumo = 0, totalDias = 0, totalBimestres = 0;
                bimestres.forEach(bimestre => {
                    if (bimestre.inicio && bimestre.fin) {
                        const inicioDate = new Date(bimestre.inicio);
                        const finDate = new Date(bimestre.fin);
                        if (finDate >= inicioDate) {
                            const dias = Math.ceil((finDate - inicioDate) / (1000 * 60 * 60 * 24)) + 1;
                            totalDias += dias;
                            totalConsumo += bimestre.consumo;
                            totalBimestres++;
                        }
                    }
                });

                const promedioDiario = totalDias > 0 ? totalConsumo / totalDias : 0;
                const promedioMensual = totalBimestres > 0 ? totalConsumo / (totalBimestres * 2) : 0;
                const promedioAnual = totalBimestres > 0 ? totalConsumo / (totalBimestres / 6) : 0;
                const horasSolares = parseFloat(document.getElementById('horas_solares').value) || 0;
                const eficienciaSistema = 0.76;
                const potenciaPico = promedioDiario / (horasSolares * eficienciaSistema);

                // Guardar en localStorage
                localStorage.setItem('datosBimestres', JSON.stringify(bimestres));
                localStorage.setItem('promedioDiario', promedioDiario);
                localStorage.setItem('promedioMensual', promedioMensual);
                localStorage.setItem('promedioAnual', promedioAnual);
                localStorage.setItem('potenciaPico', potenciaPico);

                window.location.href = '/views/resultadosSistema.html';
            }
        });
    } else {
        // Código para la interfaz de resultados
        const potenciaPicoInput = document.getElementById('potencia-pico');
        const potenciaModuloInput = document.getElementById('potencia-modulo');
        const potenciaInversorInput = document.getElementById('potencia-inversor');
        const modulosUtilizarInput = document.getElementById('modulos-utilizar');
        const inversoresUtilizarInput = document.getElementById('inversores-utilizar');

        function calcularComponentes(potenciaPico, potenciaModulo, potenciaInversor) {
            if (!potenciaPico || !potenciaModulo || !potenciaInversor) {
                return { numeroModulos: 0, numeroInversores: 0 };
            }

            const numeroModulos = Math.ceil((potenciaPico * 1000) / potenciaModulo);
            const numeroInversores = Math.ceil(potenciaPico / potenciaInversor);
            return { numeroModulos, numeroInversores };
        }

        function actualizarCalculos() {
            const potenciaPicoVal = parseFloat(potenciaPicoInput.value) || 0;
            const potenciaModulo = parseFloat(potenciaModuloInput.value) || 0;
            const potenciaInversor = parseFloat(potenciaInversorInput.value) || 0;

            const { numeroModulos, numeroInversores } = calcularComponentes(potenciaPicoVal, potenciaModulo, potenciaInversor);
            modulosUtilizarInput.value = numeroModulos || '';
            inversoresUtilizarInput.value = numeroInversores || '';

            localStorage.setItem('modulosUtilizar', numeroModulos);
            localStorage.setItem('inversoresUtilizar', numeroInversores);
        }

        potenciaModuloInput.addEventListener('input', actualizarCalculos);
        potenciaInversorInput.addEventListener('input', actualizarCalculos);
        actualizarCalculos();
    }

    // Configuración del botón Guardar
    const guardarBtn = document.querySelector('.guardar');
    if (guardarBtn) {
        guardarBtn.addEventListener('click', guardarDatos);
    }
});

// Función para preparar los datos para la inserción en la BD
function obtenerDatosParaInsertar() {
    const tipoSistema = localStorage.getItem('tipoSistema');
    const datosBimestres = JSON.parse(localStorage.getItem('datosBimestres'));
    const ubicacion = localStorage.getItem('ubicacion') || '';
    const tipoPropiedad = localStorage.getItem('tipoPropiedad') || '';
    const horasSolares = parseFloat(localStorage.getItem('horasSolares')) || 0; // Cambiado de radiacionDiaria a horasSolares
    const potenciaPico = parseFloat(localStorage.getItem('potenciaPico')) || 0;
    const promedioDiario = parseFloat(localStorage.getItem('promedioDiario')) || 0;
    const promedioMensual = parseFloat(localStorage.getItem('promedioMensual')) || 0;
    const promedioAnual = parseFloat(localStorage.getItem('promedioAnual')) || 0;
    const marcaModulo = localStorage.getItem('marcaModulo') || '';
    const potenciaModulo = parseFloat(localStorage.getItem('potenciaModulo')) || 0;
    const modulosUtilizar = parseInt(localStorage.getItem('modulosUtilizar')) || 0;
    const marcaInversor = localStorage.getItem('marcaInversor') || '';
    const potenciaInversor = parseFloat(localStorage.getItem('potenciaInversor')) || 0;
    const inversoresUtilizar = parseInt(localStorage.getItem('inversoresUtilizar')) || 0;

    return {
        tipoSistema,
        datosBimestres,
        ubicacion,
        tipoPropiedad,
        horasSolares,  // Actualizado a horasSolares
        potenciaPico,
        promedioDiario,
        promedioMensual,
        promedioAnual,
        marcaModulo,
        potenciaModulo,
        modulosUtilizar,
        marcaInversor,
        potenciaInversor,
        inversoresUtilizar
    };
}

// Función que usa SweetAlert para solicitar los datos del cliente
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

// Función para enviar los datos al backend
async function guardarDatos() {
    // Solicitar los datos del cliente antes de proceder
    const datosCliente = await solicitarDatosCliente();

    if (!datosCliente) return; // Si los datos no se completaron, salir de la función

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
            Swal.fire({
                title: 'Éxito!',
                text: 'Los datos han sido guardados exitosamente.',
                icon: 'success',
                confirmButtonText: 'Aceptar'
            });
            console.log('Datos guardados exitosamente:', data);
        } else {
            Swal.fire({
                title: 'Error',
                text: 'Hubo un error al guardar los datos. Por favor, intenta nuevamente.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        }
        console.log('Respuesta del servidor:', data);
    })
    .catch(error => {
        Swal.fire({
            title: 'Error',
            text: 'Hubo un error al enviar la solicitud al servidor.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    });
}