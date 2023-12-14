import fastify from 'fastify';
import cors from '@fastify/cors';
import archivos from '@fastify/multipart';

const puerto = 8000;
const aplicacion = fastify();

aplicacion.register(archivos);

if (process.env.NODE_ENV !== 'produccion') {
  aplicacion.register(cors);
}

aplicacion.get('/', async (peticion, respuesta) => {
  return { hola: 'Anto' };
});

aplicacion.post('/', async (peticion, respuesta) => {
  try {
    console.log(await peticion.file());
  } catch (error) {
    console.log(error);
  }

  respuesta.send({ mensaje: 'llegó diegui al servidor' });
});

aplicacion.listen({ port: puerto }, (error, direccion) => {
  if (error) throw error;
  console.log('servidor en', direccion);
});
