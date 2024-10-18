document.addEventListener('DOMContentLoaded', () => {
    const continuarBtn = document.querySelector('.continuar');

    continuarBtn.addEventListener('click', () => {
        window.location.href = '/public/views/resultadosSistema.html'; // Cambia 'resultados.html' por la ruta real de tu página de resultados
    });
});
