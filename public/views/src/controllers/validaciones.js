// Función para resaltar el campo y agregar el mensaje de error en el tooltip
function resaltarError(input, mensaje) {
    input.classList.add('input-error');   // Aplica el estilo de error
    input.setAttribute('title', mensaje); // Añade el mensaje al atributo title
}

// Función para quitar el resaltado y el tooltip cuando el campo es válido
function quitarResaltadoError(input) {
    input.classList.remove('input-error'); // Remueve el estilo de error
    input.removeAttribute('title');        // Elimina el mensaje del tooltip
}

function validarDatosConsumo() {
    let esValido = true;

    const bimestres = [
        { inicio: document.getElementById('iniPrimero'), fin: document.getElementById('finPrimero'), consumo: document.getElementById('cprimero') },
        { inicio: document.getElementById('iniSegundo'), fin: document.getElementById('finSegundo'), consumo: document.getElementById('cSegundo') },
        { inicio: document.getElementById('iniTercero'), fin: document.getElementById('finTercero'), consumo: document.getElementById('cTercero') },
        { inicio: document.getElementById('iniCuarto'), fin: document.getElementById('finCuarto'), consumo: document.getElementById('cCuarto') },
        { inicio: document.getElementById('iniQuinto'), fin: document.getElementById('finQuinto'), consumo: document.getElementById('cQuinto') },
        { inicio: document.getElementById('iniSexto'), fin: document.getElementById('finSexto'), consumo: document.getElementById('cSexto') }
    ];

    bimestres.forEach(bimestre => {
        // Limpia el estado de error previo
        quitarResaltadoError(bimestre.inicio);
        quitarResaltadoError(bimestre.fin);
        quitarResaltadoError(bimestre.consumo);

        // Validación de fechas
        if (bimestre.inicio.value && bimestre.fin.value) {
            const inicioDate = new Date(bimestre.inicio.value);
            const finDate = new Date(bimestre.fin.value);
            if (finDate < inicioDate) {
                resaltarError(bimestre.fin, 'La fecha de fin debe ser posterior a la de inicio.');
                esValido = false;
            }
        } else {
            if (!bimestre.inicio.value || !bimestre.fin.value) {
                resaltarError(bimestre.inicio, 'Inicio y fin son requeridos.');
                resaltarError(bimestre.fin, 'Inicio y fin son requeridos.');
                esValido = false;
            }
        }

        // Validación de consumo
        const consumoValue = parseFloat(bimestre.consumo.value);
        if (isNaN(consumoValue) || consumoValue < 0) {
            resaltarError(bimestre.consumo, 'El consumo debe ser un número positivo.');
            esValido = false;
        }
    });

    return esValido;
}

function validarDatosUbicacion() {
    let esValido = true;

    const ubicacion = document.getElementById('ubicacion');
    const tipoPropiedad = document.getElementById('propiedad');
    const horasSolares = document.getElementById('horas_solares'); // Cambio de "radiacion" a "horas_solares"

    // Quitar mensajes de error anteriores
    quitarResaltadoError(ubicacion);
    quitarResaltadoError(tipoPropiedad);
    quitarResaltadoError(horasSolares);

    // Validación del campo ubicación
    if (!ubicacion.value) {
        resaltarError(ubicacion, 'La ubicación es requerida.');
        esValido = false;
    }

    // Validación del tipo de propiedad
    if (!tipoPropiedad.value) {
        resaltarError(tipoPropiedad, 'Debe seleccionar un tipo de propiedad.');
        esValido = false;
    }

    // Validación de horas solares diarias
    const horasSolaresValue = parseFloat(horasSolares.value) || 0;
    if (horasSolaresValue <= 0) {
        resaltarError(horasSolares, 'Las horas solares diarias deben ser un número positivo.');
        esValido = false;
    }

    return esValido;
}