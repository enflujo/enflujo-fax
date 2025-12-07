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
    const tam = radio * 2;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.beginPath();
    ctx.moveTo(0, -tam * 0.35);
    ctx.bezierCurveTo(tam, -tam, tam, tam * 0.6, 0, tam);
    ctx.bezierCurveTo(-tam, tam * 0.6, -tam, -tam, 0, -tam * 0.35);
    ctx.fill();
    ctx.restore();

    if (this.sentido > 0 && radio >= 7) {
      this.sentido = -1;
    } else if (this.sentido < 0 && radio <= 1) {
      this.sentido = 1;
    }

    this.radio += this.velocidad * this.sentido;
  }
}
