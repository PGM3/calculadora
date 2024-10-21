
//CALCULO DE PROMEDIOS Y DIAS

document.querySelector('.continuar').addEventListener('click', function() {
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

            // Validar que la fecha de inicio no sea posterior a la fecha de fin
            if (finDate >= inicioDate) {
                const dias = (finDate - inicioDate) / (1000 * 60 * 60 * 24); // Convertir milisegundos a días
                totalDias += dias;
                totalConsumo += bimestre.consumo;
                totalBimestres++;
            }
        }
    });

    // Calcular promedios solo si hay días y bimestres válidos
    const promedioDiario = totalDias > 0 ? totalConsumo / totalDias : 0;
    const promedioMensual = totalBimestres > 0 ? totalConsumo / (totalBimestres / 2) : 0; // Hay 2 meses por bimestre
    const promedioAnual = totalBimestres > 0 ? totalConsumo / (totalBimestres / 6) : 0; // Hay 6 bimestres en un año

    // Guardar resultados en localStorage
    localStorage.setItem('promedioDiario', promedioDiario.toFixed(2));
    localStorage.setItem('promedioMensual', promedioMensual.toFixed(2));
    localStorage.setItem('promedioAnual', promedioAnual.toFixed(2));

    // Redirigir a la página de resultados
    window.location.href = '/public/views/resultadosSistema.html';
});