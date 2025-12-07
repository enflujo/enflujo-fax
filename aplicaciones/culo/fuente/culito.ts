import fastify from 'fastify';
import cors from '@fastify/cors';
import { Static, Type } from '@sinclair/typebox';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { conectar } from './ayudas';
import { Impresora } from './Impresora';
import { CONFIG_IMPRESION, DEBUG } from './configuracion';

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

if (process.env.NODE_ENV !== 'produccion') {
  aplicacion.register(cors);
}

aplicacion.post<{ Body: TFoto }>('/', async (peticion, respuesta) => {
  try {
    const { img, fecha, ancho, alto } = peticion.body;

    // Conectar a la impresora por puerto serial
    const puertoSerie = await conectar();
    const impresora = new Impresora(puertoSerie, { encoding: 'Cp858' });

    // 🔹 Flujo optimizado para evitar cuelgues y pérdida de datos
    try {
      const bytes = Buffer.isBuffer(img) ? img : Buffer.from(img);

      if (DEBUG.MOSTRAR_BYTES) {
        console.log(`Iniciando impresión: ${bytes.length} bytes, ${ancho}x${alto}`);
      }

      // 1) Enviar la imagen en chunks pequeños para no saturar
      const totalChunks = Math.ceil(bytes.length / CONFIG_IMPRESION.CHUNK_SIZE);
      
      for (let i = 0; i < bytes.length; i += CONFIG_IMPRESION.CHUNK_SIZE) {
        const chunk = bytes.slice(i, Math.min(i + CONFIG_IMPRESION.CHUNK_SIZE, bytes.length)) as unknown as Uint8Array;
        const chunkNum = Math.floor(i / CONFIG_IMPRESION.CHUNK_SIZE) + 1;
        
        await impresora.flush(chunk);
        
        // Delay adicional cada N chunks para dar tiempo a procesar
        if (chunkNum % CONFIG_IMPRESION.DELAY_CADA_N_CHUNKS === 0) {
          await new Promise((r) => setTimeout(r, CONFIG_IMPRESION.DELAY_ENTRE_GRUPOS));
          if (DEBUG.MOSTRAR_PROGRESO) {
            console.log(`Progreso: ${chunkNum}/${totalChunks} chunks (${Math.round((chunkNum/totalChunks)*100)}%)`);
          }
        }
      }

      if (DEBUG.MOSTRAR_PROGRESO) {
        console.log('✓ Imagen enviada completamente');
      }

      // 2) Esperar antes de enviar comandos finales
      await new Promise((r) => setTimeout(r, CONFIG_IMPRESION.DELAY_ANTES_COMANDOS));

      // 3) Enviar salto de línea
      await impresora.flush(Uint8Array.from([0x0a]));

      // 4) Esperar más tiempo
      await new Promise((r) => setTimeout(r, CONFIG_IMPRESION.DELAY_DESPUES_SALTO));

      // 5) Alimentar líneas y cortar
      impresora.lineaVacia(CONFIG_IMPRESION.LINEAS_VACIAS_ANTES_CORTE);
      impresora.cut(false /* full cut */, 0);
      await impresora.flush();

      // 6) Esperar que termine todo el proceso
      await new Promise((r) => setTimeout(r, CONFIG_IMPRESION.DELAY_ANTES_CORTAR));

      // 7) Desconectar limpiamente
      await impresora.desconectar();

      console.log(`✓ Impresión completada: ${ancho}x${alto} - ${fecha}`);
    } catch (errorImpresion) {
      console.error('✗ Error durante la impresión:', errorImpresion);
      try {
        await impresora.desconectar();
      } catch (e) {
        console.error('Error cerrando conexión:', e);
      }
      throw errorImpresion;
    }
    // 🔹 Hasta aquí

    respuesta.send({ mensaje: 'Impresión exitosa', fecha });
  } catch (error) {
    console.error('Error en servidor:', error);
    respuesta.code(500).send({ error: 'Error en la impresión', detalle: String(error) });
  }
});

aplicacion.listen({ port: puerto }, (error, direccion) => {
  if (error) throw error;
  console.log('servidor en', direccion);
});
