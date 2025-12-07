/**
 * Configuración para la impresión térmica TTL
 * Ajusta estos valores según el comportamiento de tu impresora
 */

export const CONFIG_IMPRESION = {
  // Tamaño de cada chunk de datos (256 bytes = más lento pero más seguro)
  CHUNK_SIZE: 256,

  // Delay adicional cada N chunks (para dar tiempo a procesar)
  DELAY_CADA_N_CHUNKS: 10,
  DELAY_ENTRE_GRUPOS: 200, // ms

  // Delays entre operaciones
  DELAY_ANTES_COMANDOS: 300, // ms antes de enviar comandos finales
  DELAY_DESPUES_SALTO: 200, // ms después del salto de línea
  DELAY_ANTES_CORTAR: 500, // ms antes de cortar papel

  // Configuración del papel
  LINEAS_VACIAS_ANTES_CORTE: 10,
};

export const CONFIG_PUERTO_SERIAL = {
  puerto: '/dev/serial0',
  velocidad: 9600,
  delayEntreEscritas: 50, // ms entre cada escritura
};

/**
 * Configuración para debugging
 */
export const DEBUG = {
  MOSTRAR_PROGRESO: true, // Mostrar progreso en consola
  MOSTRAR_BYTES: false, // Mostrar cantidad de bytes
};
