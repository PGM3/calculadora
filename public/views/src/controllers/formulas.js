

// CALCULO DE LOS MODULOS E INVERSORES
function calcularComponentes(potenciaPico, potenciaModulo, potenciaInversor) {
    const potenciaPicoKW = potenciaPico * 1000; // CONVERSION DE KW a W
    // NUMERO DE MODULOS
    const numeroModulos = potenciaModulo > 0 ? Math.ceil(potenciaPicoKW / potenciaModulo) : 0;
    // NUMERO DE INVERSORES
    const numeroInversores = potenciaInversor > 0 ? Math.ceil(potenciaPicoKW / potenciaInversor) : 0;

    return { numeroModulos, numeroInversores };
}

document.addEventListener('DOMContentLoaded', () => {
    // VERIFICACION DE LA PAGINA EN LA QUE SE ENCUENTRA EL BOTON
    const continuarBtn = document.querySelector('.continuar');

    if (continuarBtn) {
        // Lógica para la página con el botón continuar
        continuarBtn.addEventListener('click', function () {
            const bimestres = [
                {
                    inicio: document.getElementById('iniPrimero').value,
                    fin: document.getElementById('finPrimero').value,
                    consumo: parseFloat(document.getElementById('cprimero').value) || 0
                },
                {
                    inicio: document.getElementById('iniSegundo').value,
                    fin: document.getElementById('finSegundo').value,
                    consumo: parseFloat(document.getElementById('cSegundo').value) || 0
                },
                {
                    inicio: document.getElementById('iniTercero').value,
                    fin: document.getElementById('finTercero').value,
                    consumo: parseFloat(document.getElementById('cTercero').value) || 0
                },
                {
                    inicio: document.getElementById('iniCuarto').value,
                    fin: document.getElementById('finCuarto').value,
                    consumo: parseFloat(document.getElementById('cCuarto').value) || 0
                },
                {
                    inicio: document.getElementById('iniQuinto').value,
                    fin: document.getElementById('finQuinto').value,
                    consumo: parseFloat(document.getElementById('cQuinto').value) || 0
                },
                {
                    inicio: document.getElementById('iniSexto').value,
                    fin: document.getElementById('finSexto').value,
                    consumo: parseFloat(document.getElementById('cSexto').value) || 0
                }
            ];

            let totalConsumo = 0;
            let totalDias = 0;
            let totalBimestres = 0;

            bimestres.forEach(bimestre => {
                if (bimestre.inicio && bimestre.fin) {
                    const inicioDate = new Date(bimestre.inicio);
                    const finDate = new Date(bimestre.fin);

                    if (finDate >= inicioDate) {
                        const dias = (finDate - inicioDate) / (1000 * 60 * 60 * 24) + 1;
                        totalDias += dias;
                        totalConsumo += bimestre.consumo;
                        totalBimestres++;
                    }
                }
            });

            const promedioDiario = totalDias > 0 ? totalConsumo / totalDias : 0;
            const promedioMensual = totalBimestres > 0 ? totalConsumo / (totalBimestres * 2) : 0;
            const promedioAnual = totalBimestres > 0 ? totalConsumo / (totalBimestres / 6) : 0;

            // POTENCIA PICO DEL SISTEMA
            const irradiacionSolarDiaria = parseFloat(document.getElementById('radiacion').value) || 0;
            const eficienciaSistema = 0.76;
            const potenciaPico = promedioDiario / (irradiacionSolarDiaria * eficienciaSistema);

            // Guardar en localStorage
            localStorage.setItem('promedioDiario', promedioDiario.toFixed(2));
            localStorage.setItem('promedioMensual', promedioMensual.toFixed(2));
            localStorage.setItem('promedioAnual', promedioAnual.toFixed(2));
            localStorage.setItem('potenciaPico', potenciaPico.toFixed(2));

            // Redirigir a la página de resultados
            window.location.href = '/views/resultadosSistema.html';
        });
        
    } else {
        // Lógica para la página de resultados
        const potenciaPicoInput = document.getElementById('potencia-pico');
        const potenciaModuloInput = document.getElementById('potencia-modulo');
        const potenciaInversorInput = document.getElementById('potencia-inversor');
        const modulosUtilizarInput = document.getElementById('modulos-utilizar');
        const inversoresUtilizarInput = document.getElementById('inversores-utilizar');

        // Recuperar y mostrar valores del localStorage
        const potenciaPico = localStorage.getItem('potenciaPico');
        const promedioDiario = localStorage.getItem('promedioDiario');
        const promedioMensual = localStorage.getItem('promedioMensual');
        const promedioAnual = localStorage.getItem('promedioAnual');

        // Mostrar valores recuperados
        if (potenciaPico) potenciaPicoInput.value = potenciaPico;
        if (promedioDiario) document.getElementById('promedio-diario').value = promedioDiario;
        if (promedioMensual) document.getElementById('promedio-mensual').value = promedioMensual;
        if (promedioAnual) document.getElementById('promedio-anual').value = promedioAnual;

        // Función para actualizar cálculos automáticamente
        function actualizarCalculos() {
            const potenciaPico = parseFloat(potenciaPicoInput.value) || 0;
            const potenciaModulo = parseFloat(potenciaModuloInput.value) || 0;
            const potenciaInversor = parseFloat(potenciaInversorInput.value) || 0;

            const { numeroModulos, numeroInversores } = calcularComponentes(potenciaPico, potenciaModulo, potenciaInversor);

            // Actualizar los campos de resultado
            modulosUtilizarInput.value = numeroModulos || '';
            inversoresUtilizarInput.value = numeroInversores || '';
        }

        // Agregar event listeners para actualización automática
        potenciaModuloInput.addEventListener('input', actualizarCalculos);
        potenciaInversorInput.addEventListener('input', actualizarCalculos);

        // Realizar cálculo inicial si hay datos
        actualizarCalculos();
    }
});