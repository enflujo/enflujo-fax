#!/bin/bash
# Script de gestión del servidor de cámara

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_FILE="enflujo-camara.service"
PYTHON_SCRIPT="$SCRIPT_DIR/fuente/camara.py"

case "$1" in
    install)
        echo "📦 Instalando servicio de cámara..."
        sudo cp "$SCRIPT_DIR/$SERVICE_FILE" /etc/systemd/system/
        sudo systemctl daemon-reload
        sudo systemctl enable enflujo-camara
        echo "✓ Servicio instalado"
        echo "Usa: ./camara.sh start"
        ;;
    
    start)
        echo "▶️  Iniciando servidor de cámara..."
        sudo systemctl start enflujo-camara
        sleep 2
        sudo systemctl status enflujo-camara --no-pager
        ;;
    
    stop)
        echo "⏹️  Deteniendo servidor de cámara..."
        sudo systemctl stop enflujo-camara
        ;;
    
    restart)
        echo "🔄 Reiniciando servidor de cámara..."
        sudo systemctl restart enflujo-camara
        sleep 2
        sudo systemctl status enflujo-camara --no-pager
        ;;
    
    status)
        sudo systemctl status enflujo-camara
        ;;
    
    logs)
        sudo journalctl -u enflujo-camara -f
        ;;
    
    logs-tail)
        sudo journalctl -u enflujo-camara -n 50
        ;;
    
    uninstall)
        echo "🗑️  Desinstalando servicio..."
        sudo systemctl stop enflujo-camara
        sudo systemctl disable enflujo-camara
        sudo rm /etc/systemd/system/enflujo-camara.service
        sudo systemctl daemon-reload
        echo "✓ Servicio desinstalado"
        ;;
    
    test)
        echo "🧪 Ejecutando en modo test (Ctrl+C para detener)..."
        python3 "$PYTHON_SCRIPT"
        ;;
    
    *)
        echo "Uso: $0 {install|start|stop|restart|status|logs|logs-tail|uninstall|test}"
        echo ""
        echo "Comandos:"
        echo "  install     - Instala el servicio systemd"
        echo "  start       - Inicia el servidor"
        echo "  stop        - Detiene el servidor"
        echo "  restart     - Reinicia el servidor"
        echo "  status      - Muestra el estado"
        echo "  logs        - Muestra logs en tiempo real"
        echo "  logs-tail   - Muestra últimas 50 líneas de logs"
        echo "  uninstall   - Desinstala el servicio"
        echo "  test        - Ejecuta en modo test (sin servicio)"
        exit 1
        ;;
esac
