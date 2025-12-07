## Optimizaciones para TTL Serial - Impresora 58mm (5V 2A)

### ⚡ CAMBIOS CRÍTICOS - V2 (Optimización para fuente 5V 2A)

**Problema detectado:** Impresora colapsa al tercio de la imagen, genera espacios y caracteres extraños.
**Causa:** La impresora térmica consume mucha corriente al imprimir y con 5V 2A puede sobrecalentarse o no procesar datos tan rápido.

**Soluciones implementadas:**

1. **Chunks más pequeños**: De 1KB a **256 bytes** (4x más lento pero más seguro)
2. **Delays aumentados**: 
   - Entre escrituras: 10ms → **50ms**
   - Entre grupos (cada 10 chunks): **200ms** adicionales
   - Antes de comandos finales: **300ms**
   - Antes de cortar: **500ms**
3. **Drain forzado**: Cada escritura espera confirmación de envío completo
4. **Progreso visible**: Logs cada 10 chunks para monitorear

### Cambios realizados:

#### 1. **PuertoSerie.ts** - Sistema de cola con control de flujo
- ✅ Velocidad: **9600 baud** (fija, según config Python)
- ✅ Puerto: **/dev/serial0** (fijo)
- ✅ Parámetros: `8N1` (8 bits, no parity, 1 stop bit)
- ✅ Control de flujo deshabilitado: `rtscts=false`, `xon=false`, `xoff=false`
- ✅ **Cola de escrituras**: Procesa datos secuencialmente para evitar saturación
- ✅ **Delay entre escrituras**: 10ms entre cada envío (configurable en `ayudas.ts`)
- ✅ **Buffer grande**: 64KB highWaterMark para no descartar datos
- ✅ **Drain antes de cerrar**: Asegura que todo se envíe antes de desconectar

#### 2. **Impresora.ts** - Mejor sincronización
- ✅ `flush()` ahora espera a que se drene completamente
- ✅ Garantiza que los datos lleguen antes de continuar

#### 3. **culito.ts** - Flujo optimizado
- ✅ Divide la imagen en **chunks de 1KB** para no saturar el puerto
- ✅ Espera entre chunks automáticamente (manejado por la cola)
- ✅ **Delay más largo**: 100ms antes de cortar (permite que procese completamente)
- ✅ **Manejo de errores mejorado**: Desconecta limpiamente si falla
- ✅ **Respuestas detalladas**: Logs y mensajes de error más informativos

### Configuración (hardcodeada en `ayudas.ts`):

```typescript
const CONFIG_PUERTO = {
  puerto: '/dev/serial0',        // Puerto TTL (cambiar si es diferente)
  velocidad: 9600,               // Baudios (9600 es estándar)
  delayEntreEscritas: 10,        // ms entre escrituras
};
```

Para cambiar la configuración, edita el archivo `ayudas.ts` en la sección `CONFIG_PUERTO`.

### Ejecución:

```bash
cd /home/enflujo/enflujo-fax/aplicaciones/culo

# Instalar dependencias (primera vez)
npm install

# Desarrollo con logs
npm run ver

# Producción
npm run prender
```

### Problema resuelto: Cuelgues y foto incompleta

**Causa original:**
- Escrituras bloqueantes sin sincronización
- Buffer saturado sin control de flujo
- No se esperaba a que terminara la impresora

**Soluciones aplicadas:**
1. **Cola secuencial** - Un solo envío a la vez
2. **Chunks pequeños** - 1KB máximo por envío
3. **Delay entre envíos** - Da tiempo a la impresora de procesar
4. **Drain después de flush** - Espera confirmación de envío
5. **Timeout mayor** - 100ms antes de cortar (vs 50ms anterior)

### Ajustes si sigue teniendo problemas:

Ahora puedes editar el archivo **`configuracion.ts`** en lugar de tocar el código principal:

```typescript
// fuente/configuracion.ts

export const CONFIG_IMPRESION = {
  CHUNK_SIZE: 128, // Reducir a 128 bytes si 256 aún es mucho
  DELAY_CADA_N_CHUNKS: 5, // Más pausas (cada 5 chunks en vez de 10)
  DELAY_ENTRE_GRUPOS: 300, // Aumentar a 300ms
  DELAY_ANTES_COMANDOS: 500, // Aumentar a 500ms
  DELAY_DESPUES_SALTO: 300, // Aumentar a 300ms
  DELAY_ANTES_CORTAR: 1000, // Aumentar a 1 segundo
  LINEAS_VACIAS_ANTES_CORTE: 15, // Más líneas vacías
};

export const CONFIG_PUERTO_SERIAL = {
  puerto: '/dev/serial0',
  velocidad: 9600,
  delayEntreEscritas: 100, // Aumentar a 100ms entre escrituras
};
```

### Diagnóstico de problemas:

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| Se corta al tercio | Sobrecalentamiento | Reducir `CHUNK_SIZE` a 128, aumentar delays |
| Caracteres extraños | Datos corruptos | Aumentar `delayEntreEscritas` a 100ms |
| Espacios en blanco | Buffer lleno | Reducir `CHUNK_SIZE`, más `DELAY_ENTRE_GRUPOS` |
| No imprime nada | Puerto incorrecto | Verificar `/dev/serial0` con `ls -la /dev/tty*` |
| Imprime muy lento | Delays muy altos | Reducir delays progresivamente |

### Comandos útiles:

```bash
# Ver puertos disponibles
ls -la /dev/tty*

# Monitorear puerto serial
cat /dev/serial0

# Ver logs en tiempo real
pm2 logs culo --lines 100
```
