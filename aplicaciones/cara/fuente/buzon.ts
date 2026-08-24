export default () => {
  const buzon = document.getElementById('buzon') as HTMLInputElement;
  const lienzo = document.getElementById('lienzo') as HTMLCanvasElement;
  const botonImprimir = document.getElementById('botonImprimir') as HTMLDivElement;

  buzon.onchange = async (evento) => {
    botonImprimir.classList.add('oculto');
    document.body.dispatchEvent(new Event('pausarCamara'));
    const archivos = (evento.target as HTMLInputElement).files;

    if (archivos?.length) {
      const url = URL.createObjectURL(archivos[0]);
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
        buzon.value = '';
        console.error('No se pudo abrir la imagen seleccionada');
        document.body.dispatchEvent(new Event('reanudarCamara'));
      };
      img.src = url;
    } else document.body.dispatchEvent(new Event('reanudarCamara'));
    lienzo.style.display = 'block';
  };
};
