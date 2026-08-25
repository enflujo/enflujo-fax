import fastify from 'fastify';
import cors from '@fastify/cors';
import { buscarImpresora, conectar } from './ayudas';
import { Impresora } from './Impresora';

const puerto = Number.parseInt(process.env.PUERTO_IMPRESORA || '4002', 10);
const aplicacion = fastify({
  bodyLimit: 30 * 1024 * 1024, // ampliar a 30mb
  logger: true,
});

aplicacion.register(cors, { origin: true });
aplicacion.addContentTypeParser('application/octet-stream', { parseAs: 'buffer' }, (_peticion, cuerpo, fin) => {
  fin(null, cuerpo);
});

aplicacion.post<{ Body: Buffer }>('/', async (peticion, respuesta) => {
  try {
    const img = peticion.body;
    if (!img.length) {
      respuesta.code(400).send({ mensaje: 'La imagen está vacía' });
      return;
    }
    const dispositivo = buscarImpresora();
    if (dispositivo) {
      const conexion = await conectar(dispositivo);
      if (!conexion) throw new Error('No se pudo conectar la impresora');
      const impresora = new Impresora(dispositivo, conexion, { encoding: 'Cp858' });
      impresora.buffer.write(img);
      impresora.cut();
      await impresora.desconectar();
    } else {
      respuesta.code(503).send({ mensaje: 'No se encontró una impresora conectada' });
      return;
    }
  } catch (error) {
    aplicacion.log.error(error);
    respuesta.code(500).send({ mensaje: 'No se pudo completar la impresión' });
    return;
  }
  respuesta.send({ mensaje: 'Impresión completada' });
});

async function iniciar() {
  try {
    const direccion = await aplicacion.listen({ port: puerto, host: '127.0.0.1' });
    aplicacion.log.info({ direccion }, 'Servidor de impresión disponible');
  } catch (error) {
    aplicacion.log.error(error);
    process.exitCode = 1;
  }
}

void iniciar();
