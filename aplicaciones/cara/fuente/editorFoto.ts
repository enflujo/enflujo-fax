import { altoContraste, atkinson, bayer, floydsteinberg } from './filtros/tramados';
import { desdePorcentaje, porcentaje } from './utilidades/ayudas';

export default () => {
  const lienzo = document.getElementById('lienzo') as HTMLCanvasElement;
  const ctx = lienzo.getContext('2d') as CanvasRenderingContext2D;

  const botonImprimir = document.getElementById('botonImprimir') as HTMLDivElement;
  const urlTally = import.meta.env.DEV ? 'http://localhost:4002' : 'https://fax-tally.enflujo.com';

  document.body.addEventListener('nuevaImagen', (evento: CustomEventInit<{ img: HTMLImageElement }>) => {
    if (!evento.detail) return;
    const { img } = evento.detail;
    const anchoImg = 384; // para la impresora de 58mm: 384px, para la de 80mm: 568px
    let ancho = 0;
    let alto = 0;

    /**
     * Escalar foto: Si es vertical o cuadrada, la deja normal. Si es horizontal, la rota.
     */
    const { naturalWidth, naturalHeight } = img;
    if (naturalHeight >= naturalWidth) {
      const porcentajeAncho = porcentaje(anchoImg, naturalWidth);
      const altoImg = desdePorcentaje(porcentajeAncho, naturalHeight);
      ancho = anchoImg;
      alto = Math.round(altoImg / 8) * 8;
      lienzo.width = ancho;
      lienzo.height = alto;
      // Object.assign(lienzo.style, {
      //   transform: `rotate(0deg)`, // Quitar si se había rotado antes
      //   height: '100%',
      // });

      ctx.drawImage(img, 0, 0, ancho, alto);
    } else {
      const porcentajeAlto = porcentaje(anchoImg, naturalHeight);
      const altoImg = desdePorcentaje(porcentajeAlto, naturalWidth);
      ancho = anchoImg;
      alto = Math.round(altoImg / 8) * 8;
      lienzo.width = ancho;
      lienzo.height = alto;
      // const p = porcentaje(ancho, contenedorEditor.clientWidth);
      // console.log(p);
      // Object.assign(lienzo.style, {
      //   transform: `rotate(-90deg)`, // Rotar pero sólo visualmente en pantalla para que las personas la vean normal en pantalla
      //   height: '95%',
      //   // width:
      // });
      // lienzo.style.transform = `rotate(-90deg)`;
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

    const imagenProcesada = atkinson(ctx.getImageData(0, 0, ancho, alto));

    ctx.putImageData(imagenProcesada, 0, 0);
    fin(codificarImagenParaImpresora(imagenProcesada));

    function fin(datosImagen?: Uint8Array) {
      botonImprimir.innerText = 'Imprimir';
      mostrarBotonImprimir();

      // Imprimir la imagen cuando se haga clic en el botón
      botonImprimir.onclick = async () => {
        if (botonImprimir.innerText !== 'Imprimir') return;

        transmitirImpresion();
        const controlador = new AbortController();
        const timeout = window.setTimeout(() => controlador.abort(), 30_000);

        try {
          if (!datosImagen) throw new Error('No hay una imagen lista para imprimir');
          const respuesta = await fetch(urlTally, {
            method: 'POST',
            headers: { 'Content-type': 'application/octet-stream' },
            signal: controlador.signal,
            body: datosImagen.buffer as ArrayBuffer,
          });
          if (!respuesta.ok) throw new Error(`El servidor de impresión respondió ${respuesta.status}`);
          ocultarImpresion();
        } catch (error) {
          console.error('No se pudo imprimir:', error);
          botonImprimir.innerText = 'Falló. Toca para reintentar';
          window.setTimeout(() => {
            botonImprimir.innerText = 'Imprimir';
          }, 3000);
        } finally {
          window.clearTimeout(timeout);
        }
      };
    }

    function mostrarBotonImprimir() {
      botonImprimir.classList.remove('oculto');
    }

    function transmitirImpresion() {
      botonImprimir.innerText = 'Imprimiendo...';
    }

    function ocultarImpresion() {
      botonImprimir.innerText = 'Imprimir';
    }
  });
};

function codificarImagenParaImpresora(imagen: ImageData) {
  const { width: ancho, height: alto } = imagen;
  const bloques: Uint8Array[] = [];
  let longitud = 0;

  const agregar = (bloque: Uint8Array) => {
    bloques.push(bloque);
    longitud += bloque.byteLength;
  };

  if (ancho % 8 !== 0) {
    throw new Error('El ancho tiene que ser múltipo de 8');
  }

  if (alto % 8 !== 0) {
    throw new Error('El alto tiene que ser múltipo de 8');
  }

  const obtenerPixel = (x: number, y: number) =>
    x < ancho && y < alto ? (imagen.data[(ancho * y + x) * 4] > 0 ? 0 : 1) : 0;

  const datosColumna = (ancho: number, alto: number) => {
    const respuesta: Uint8Array[] = [];

    for (let s = 0; s < Math.ceil(alto / 24); s++) {
      const datos = new Uint8Array(ancho * 3);

      for (let x = 0; x < ancho; x++) {
        for (let c = 0; c < 3; c++) {
          for (let b = 0; b < 8; b++) {
            datos[x * 3 + c] |= obtenerPixel(x, s * 24 + b + 8 * c) << (7 - b);
          }
        }
      }

      respuesta.push(datos);
    }

    return respuesta;
  };

  agregar(Uint8Array.of(0x1b, 0x33, 0x24));

  datosColumna(ancho, alto).forEach((bytes) => {
    agregar(Uint8Array.of(0x1b, 0x2a, 0x21, ancho & 0xff, (ancho >> 8) & 0xff));
    agregar(bytes);
    agregar(Uint8Array.of(0x0a));
  });

  agregar(Uint8Array.of(0x1b, 0x32));

  const resultado = new Uint8Array(longitud);
  let posicion = 0;
  for (const bloque of bloques) {
    resultado.set(bloque, posicion);
    posicion += bloque.byteLength;
  }
  return resultado;
}
