import fastify from 'fastify';
import cors from '@fastify/cors';
import { Static, Type } from '@sinclair/typebox';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { buscarImpresora, conectar } from './ayudas';
// import Imagen from './Imagen';
import { Impresora } from './Impresora';
// import sqlite3 from 'sqlite3';
// import EscPosEncoder from 'esc-pos-encoder';

export const Foto = Type.Object({
  img: Type.Array(Type.Number()),
  fecha: Type.String(),
  ancho: Type.Number(),
  alto: Type.Number(),
});

export type TFoto = Static<typeof Foto>;

const puerto = 4002;
const aplicacion = fastify({
  bodyLimit: 30 * 1024 * 1024, // ampliar a 30mb
  logger: true,
}).withTypeProvider<TypeBoxTypeProvider>();

aplicacion.register(cors, { origin: true });
aplicacion.addContentTypeParser('application/octet-stream', { parseAs: 'buffer' }, (_peticion, cuerpo, fin) => {
  fin(null, cuerpo);
});

aplicacion.post<{ Body: TFoto | Buffer }>(
  '/',
  // {
  //   schema: {
  //     body: Foto,
  //   },
  // },
  async (peticion, respuesta) => {
    try {
      const img = Buffer.isBuffer(peticion.body) ? peticion.body : Buffer.from(peticion.body.img);
      if (!img.length) {
        respuesta.code(400).send({ mensaje: 'La imagen está vacía' });
        return;
      }
      const dispositivo = buscarImpresora();
      if (dispositivo) {
        const conexion = await conectar(dispositivo);
        if (!conexion) throw new Error('No se pudo conectar la impresora');
        const impresora = new Impresora(dispositivo, conexion, { encoding: 'Cp858' });
        // const imagen = new Imagen(img, { ancho, alto });
        // await impresora.alineacion('centrado').imagen(imagen, 'd24');
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
  }
);

aplicacion.listen({ port: puerto }, (error, direccion) => {
  if (error) throw error;
  console.log('servidor en', direccion);
});

// Guardar datos en base de datos
// const bd = new sqlite3.Database(':memory:', (err) => {
//   if (err) {
//     return console.error(err.message);
//   }
//   console.log('Conectada con la base de datos SQlite 🚀');
// });
// prueba().catch(console.error);
// async function prueba() {
// const encoder = new EscPosEncoder();
// let result = encoder.initialize().text('EnFlujo').newline().cut().encode();
// if (dispositivo) {
//   const conexion = await conectar(dispositivo);
//   if (!conexion) throw new Error('No se pudo conectar la impresora');
//   const impresora = new Impresora(dispositivo, conexion, { encoding: 'Cp858' });
//   // const imagen = new Imagen(img, { ancho, alto });
//   // await impresora.alineacion('centrado').imagen(imagen, 'd24');
//   // impresora.buffer.write(result);
//   impresora.cut();
//   await impresora.desconectar(result);
// } else {
//   console.error('No se conectó a la impresora');
// }
// if (dispositivo) {
//   const conexion = await conectar(dispositivo);
//   if (!conexion) throw new Error('No se pudo conectar la impresora');
//   const impresora = new Impresora(dispositivo, conexion, { encoding: 'Cp858' });
//   impresora.buffer.write('ESC "@"');
//   // const imagen = new Imagen(img, { ancho, alto });
//   // await impresora.alineacion('centrado').imagen(imagen, 'd24');
//   impresora.cut();
//   await impresora.desconectar();
// }
// }
