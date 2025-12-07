import { SerialPort } from 'serialport';

export interface ConfiguracionPuertoSerie {
  puerto: string;
  velocidad: number;
  delayEntreEscritas?: number;
}

export default class PuertoSerie {
  puerto: SerialPort | null = null;
  private configuracion: ConfiguracionPuertoSerie;
  private colaBloqueada = false;
  private colaEscritura: Buffer[] = [];

  constructor(configuracion: ConfiguracionPuertoSerie) {
    this.configuracion = {
      delayEntreEscritas: 10,
      ...configuracion,
    };
  }

  /**
   * Abre la conexión al puerto serial con los mismos parámetros que tu config Python
   */
  async iniciar(): Promise<void> {
    return new Promise((resolver, rechazar) => {
      this.puerto = new SerialPort(
        {
          path: this.configuracion.puerto,
          baudRate: this.configuracion.velocidad,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
          rtscts: false,
          xon: false,
          xoff: false,
          highWaterMark: 64 * 1024,
        },
        (error) => {
          if (error) {
            rechazar(new Error(`No se pudo abrir puerto ${this.configuracion.puerto}: ${error.message}`));
          } else {
            console.log(`Puerto serial abierto: ${this.configuracion.puerto} @ ${this.configuracion.velocidad} baud`);
            resolver();
          }
        }
      );
    });
  }

  /**
   * Escribe datos al puerto serial con control de flujo
   * Usa una cola para evitar saturar la impresora
   */
  escribir(datos: Buffer): Promise<void> {
    return new Promise((resolver, rechazar) => {
      if (!this.puerto) {
        rechazar(new Error('Puerto serial no está abierto'));
        return;
      }

      // Agregar a la cola
      this.colaEscritura.push(datos);

      // Procesar la cola si no está ocupada
      this._procesarCola(resolver, rechazar);
    });
  }

  /**
   * Procesa la cola de escrituras de forma secuencial para evitar cuelgues
   */
  private _procesarCola(resolver: () => void, rechazar: (error: Error) => void): void {
    if (this.colaBloqueada || this.colaEscritura.length === 0) {
      if (this.colaEscritura.length === 0) {
        resolver();
      }
      return;
    }

    this.colaBloqueada = true;
    const datos = this.colaEscritura.shift();

    if (!datos || !this.puerto) {
      this.colaBloqueada = false;
      rechazar(new Error('Error procesando cola'));
      return;
    }

    // Escribir con callback que maneja el envío
    this.puerto.write(datos, (error) => {
      if (error) {
        this.colaBloqueada = false;
        rechazar(error);
        return;
      }

      // Asegurar que los datos se enviaron completamente
      this.puerto!.drain((drainError) => {
        if (drainError) {
          console.error('Error al drenar:', drainError);
        }

        // Esperar un poco antes de procesar el siguiente (evita saturación)
        setTimeout(() => {
          this.colaBloqueada = false;

          // Si hay más en la cola, procesar
          if (this.colaEscritura.length > 0) {
            this._procesarCola(resolver, rechazar);
          } else {
            resolver();
          }
        }, this.configuracion.delayEntreEscritas);
      });
    });
  }

  /**
   * Espera a que se complete la escritura de todos los datos
   */
  async drain(): Promise<void> {
    return new Promise((resolver, rechazar) => {
      if (!this.puerto) {
        resolver();
        return;
      }

      this.puerto.drain((error) => {
        if (error) {
          rechazar(error);
        } else {
          resolver();
        }
      });
    });
  }

  /**
   * Cierra la conexión al puerto serial
   */
  async cerrar(): Promise<void> {
    return new Promise((resolver, rechazar) => {
      if (!this.puerto) {
        resolver();
        return;
      }

      // Esperar a que se drene antes de cerrar
      this.puerto.drain((error) => {
        if (error) {
          console.error('Error al drenar puerto:', error);
        }

        this.puerto?.close((closeError) => {
          if (closeError) {
            rechazar(closeError);
          } else {
            this.puerto = null;
            this.colaEscritura = [];
            console.log('Puerto serial cerrado');
            resolver();
          }
        });
      });
    });
  }
}
