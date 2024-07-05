import fastify from 'fastify';
import cors from '@fastify/cors';
import { Static, Type } from '@sinclair/typebox';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { buscarImpresora, conectar } from './ayudas';
import Imagen from './Imagen';
import { Impresora } from './Impresora';
import sqlite3 from 'sqlite3';
import EscPosEncoder from 'esc-pos-encoder';

// export const Foto = Type.Object({
//   img: Type.Array(Type.Boolean()),
//   fecha: Type.String(),
//   ancho: Type.Number(),
//   alto: Type.Number(),
// });

// export type TFoto = Static<typeof Foto>;

// const puerto = 4002;
// const aplicacion = fastify({
//   bodyLimit: 30 * 1024 * 1024, // ampliar a 30mb
// }).withTypeProvider<TypeBoxTypeProvider>();

const dispositivo = buscarImpresora();

// if (process.env.NODE_ENV !== 'produccion') {
//   aplicacion.register(cors);
// }

// aplicacion.post<{ Body: TFoto }>(
//   '/',
//   {
//     schema: {
//       body: Foto,
//     },
//   },
//   async (peticion, respuesta) => {
// try {
//   const { img, fecha, ancho, alto } = peticion.body;
//   if (dispositivo) {
//     const conexion = await conectar(dispositivo);
//     if (!conexion) throw new Error('No se pudo conectar la impresora');
//     const impresora = new Impresora(dispositivo, conexion, { encoding: 'Cp858' });
//     const imagen = new Imagen(img, { ancho, alto });
//     await impresora.alineacion('centrado').imagen(imagen, 'd24');
//     impresora.cut();
//     await impresora.desconectar();
//   } else {
//     console.error('No se conectó a la impresora');
//   }
// } catch (error) {
//   console.log(error);
// }
// respuesta.send({ mensaje: 'llegó diegui al servidor' });
//   }
// );

// aplicacion.listen({ port: puerto }, (error, direccion) => {
//   if (error) throw error;
//   console.log('servidor en', direccion);
// });

// Guardar datos en base de datos
// const bd = new sqlite3.Database(':memory:', (err) => {
//   if (err) {
//     return console.error(err.message);
//   }
//   console.log('Conectada con la base de datos SQlite 🚀');
// });
prueba().catch(console.error);
async function prueba() {
  const encoder = new EscPosEncoder();

  let result = encoder
    .initialize()
    .text('The quick brown fox jumps over the lazy dog')
    .newline()
    .qrcode('https://nielsleenheer.com')
    .newline(2)
    .cut()
    .encode();

  if (dispositivo) {
    const conexion = await conectar(dispositivo);
    if (!conexion) throw new Error('No se pudo conectar la impresora');
    const impresora = new Impresora(dispositivo, conexion, { encoding: 'Cp858' });
    // const imagen = new Imagen(img, { ancho, alto });
    // await impresora.alineacion('centrado').imagen(imagen, 'd24');
    // impresora.buffer.write(result);
    impresora.cut();
    await impresora.desconectar(result);
  } else {
    console.error('No se conectó a la impresora');
  }
  console.log(result);
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
}
