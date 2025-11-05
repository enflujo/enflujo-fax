import fastify from 'fastify';
import cors from '@fastify/cors';
import { Static, Type } from '@sinclair/typebox';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { buscarImpresora, conectar } from './ayudas';
import { Impresora } from './Impresora';

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
}).withTypeProvider<TypeBoxTypeProvider>();

const dispositivo = buscarImpresora();

if (process.env.NODE_ENV !== 'produccion') {
  aplicacion.register(cors);
}

aplicacion.post<{ Body: TFoto }>('/', async (peticion, respuesta) => {
  try {
    const { img, fecha, ancho, alto } = peticion.body;
    if (dispositivo) {
      const conexion = await conectar(dispositivo);
      if (!conexion) throw new Error('No se pudo conectar la impresora');

      const impresora = new Impresora(dispositivo, conexion, { encoding: 'Cp858' });

      // 🔹 Reemplaza desde aquí
      const bytes = Buffer.isBuffer(img) ? img : Buffer.from(img);

      // 1) Enviar la imagen sola y cerrar con LF
      await impresora.flush(bytes);
      await impresora.flush(Uint8Array.from([0x0a])); // salto de línea

      // 2) Alimentar más líneas y cortar en un segundo envío
      impresora.lineaVacia(8); // sube o baja este número si hace falta
      impresora.cut(false /* full cut */, 0);
      await impresora.flush(); // envía feed + cut
      await new Promise((r) => setTimeout(r, 50)); // opcional: deja respirar a la impresora
      await impresora.desconectar(); // cierra conexión
      // 🔹 Hasta aquí
    } else {
      console.error('No se conectó a la impresora');
    }
  } catch (error) {
    console.log(error);
  }
  respuesta.send({ mensaje: 'llegó diegui al servidor' });
});

aplicacion.listen({ port: puerto }, (error, direccion) => {
  if (error) throw error;
  console.log('servidor en', direccion);
});
