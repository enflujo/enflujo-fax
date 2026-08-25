// https://beyondloom.com/blog/dither.html

/**
 * El que está en el artículo pulido y en Typescript
  
  function floyd2(pixels: number[], w: number) {
    const e = Array(w + 1).fill(0);
    const m = [
      [0, 7],
      [w - 2, 3],
      [w - 1, 5],
      [w, 1],
    ];

    return pixels.map((x: number) => {
      const ultimoValorDeE = +(e.push(0), e.shift());
      console.log(ultimoValorDeE);
      const pix = x + ultimoValorDeE;
      const col = Number(pix > 0.5);
      const err = (pix - col) / 16;
      m.forEach(([x, y]) => (e[x] += err * y));
      return col;
    });
  }
 */

function luminanciaPixel(pixeles: Uint8ClampedArray, i: number) {
  return pixeles[i] * 0.299 + pixeles[i + 1] * 0.587 + pixeles[i + 2] * 0.114;
}

export function grises(imagen: ImageData) {
  const { data: pixeles } = imagen;

  for (let i = 0; i < pixeles.length; i += 4) {
    pixeles.fill(luminanciaPixel(pixeles, i), i, i + 3);
  }

  return imagen;
}

export function atkinson(imagen: ImageData) {
  const { data: pixeles, width: ancho, height: alto } = imagen;
  const luminancias = new Float32Array(ancho * alto);

  // Convertir en grises
  for (let l = 0, i = 0; i < pixeles.length; l++, i += 4) {
    luminancias[l] = luminanciaPixel(pixeles, i);
  }

  // El algoritmo de Bill Atkinson: https://en.wikipedia.org/wiki/Bill_Atkinson
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const l = y * ancho + x;
      const i = l * 4;
      const valor = luminancias[l] < 129 ? 0 : 255;
      const error = (luminancias[l] - valor) / 8;
      pixeles.fill(valor, i, i + 3);

      difundir(x + 1, y, error);
      difundir(x + 2, y, error);
      difundir(x - 1, y + 1, error);
      difundir(x, y + 1, error);
      difundir(x + 1, y + 1, error);
      difundir(x, y + 2, error);
    }
  }

  return imagen;

  function difundir(x: number, y: number, error: number) {
    if (x >= 0 && x < ancho && y >= 0 && y < alto) luminancias[y * ancho + x] += error;
  }
}

export function bayer(imagen: ImageData, limite: number) {
  const { data: pixeles, width: ancho } = imagen;
  const matrizLimites = [
    [15, 135, 45, 165],
    [195, 75, 225, 105],
    [60, 180, 30, 150],
    [240, 120, 210, 90],
  ];

  for (let i = 0; i < pixeles.length; i += 4) {
    const luminancia = luminanciaPixel(pixeles, i);
    const x = (i / 4) % ancho;
    const y = Math.floor(i / 4 / ancho);
    const map = Math.floor((luminancia + matrizLimites[x % 4][y % 4]) / 2);
    const value = map < limite ? 0 : 255;
    pixeles.fill(value, i, i + 3);
  }

  return imagen;
}

export function floydsteinberg(imagen: ImageData) {
  const ancho = imagen.width;
  const luminancia = new Uint8ClampedArray(ancho * imagen.height);

  for (let l = 0, i = 0; i < imagen.data.length; l++, i += 4) {
    luminancia[l] = imagen.data[i] * 0.299 + imagen.data[i + 1] * 0.587 + imagen.data[i + 2] * 0.114;
  }

  for (let l = 0, i = 0; i < imagen.data.length; l++, i += 4) {
    const valor = luminancia[l] < 129 ? 0 : 255;
    const error = Math.floor((luminancia[l] - valor) / 16);
    imagen.data.fill(valor, i, i + 3);
    luminancia[l + 1] += error * 7;
    luminancia[l + ancho - 1] += error * 3;
    luminancia[l + ancho] += error * 5;
    luminancia[l + ancho + 1] += error * 1;
  }

  return imagen;
}

export function altoContraste(imagen: ImageData, limite: number) {
  for (let i = 0; i < imagen.data.length; i += 4) {
    const luminancia = imagen.data[i] * 0.299 + imagen.data[i + 1] * 0.587 + imagen.data[i + 2] * 0.114;
    const valor = luminancia < limite ? 0 : 255;
    imagen.data.fill(valor, i, i + 3);
  }

  return imagen;
}
