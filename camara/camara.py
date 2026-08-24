#!/usr/bin/python3

"""Servidor de cámara tolerante a desconexiones para la instalación del Fax."""

import io
import json
import logging
import os
import socketserver
import threading
import time
from http import server
from threading import Condition

from picamera2 import Picamera2
from picamera2.encoders import JpegEncoder
from picamera2.outputs import FileOutput


PUERTO = int(os.environ.get("PUERTO_CAMARA", "4003"))
ANCHO = int(os.environ.get("ANCHO_CAMARA", "640"))
ALTO = int(os.environ.get("ALTO_CAMARA", "480"))
FPS = int(os.environ.get("FPS_CAMARA", "8"))
ESPERA_CUADRO = 5
MAX_EDAD_CUADRO = 15


class StreamingOutput(io.BufferedIOBase):
    def __init__(self):
        self.frame = None
        self.secuencia = 0
        self.ultimo_cuadro = 0.0
        self.condition = Condition()

    def write(self, buf):
        with self.condition:
            # El codificador puede reutilizar su buffer; conservar una copia evita
            # entregar un JPEG que cambie mientras otro hilo lo está enviando.
            self.frame = bytes(buf)
            self.secuencia += 1
            self.ultimo_cuadro = time.monotonic()
            self.condition.notify_all()
        return len(buf)

    def esperar_cuadro(self, despues_de=-1, timeout=ESPERA_CUADRO):
        with self.condition:
            listo = self.condition.wait_for(
                lambda: self.frame is not None and self.secuencia > despues_de,
                timeout=timeout,
            )
            if not listo:
                return None
            return self.frame, self.secuencia, self.ultimo_cuadro


output = StreamingOutput()


class StreamingHandler(server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def do_GET(self):
        ruta = self.path.split("?", 1)[0]
        self.connection.settimeout(10)

        if ruta in ("/", "/stream.mjpg"):
            self.enviar_stream()
        elif ruta == "/snapshot.jpg":
            self.enviar_snapshot()
        elif ruta == "/health":
            self.enviar_salud()
        else:
            self.send_error(404)

    def cabeceras_comunes(self, tipo, longitud=None):
        self.send_header("Content-Type", tipo)
        if longitud is not None:
            self.send_header("Content-Length", str(longitud))
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Access-Control-Allow-Origin", "*")

    def enviar_snapshot(self):
        resultado = output.esperar_cuadro()
        if resultado is None:
            self.send_error(503, "La camara no esta entregando imagenes")
            return

        frame, _, creado = resultado
        if time.monotonic() - creado > MAX_EDAD_CUADRO:
            self.send_error(503, "El ultimo cuadro de la camara esta vencido")
            return

        self.send_response(200)
        self.cabeceras_comunes("image/jpeg", len(frame))
        self.end_headers()
        self.wfile.write(frame)

    def enviar_salud(self):
        edad = None
        if output.ultimo_cuadro:
            edad = round(time.monotonic() - output.ultimo_cuadro, 3)
        saludable = edad is not None and edad <= MAX_EDAD_CUADRO
        contenido = json.dumps(
            {"ok": saludable, "secuencia": output.secuencia, "edadCuadro": edad}
        ).encode("utf-8")
        self.send_response(200 if saludable else 503)
        self.cabeceras_comunes("application/json; charset=utf-8", len(contenido))
        self.end_headers()
        self.wfile.write(contenido)

    def enviar_stream(self):
        self.send_response(200)
        self.cabeceras_comunes("multipart/x-mixed-replace; boundary=FRAME")
        self.end_headers()
        secuencia = -1

        try:
            while True:
                resultado = output.esperar_cuadro(secuencia)
                if resultado is None:
                    # Cerrar una transmisión congelada permite que el cliente y
                    # el proxy detecten el fallo en vez de esperar para siempre.
                    raise TimeoutError("La camara dejo de producir cuadros")
                frame, secuencia, _ = resultado
                self.wfile.write(b"--FRAME\r\n")
                self.wfile.write(b"Content-Type: image/jpeg\r\n")
                self.wfile.write(f"Content-Length: {len(frame)}\r\n\r\n".encode("ascii"))
                self.wfile.write(frame)
                self.wfile.write(b"\r\n")
                self.wfile.flush()
        except (BrokenPipeError, ConnectionError, TimeoutError, OSError) as error:
            logging.warning("Cliente de camara desconectado %s: %s", self.client_address, error)
            self.close_connection = True

    def log_message(self, formato, *args):
        if self.path.split("?", 1)[0] in ("/snapshot.jpg", "/health"):
            return
        logging.info("%s - %s", self.client_address[0], formato % args)


class StreamingServer(socketserver.ThreadingMixIn, server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True
    request_queue_size = 16


def vigilar_camara():
    # PM2 reiniciará el proceso. Salir también libera completamente el dispositivo,
    # que es más fiable que intentar reconstruir Picamera2 desde un hilo bloqueado.
    inicio = time.monotonic()
    while True:
        time.sleep(5)
        ahora = time.monotonic()
        referencia = output.ultimo_cuadro or inicio
        if ahora - referencia > MAX_EDAD_CUADRO:
            logging.critical("La camara lleva %.1f s sin producir cuadros; reiniciando", ahora - referencia)
            os._exit(1)


def main():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    picam2 = Picamera2()
    configuracion = picam2.create_video_configuration(
        main={"size": (ANCHO, ALTO)}, controls={"FrameRate": FPS}
    )
    picam2.configure(configuracion)
    picam2.start_recording(JpegEncoder(), FileOutput(output))
    threading.Thread(target=vigilar_camara, name="vigilante-camara", daemon=True).start()

    servidor = StreamingServer(("", PUERTO), StreamingHandler)
    logging.info("Camara disponible en el puerto %d a %d FPS", PUERTO, FPS)
    try:
        servidor.serve_forever(poll_interval=0.5)
    finally:
        servidor.server_close()
        picam2.stop_recording()
        picam2.close()


if __name__ == "__main__":
    main()
