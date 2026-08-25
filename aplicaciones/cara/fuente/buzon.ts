export default () => {
  const buzon = document.getElementById('buzon') as HTMLInputElement;
  const cambiarFoto = document.getElementById('cambiarFoto') as HTMLButtonElement;
  const botonImprimir = document.getElementById('botonImprimir') as HTMLButtonElement;
  const estadoProceso = document.getElementById('estadoProceso') as HTMLParagraphElement;
  const maximoBytes = 25 * 1024 * 1024;

  cambiarFoto.onclick = () => buzon.click();

  buzon.onchange = (evento) => {
    document.body.classList.remove('fotoLista');
    botonImprimir.classList.add('oculto');
    botonImprimir.disabled = true;
    document.body.dispatchEvent(new Event('pausarCamara'));
    const archivos = (evento.target as HTMLInputElement).files;

    if (archivos?.length) {
      const archivo = archivos[0];

      if (!archivo.type.startsWith('image/')) {
        finalizarConError('El archivo elegido no es una imagen.');
        return;
      }

      if (archivo.size > maximoBytes) {
        finalizarConError('La imagen pesa más de 25 MB. Elige una más liviana.');
        return;
      }

      document.body.dataset.estado = 'procesando';
      estadoProceso.textContent = 'Preparando la foto…';
      const url = URL.createObjectURL(archivo);
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        document.body.dispatchEvent(new CustomEvent('nuevaImagen', { detail: { img } }));
        URL.revokeObjectURL(url);
        img.onload = null;
        img.onerror = null;
        img.removeAttribute('src');
        buzon.value = '';
        document.body.dispatchEvent(new Event('reanudarCamara'));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        finalizarConError('No pudimos abrir esa imagen. Prueba con otra.');
      };
      img.src = url;
    } else {
      document.body.dispatchEvent(new Event('reanudarCamara'));
    }
  };

  function finalizarConError(mensaje: string) {
    buzon.value = '';
    document.body.dataset.estado = 'error';
    estadoProceso.textContent = mensaje;
    document.body.dispatchEvent(new Event('reanudarCamara'));
  }
};
