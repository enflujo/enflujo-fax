export default () => {
  const buzon = document.getElementById('buzon') as HTMLInputElement;
  buzon.onchange = async (evento) => {
    const archivos = (evento.target as HTMLInputElement).files;

    if (archivos?.length) {
      const lectorImg = new FileReader();

      lectorImg.onload = () => {
        if (lectorImg.result) {
          const img = new Image();
          img.onload = () => {
            document.body.dispatchEvent(new CustomEvent('nuevaImagen', { detail: { img } }));
            // ctx.drawImage(img, 0, 0);
          };
          img.src = lectorImg.result as string;
        }
      };
      lectorImg.readAsDataURL(archivos[0]);
      // const datosImg = new FormData();
      // datosImg.append('foto', archivos[0]);
      // const respuesta = await fetch('http://localhost:8000', {
      //   method: 'post',
      //   headers: {},
      //   body: datosImg,
      // });

      // console.log(await respuesta.json());
    }
  };
};
