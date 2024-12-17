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

//DATOS DE MODULOS E INVERSORES
function validarDatosModulos() {
    let esValido = true;
    
    const potenciaModulo = document.getElementById('potencia_modulo');
    const cantidadModulos = document.getElementById('cantidad_modulos');
    const eficienciaModulo = document.getElementById('eficiencia_modulo');
    
    // Limpiar errores previos
    quitarResaltadoError(potenciaModulo);
    quitarResaltadoError(cantidadModulos);
    quitarResaltadoError(eficienciaModulo);
    
    // Validar que los campos estén rellenados
    if (!potenciaModulo.value.trim()) {
        resaltarError(potenciaModulo, 'Este campo es requerido');
        esValido = false;
    }
    
    if (!cantidadModulos.value.trim()) {
        resaltarError(cantidadModulos, 'Este campo es requerido');
        esValido = false;
    }
    
    if (!eficienciaModulo.value.trim()) {
        resaltarError(eficienciaModulo, 'Este campo es requerido');
        esValido = false;
    }
    
    return esValido;
}

function validarDatosInversores() {
    let esValido = true;
    
    const potenciaInversor = document.getElementById('potencia_inversor');
    const eficienciaInversor = document.getElementById('eficiencia_inversor');
    const voltajeInversor = document.getElementById('voltaje_inversor');
    
    // Limpiar errores previos
    quitarResaltadoError(potenciaInversor);
    quitarResaltadoError(eficienciaInversor);
    quitarResaltadoError(voltajeInversor);
    
    // Validar que los campos estén rellenados
    if (!potenciaInversor.value.trim()) {
        resaltarError(potenciaInversor, 'Este campo es requerido');
        esValido = false;
    }
    
    if (!eficienciaInversor.value.trim()) {
        resaltarError(eficienciaInversor, 'Este campo es requerido');
        esValido = false;
    }
    
    if (!voltajeInversor.value.trim()) {
        resaltarError(voltajeInversor, 'Este campo es requerido');
        esValido = false;
    }
    
    return esValido;
}

//nueva para inversor y modulo
function validarDatosModulosInversores() {
    let esValido = true;
    
    // Validación de módulos
    const marcaModulo = document.getElementById('marca-modulo');
    const potenciaModulo = document.getElementById('potencia-modulo');
    const modulosUtilizar = document.getElementById('modulos-utilizar');
    
    // Validación de inversores
    const marcaInversor = document.getElementById('marca-inversor');
    const potenciaInversor = document.getElementById('potencia-inversor');
    
    // Limpiar errores previos
    [marcaModulo, potenciaModulo, modulosUtilizar, marcaInversor, potenciaInversor].forEach(input => {
        quitarResaltadoError(input);
    });
    
    // Validar campos de módulos
    if (!marcaModulo.value.trim()) {
        resaltarError(marcaModulo, 'La marca del módulo es requerida');
        esValido = false;
    }
    
    if (!potenciaModulo.value.trim()) {
        resaltarError(potenciaModulo, 'La potencia del módulo es requerida');
        esValido = false;
    }
    
    if (!modulosUtilizar.value.trim()) {
        resaltarError(modulosUtilizar, 'El número de módulos es requerido');
        esValido = false;
    }
    
    // Validar campos de inversores
    if (!marcaInversor.value.trim()) {
        resaltarError(marcaInversor, 'La marca del inversor es requerida');
        esValido = false;
    }
    
    if (!potenciaInversor.value.trim()) {
        resaltarError(potenciaInversor, 'La potencia del inversor es requerida');
        esValido = false;
    }
    
    return esValido;
}
