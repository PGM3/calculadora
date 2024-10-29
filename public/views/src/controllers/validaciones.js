// validaciones.js

function validarDatosConsumo() {
    let esValido = true;

    // Validar fechas y consumos
    const bimestres = [
        { inicio: document.getElementById('iniPrimero').value, fin: document.getElementById('finPrimero').value, consumo: parseFloat(document.getElementById('cprimero').value) },
        { inicio: document.getElementById('iniSegundo').value, fin: document.getElementById('finSegundo').value, consumo: parseFloat(document.getElementById('cSegundo').value) },
        { inicio: document.getElementById('iniTercero').value, fin: document.getElementById('finTercero').value, consumo: parseFloat(document.getElementById('cTercero').value) },
        { inicio: document.getElementById('iniCuarto').value, fin: document.getElementById('finCuarto').value, consumo: parseFloat(document.getElementById('cCuarto').value) },
        { inicio: document.getElementById('iniQuinto').value, fin: document.getElementById('finQuinto').value, consumo: parseFloat(document.getElementById('cQuinto').value) },
        { inicio: document.getElementById('iniSexto').value, fin: document.getElementById('finSexto').value, consumo: parseFloat(document.getElementById('cSexto').value) }
    ];

    bimestres.forEach(bimestre => {
        // Validar fechas
        if (bimestre.inicio && bimestre.fin) {
            const inicioDate = new Date(bimestre.inicio);
            const finDate = new Date(bimestre.fin);
            if (finDate < inicioDate) {
                alert('La fecha de fin debe ser posterior a la fecha de inicio para el bimestre.');
                esValido = false;
            }
        } else {
            if (!bimestre.inicio || !bimestre.fin) {
                alert('Ambas fechas (inicio y fin) son requeridas para cada bimestre.');
                esValido = false;
            }
        }

        // Validar consumo
        if (isNaN(bimestre.consumo) || bimestre.consumo < 0) {
            alert('El consumo debe ser un número positivo.');
            esValido = false;
        }
    });

    return esValido;
}

function validarDatosUbicacion() {
    let esValido = true;

    const ubicacion = document.getElementById('ubicacion').value;
    if (!ubicacion) {
        alert('La ubicación es requerida.');
        esValido = false;
    }

    const tipoPropiedad = document.getElementById('propiedad').value;
    if (!tipoPropiedad) {
        alert('Debe seleccionar un tipo de propiedad.');
        esValido = false;
    }

    const radiacionDiaria = parseFloat(document.getElementById('radiacion').value) || 0;
    if (radiacionDiaria <= 0) {
        alert('La radiación diaria debe ser un número positivo.');
        esValido = false;
    }

    return esValido;
}