export default () => {
  const lienzo = document.getElementById('lienzo') as HTMLCanvasElement;
  const contenedor = lienzo.parentElement;
  const ctx = lienzo.getContext('2d') as CanvasRenderingContext2D;

  document.body.addEventListener('nuevaImagen', (evento: CustomEventInit) => {
    console.log(evento.detail.img);
  });

  function escalar() {
    console.log(contenedor?.clientWidth, contenedor?.clientHeight);
  }

  window.addEventListener('resize', escalar);
};
