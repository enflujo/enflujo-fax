import './scss/estilos.scss';
import buzon from './buzon';
import fondo from './fondo';
import editorFoto from './editorFoto';

fondo();
buzon();
editorFoto();

// async function inicio() {
//   const datos = await fetch('http://localhost:8000').then((res) => res.json());

//   console.log(datos);
// }

// inicio().catch(console.error);

// fetch('http://localhost:8000')
//   .then((respuesta) => respuesta.json())
//   .then((datos) => {
//     console.log(datos);
//   });
