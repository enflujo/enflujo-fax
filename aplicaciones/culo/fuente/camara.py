#!/usr/bin/python3
"""
Servidor de streaming de cámara optimizado para Raspberry Pi
Puerto: 4003
Resolucion: 640x480 (optimizado para impresora 58mm)
"""

import io
import logging
import socketserver
from http import server
from threading import Condition

from picamera2 import Picamera2
from picamera2.encoders import MJPEGEncoder
from picamera2.outputs import FileOutput

# Configuración
PUERTO = 4003
RESOLUCION = (640, 480)  # Optimizado para impresora 58mm
FPS = 15  # Reducido para menor carga (default es 30)

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)


class StreamingOutput(io.BufferedIOBase):
    """Buffer para frames de video con sincronización thread-safe"""
    
    def __init__(self):
        self.frame = None
        self.condition = Condition()

    def write(self, buf):
        with self.condition:
            self.frame = buf
            self.condition.notify_all()

class StreamingHandler(server.BaseHTTPRequestHandler):
    """Handler HTTP para streaming MJPEG"""
    
    def log_message(self, format, *args):
        """Override para logging más limpio"""
        logging.info("%s - %s" % (self.address_string(), format % args))

    def do_GET(self):
        if self.path == "/":
            self.send_response(200)
            self.send_header("Age", 0)
            self.send_header("Cache-Control", "no-cache, private")
            self.send_header("Pragma", "no-cache")
            self.send_header("Access-Control-Allow-Origin", "*")  # CORS
            self.send_header(
                "Content-Type", "multipart/x-mixed-replace; boundary=FRAME"
            )
            self.end_headers()
            
            try:
                while True:
                    with output.condition:
                        output.condition.wait()
                        frame = output.frame
                    
                    self.wfile.write(b"--FRAME\r\n")
                    self.send_header("Content-Type", "image/jpeg")
                    self.send_header("Content-Length", len(frame))
                    self.end_headers()
                    self.wfile.write(frame)
                    self.wfile.write(b"\r\n")
                    
            except Exception as e:
                logging.warning(
                    "Cliente desconectado %s: %s", 
                    self.client_address, 
                    str(e)
                )
        
        elif self.path == "/health":
            # Endpoint para verificar que el servidor está vivo
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status":"ok","puerto":4003}')
        
        else:
            self.send_error(404)
            self.end_headers()


class StreamingServer(socketserver.ThreadingMixIn, server.HTTPServer):
    """Servidor HTTP multi-threaded para streaming"""
    allow_reuse_address = True
    daemon_threads = True


# Inicializar cámara
logging.info("Inicializando cámara...")
picam2 = Picamera2()

# Configuración optimizada
config = picam2.create_video_configuration(
    main={"size": RESOLUCION, "format": "RGB888"},
    controls={"FrameRate": FPS}
)
picam2.configure(config)

# Output buffer
output = StreamingOutput()

# Iniciar grabación
logging.info(f"Iniciando streaming en {RESOLUCION} @ {FPS}fps")
picam2.start_recording(MJPEGEncoder(), FileOutput(output))

try:
    address = ("", PUERTO)
    server = StreamingServer(address, StreamingHandler)
    logging.info(f"✓ Servidor iniciado en http://0.0.0.0:{PUERTO}")
    logging.info("Presiona Ctrl+C para detener")
    server.serve_forever()
    
except KeyboardInterrupt:
    logging.info("Deteniendo servidor...")
    
finally:
    picam2.stop_recording()
    logging.info("✓ Cámara detenida")
