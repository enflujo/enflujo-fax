import { MutableBuffer } from 'mutable-buffer';
import { CHARACTER_SPACING, LINE_SPACING, PAPER, NUEVA_LINEA, BITMAP_FORMAT, ALINEACION } from './constantes';

import type { Device, OutEndpoint } from 'usb';
import Imagen from './Imagen';
import type { Alineacion, DensidadMapaBits, ModeloImpresora, OpcionesImpresora, TiposCaracteres } from './tipos';

export type StyleString = 'normal' | `${'b' | ''}${'i' | ''}${'u' | 'u2' | ''}`;
export type FeedControlSequence = 'lf' | 'glf' | 'ff' | 'cr' | 'ht' | 'vt';

export type FontFamily = 'a' | 'b' | 'c';
export type HardwareCommand = 'init' | 'select' | 'reset';
export type BarcodePosition = 'off' | 'abv' | 'blw' | 'bth';
export type BarcodeFont = 'a' | 'b';
export interface BarcodeOptions {
  width: number;
  height: number;
  position?: BarcodePosition | undefined;
  font?: BarcodeFont | undefined;
  includeParity?: boolean | undefined;
}
export type LegacyBarcodeArguments = [
  width: number,
  height: number,
  position?: BarcodePosition | undefined,
  font?: BarcodeFont | undefined,
];

export type AlineacionTabla = 'left' | 'center' | 'right';
export type CustomTableItem = {
  text: string;
  align?: AlineacionTabla;
  style?: StyleString | undefined;
} & ({ width: number } | { cols: number });

export interface CustomTableOptions {
  size: [number, number];
  encoding: string;
}

export class Impresora {
  public dispositivo: Device;
  public conexion: OutEndpoint;
  public buffer = new MutableBuffer();
  protected opciones: OpcionesImpresora;
  protected encoding: TiposCaracteres;
  protected width: number;
  protected _model?: ModeloImpresora;

  constructor(dispositivo: Device, conexion: OutEndpoint, opciones: OpcionesImpresora) {
    this.dispositivo = dispositivo;
    this.conexion = conexion;
    this.opciones = opciones;
    this.encoding = opciones.encoding ?? 'Cp858';
    this.width = opciones.width ?? 48;
  }

  async imagen(imagen: Imagen, densidad: DensidadMapaBits = 'd24') {
    if (!(imagen instanceof Imagen)) throw new TypeError('Only escpos.Image supported');
    const n = !!~['D8', 'S8'].indexOf(densidad.toUpperCase()) ? 1 : 3;
    const header = BITMAP_FORMAT[densidad];
    const bitmap = imagen.toBitmap(n * 4);

    this.espacioEntreLinea(0);

    bitmap.data.forEach((line) => {
      this.buffer.write(header);
      this.buffer.writeUInt16LE(line.length / n);
      this.buffer.write(line);
      this.buffer.write(NUEVA_LINEA);
    });

    await new Promise<void>((resolve) => {
      resolve();
    });

    return this.espacioEntreLinea();
  }

  espacioEntreLinea(n?: number) {
    if (!n) {
      this.buffer.write(LINE_SPACING.LS_DEFAULT);
    } else {
      this.buffer.write(LINE_SPACING.LS_SET);
      this.buffer.writeUInt8(n);
    }
    return this;
  }

  model(model: ModeloImpresora) {
    this._model = model;
    return this;
  }

  print(content: string | Buffer) {
    this.buffer.write(content);
    return this;
  }

  /**
   * [function encode text]
   * @param  {[String]}  encoding [mandatory]
   * @return {[Printer]} printer  [the escpos printer instance]
   */
  encode(encoding: TiposCaracteres) {
    this.encoding = encoding;
    return this;
  }

  /**
   *
   * @param lineas Número de lineas.
   * @returns this
   */
  lineaVacia(lineas = 1): this {
    this.buffer.write(new Array(lineas).fill(NUEVA_LINEA).join(''));
    return this;
  }

  /**
   * Define la forma de alinear el texto. Usar antes de impriomir texto.
   * @param alineacion Tipo de alineación
   * @returns {Impresora} instancia de Impresora
   */
  alineacion(alineacion: Alineacion): this {
    this.buffer.write(ALINEACION[alineacion]);
    return this;
  }

  /**
   * [set character spacing]
   * @param  {[type]}    n     [description]
   * @return {[Printer]} printer  [the escpos printer instance]
   */
  spacing(n?: number | null) {
    if (n === undefined || n === null) {
      this.buffer.write(CHARACTER_SPACING.CS_DEFAULT);
    } else {
      this.buffer.write(CHARACTER_SPACING.CS_SET);
      this.buffer.writeUInt8(n);
    }
    return this;
  }

  /**
   * Send data to hardware and flush buffer
   * @return {[Promise]}
   */
  flush(): Promise<this> {
    return new Promise((resolve, reject) => {
      const buf = this.buffer.flush();
      this.conexion.transfer(buf, (error) => {
        if (error) reject(error);
        else resolve(this);
      });
    });
  }

  /**
   * Cut paper
   * @param  {[boolean]} partial set a full or partial cut. Default: full Partial cut is not implemented in all printers
   * @param  {[number]} feed Number of lines to feed before cutting
   * @return {[Printer]} printer  [the escpos printer instance]
   */
  cut(partial = true, feed = 3) {
    this.lineaVacia(feed);
    this.buffer.write(PAPER[partial ? 'PAPER_PART_CUT' : 'PAPER_FULL_CUT']);
    return this;
  }

  async desconectar(): Promise<this> {
    await this.flush();
    return new Promise((resolve, reject) => {
      if (!this.dispositivo) return;
      try {
        this.dispositivo.close();
        this.conexion.removeAllListeners('detach');
        resolve(this);
      } catch (error) {
        reject(error);
      }
    });
  }
}
