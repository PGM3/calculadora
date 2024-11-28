// Función para resaltar el campo y agregar el mensaje de error en el tooltip
function resaltarError(input, mensaje) {
    input.classList.add('input-error');   // estilo de error
    input.setAttribute('title', mensaje); // mensaje al atributo title
}

// Función para quitar el resaltado y tooltip cuando el campo es válido
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

    console.log(bimestres);
    return esValido;
}

function validarDatosUbicacion() {
    let esValido = true;

    const ubicacion = document.getElementById('ubicacion');
    const tipoPropiedad = document.getElementById('propiedad');
    const estadoSelect = document.getElementById('estado');
    const irradiacionSolarInput = document.getElementById('irradiacion_solar');

    // Quitar resaltado de errores previos
    quitarResaltadoError(ubicacion);
    quitarResaltadoError(tipoPropiedad);
    quitarResaltadoError(estadoSelect);
    quitarResaltadoError(irradiacionSolarInput);

    // Validación del campo "Ubicación"
    if (!ubicacion.value.trim()) {
        resaltarError(ubicacion, 'La ubicación es requerida.');
        esValido = false;
    }

    // Validación del campo "Tipo de Propiedad"
    if (!tipoPropiedad.value) {
        resaltarError(tipoPropiedad, 'Debe seleccionar un tipo de propiedad.');
        esValido = false;
    }

    // Validación del campo "Estado"
    if (!estadoSelect.value) {
        resaltarError(estadoSelect, 'Debe seleccionar un estado.');
        esValido = false;
    }

    // Validación de la irradiación solar
    const irradiacionSolar = parseFloat(irradiacionSolarInput.value) || 0;
    if (irradiacionSolar <= 0) {
        resaltarError(irradiacionSolarInput, 'La irradiación solar no es válida.');
        esValido = false;
    }

    console.log("Ubicación:", ubicacion.value.trim());
    console.log("Tipo de Propiedad:", tipoPropiedad.value);
    console.log("Estado:", estadoSelect.value);
    console.log("Irradiación Solar:", irradiacionSolarInput.value);


    return esValido;
}