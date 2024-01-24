export default () => {
  const buzon = document.getElementById('buzon') as HTMLInputElement;
  const lienzo = document.getElementById('lienzo') as HTMLCanvasElement;
  const botonImprimir = document.getElementById('botonImprimir') as HTMLDivElement;

  buzon.onchange = async (evento) => {
    botonImprimir.classList.add('oculto');
    const archivos = (evento.target as HTMLInputElement).files;

    if (archivos?.length) {
      const lectorImg = new FileReader();

      lectorImg.onload = () => {
        if (lectorImg.result) {
          const img = new Image();
          img.onload = () => {
            document.body.dispatchEvent(new CustomEvent('nuevaImagen', { detail: { img } }));
          };
          img.src = lectorImg.result as string;
        }
      };
      lectorImg.readAsDataURL(archivos[0]);
    }
    lienzo.style.display = 'block';
  };
};
