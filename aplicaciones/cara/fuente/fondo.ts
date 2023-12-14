import Pepa from './Pepa';

export default () => {
  const lienzo = document.getElementById('fondo') as HTMLCanvasElement;
  const ctx = lienzo.getContext('2d') as CanvasRenderingContext2D;
  const dims = { ancho: 0, alto: 0, columnas: 0, filas: 0 };
  const cuadro = 20;
  const radio = 5;
  let reloj = 0;
  let cantidadPepas = 0;

  let pepas: Pepa[] = [];

  escalar();
  ciclo();

  function ciclo() {
    reloj = requestAnimationFrame(ciclo);

    ctx.clearRect(0, 0, dims.ancho, dims.alto);

    if (pepas.length !== cantidadPepas) return;
    for (let fila = 0; fila < dims.filas; fila++) {
      for (let columna = 0; columna < dims.columnas; columna++) {
        const i = columna + fila * dims.columnas;
        pepas[i].actualizar(ctx);
      }
    }
  }

  function escalar() {
    lienzo.width = dims.ancho = window.innerWidth;
    lienzo.height = dims.alto = window.innerHeight;
    dims.columnas = Math.ceil(dims.ancho / cuadro);
    dims.filas = Math.ceil(dims.alto / cuadro);
    ctx.fillStyle = 'rgb(26, 17, 26)';
    cantidadPepas = dims.columnas * dims.filas;
    pepas = [];

    for (let fila = 0; fila < dims.filas; fila++) {
      for (let columna = 0; columna < dims.columnas; columna++) {
        pepas.push(new Pepa(columna * cuadro, fila * cuadro, Math.random() * radio));
      }
    }
  }

  window.addEventListener('resize', escalar);
};
