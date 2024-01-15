import { DOS_PI } from './utilidades/constantes';

export default class Pepa {
  x: number;
  y: number;
  radio: number;
  sentido: number;
  velocidad: number;

  constructor(x: number, y: number, radio: number) {
    this.x = x;
    this.y = y;
    this.radio = radio;
    this.sentido = 1;
    this.velocidad = Math.random() * 0.1;
  }

  actualizar(ctx: CanvasRenderingContext2D) {
    const radio = this.radio;

    ctx.beginPath();
    ctx.arc(this.x, this.y, radio, 0, DOS_PI);
    ctx.fill();

    if (this.sentido > 0 && radio >= 8) {
      this.sentido = -1;
    } else if (this.sentido < 0 && radio <= 1) {
      this.sentido = 1;
    }

    this.radio += this.velocidad * this.sentido;
  }
}
