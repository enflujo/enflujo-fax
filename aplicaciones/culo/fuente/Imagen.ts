export type ImageMimeType = 'image/png' | 'image/jpg' | 'image/jpeg' | 'image/gif' | 'image/bmp';

export default class Imagen {
  private readonly datos: boolean[] = [];
  private dims: { ancho: number; alto: number };

  constructor(datos: boolean[], dims: { ancho: number; alto: number }) {
    this.dims = dims;
    this.datos = datos;
  }

  toBitmap(densidad: number = 24) {
    const mapaBits: number[][] = [];
    let x = 0;
    let y = 0;
    let b = 0;
    let l = 0;
    let i = 0;
    const c = densidad / 8;
    const { alto, ancho } = this.dims;

    let n = Math.ceil(alto / densidad);

    for (y = 0; y < n; y++) {
      // line data
      const ld: number[] = [];

      for (x = 0; x < ancho; x++) {
        for (b = 0; b < densidad; b++) {
          i = x * c + (b >> 3);

          if (ld[i] === undefined) ld[i] = 0;

          l = y * densidad + b;

          if (l < alto) {
            if (this.datos[l * ancho + x]) {
              ld[i] += 0x80 >> (b & 0x7);
            }
          }
        }
      }

      mapaBits[y] = ld;
    }

    return {
      data: mapaBits,
      density: densidad,
    };
  }
}
