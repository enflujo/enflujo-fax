const URL_CAMARA = (import.meta.env.VITE_CAMERA_URL || 'https://fax-camara.enflujo.com').replace(/\/$/, '');
const MAX_ESPERA_REINTENTO = 15_000;

export default () => {
  const transmision = document.getElementById('transmision') as HTMLImageElement;
  const estado = document.getElementById('estadoCamara') as HTMLDivElement;
  let temporizador: number | undefined;
  let fallos = 0;
  let generacion = 0;
  let pausada = false;

  function cambiarEstado(mensaje: string, disponible: boolean) {
    estado.textContent = mensaje;
    estado.classList.toggle('oculto', disponible);
    transmision.classList.toggle('sinSenal', !disponible);
  }

  function programar(delay: number) {
    window.clearTimeout(temporizador);
    if (!document.hidden && !pausada) temporizador = window.setTimeout(conectar, delay);
  }

  function conectar() {
    const intento = ++generacion;
    cambiarEstado(fallos ? 'Reconectando cámara…' : 'Conectando cámara…', false);

    transmision.onload = () => {
      if (intento !== generacion) return;
      fallos = 0;
      cambiarEstado('', true);
    };

    transmision.onerror = () => {
      if (intento !== generacion || pausada || document.hidden) return;
      transmision.onload = null;
      transmision.onerror = null;
      transmision.removeAttribute('src');
      fallos += 1;
      cambiarEstado('Reconectando cámara…', false);
      programar(Math.min(1_000 * 2 ** (fallos - 1), MAX_ESPERA_REINTENTO));
    };

    transmision.src = `${URL_CAMARA}/stream.mjpg?t=${Date.now()}`;
  }

  function detener() {
    generacion += 1;
    window.clearTimeout(temporizador);
    transmision.onload = null;
    transmision.onerror = null;
    transmision.removeAttribute('src');
  }

  function iniciar() {
    detener();
    fallos = 0;
    programar(0);
  }

  document.body.addEventListener('pausarCamara', () => {
    pausada = true;
    detener();
  });
  document.body.addEventListener('reanudarCamara', () => {
    pausada = false;
    iniciar();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) detener();
    else iniciar();
  });
  window.addEventListener('online', iniciar);
  window.addEventListener('beforeunload', detener);

  cambiarEstado('Conectando cámara…', false);
  iniciar();
};
