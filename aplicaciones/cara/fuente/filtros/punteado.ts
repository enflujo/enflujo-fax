import { Delaunay } from 'd3-delaunay';
import { DOS_PI } from '../utilidades/constantes';
const radio = 0.9;
const densidad = 10;

export default (ctx: CanvasRenderingContext2D, ancho: number, alto: number) => {
  return new Promise((resolver) => {
    const proceso = document.getElementById('proceso') as HTMLSpanElement;
    const valorPorcentaje = document.getElementById('porcentaje') as HTMLSpanElement;
    const pasos = 80;
    const pasoPorcentaje = 100 / pasos;

    const { data: pixeles } = ctx.getImageData(0, 0, ancho, alto);
    const datos = new Float64Array(ancho * alto);
    for (let i = 0, n = pixeles.length / 4; i < n; ++i) {
      datos[i] = Math.max(0, 1 - pixeles[i * 4] / 254);
    }
    const n = Math.round((ancho * alto) / densidad);

    const puntos = new Float64Array(n * 2);
    const c = new Float64Array(n * 2);
    const s = new Float64Array(n);

    // Iniciar puntos con "rejection sampling"200
    for (let i = 0; i < n; ++i) {
      for (let j = 0; j < 30; ++j) {
        const x = (puntos[i * 2] = Math.floor(Math.random() * ancho));
        const y = (puntos[i * 2 + 1] = Math.floor(Math.random() * alto));
        if (Math.random() < datos[y * ancho + x]) break;
      }
    }

    const delaunay = new Delaunay(puntos);
    const voronoi = delaunay.voronoi([0, 0, ancho, alto]);

    let k = 0;

    function paso() {
      c.fill(0);
      s.fill(0);

      for (let y = 0, i = 0; y < alto; ++y) {
        for (let x = 0; x < ancho; ++x) {
          const area = datos[y * ancho + x];
          const _x = x + 0.5;
          const _y = y + 0.5;
          i = delaunay.find(_x, _y, i);
          s[i] += area;
          c[i * 2] += area * _x;
          c[i * 2 + 1] += area * _y;
        }
      }

      // relajar puntos moviendolos en su espacio/area posible.
      const area = Math.pow(k + 1, -0.8) * 10;

      for (let i = 0; i < n; ++i) {
        const x0 = puntos[i * 2];
        const y0 = puntos[i * 2 + 1];
        const x1 = s[i] ? c[i * 2] / s[i] : x0;
        const y1 = s[i] ? c[i * 2 + 1] / s[i] : y0;
        puntos[i * 2] = x0 + (x1 - x0) * 1.8 + (Math.random() - 0.5) * area;
        puntos[i * 2 + 1] = y0 + (y1 - y0) * 1.8 + (Math.random() - 0.5) * area;
      }

      pintar(puntos);
      voronoi.update();
      k++;

      // Actualizar barra de porcentaje.
      const nuevoPorcentaje = k * pasoPorcentaje;
      proceso.style.width = `${nuevoPorcentaje}%`;
      valorPorcentaje.innerText = `${nuevoPorcentaje}%`;

      if (k < pasos) {
        requestAnimationFrame(paso);
      } else {
        const { data: pixeles } = ctx.getImageData(0, 0, ancho, alto);
        const datos: number[] = [];
        const corte = 200;

        for (let i = 0; i < pixeles.length; i += 4) {
          const r = pixeles[i];
          const g = pixeles[i + 1];
          const b = pixeles[i + 2];
          const a = pixeles[i + 3];
          datos.push(a != 0 && r < corte && g < corte && b < corte ? 1 : 0);
        }

        resolver(datos);
      }
    }

    paso();

    function pintar(puntos: Float64Array) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, ancho, alto);
      ctx.beginPath();

      for (let i = 0, n = puntos.length; i < n; i += 2) {
        const x = puntos[i];
        const y = puntos[i + 1];
        ctx.moveTo(x + 0.5, y);
        ctx.arc(x, y, radio, 0, DOS_PI);
      }

      ctx.fillStyle = '#000';
      ctx.fill();
    }
  });
};
