import { Delaunay } from 'd3-delaunay';
import { desdePorcentaje, porcentaje } from './utilidades/ayudas';
import { DOS_PI } from './utilidades/constantes';

export default () => {
  const lienzo = document.getElementById('lienzo') as HTMLCanvasElement;
  const ctx = lienzo.getContext('2d') as CanvasRenderingContext2D;
  const proceso = document.getElementById('proceso') as HTMLSpanElement;
  const valorPorcentaje = document.getElementById('porcentaje') as HTMLSpanElement;
  const botonImprimir = document.getElementById('botonImprimir') as HTMLDivElement;
  const contenedorTransmision = document.getElementById('contenedorTransmision') as HTMLDivElement;
  const transmision = document.getElementById('transmision') as HTMLDivElement;
  const fotomatica = document.getElementById('fotomatica') as HTMLDivElement;
  const contenedorEditor = document.getElementById('contenedorEditor') as HTMLDivElement;

  document.body.addEventListener('nuevaImagen', (evento: CustomEventInit<{ img: HTMLImageElement }>) => {
    if (!evento.detail) return;
    const { img } = evento.detail;
    const anchoImg = 380;
    const radio = 1;
    const densidad = 14;
    const pasos = 80;
    const corte = 200;
    let ancho = 0;
    let alto = 0;
    const pasoPorcentaje = 100 / pasos;

    /**
     * Escalar foto: Si es vertical o cuadrada, la deja normal. Si es horizontal, la rota.
     */
    const { naturalWidth, naturalHeight } = img;
    if (naturalHeight >= naturalWidth) {
      const porcentajeAncho = porcentaje(anchoImg, naturalWidth);
      const altoImg = desdePorcentaje(porcentajeAncho, naturalHeight);
      ancho = anchoImg;
      alto = altoImg;
      lienzo.width = ancho;
      lienzo.height = alto;
      ctx.drawImage(img, 0, 0, ancho, alto);
    } else {
      const porcentajeAlto = porcentaje(anchoImg, naturalHeight);
      const altoImg = desdePorcentaje(porcentajeAlto, naturalWidth);
      ancho = anchoImg;
      alto = altoImg;
      lienzo.width = ancho;
      lienzo.height = alto;

      const x = ancho / 2;
      const y = alto / 2;
      const r = Math.PI / 2;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(r);
      ctx.translate(-y, -x);
      ctx.drawImage(img, 0, 0, alto, ancho);
      ctx.restore();
    }

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
        fin();
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

    function fin() {
      const { data: pixeles } = ctx.getImageData(0, 0, ancho, alto);
      const datos: boolean[] = [];
      for (let i = 0; i < pixeles.length; i += 4) {
        const r = pixeles[i];
        const g = pixeles[i + 1];
        const b = pixeles[i + 2];
        const a = pixeles[i + 3];
        datos.push(a != 0 && r < corte && g < corte && b < corte);
      }

      mostrarBotonImprimir();

      // Imprimir la imagen cuando se haga clic en el botón
      botonImprimir.onclick = () => {
        if (botonImprimir.innerText === 'Imprimir') {
          transmitirImpresion();

          fetch('https://fax-tally.enflujo.com', {
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify({ img: datos, fecha: new Date(), ancho, alto }),
          }).then(() => {});
        } else {
          ocultarImpresion();
        }
      };
    }

    function mostrarBotonImprimir() {
      botonImprimir.classList.remove('oculto');
    }

    function transmitirImpresion() {
      fotomatica.classList.add('oculta');
      contenedorEditor.classList.add('oculto');
      contenedorTransmision.classList.add('transmitiendo');
      transmision.classList.add('transmitiendo');
      botonImprimir.innerText = 'Volver';
    }

    function ocultarImpresion() {
      fotomatica.classList.remove('oculta');
      contenedorEditor.classList.remove('oculto');
      contenedorTransmision.classList.remove('transmitiendo');
      transmision.classList.remove('transmitiendo');
      botonImprimir.classList.add('oculto');
      botonImprimir.innerText = 'Imprimir';
    }
  });
};
