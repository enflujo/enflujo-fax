import os from 'os';
import usb, { Device, Endpoint, OutEndpoint } from 'usb';
import { INTERFACES } from './constantes';

export default class USB {
  endpoint?: Endpoint;
  dispositivo?: Device;

  constructor(vid?: number, pid?: number) {
    if (vid && pid) {
      this.dispositivo = usb.findByIds(vid, pid);
    } else {
      const impresora = this.buscarImpresora();

      if (impresora && impresora.length) {
        this.dispositivo = impresora[0];
      }
    }

    if (!this.dispositivo) throw new Error('No se encontró ninguna impresora conectada');
  }

  buscarImpresora() {
    return usb.getDeviceList().filter((dispositivo) => {
      try {
        return dispositivo.configDescriptor?.interfaces.filter((interfaz) => {
          return interfaz.filter((config) => config.bInterfaceClass === INTERFACES.IMPRESORA).length;
        }).length;
      } catch (e) {
        return false;
      }
    });
  }

  inciar(): Promise<void> {
    let contador = 0;

    return new Promise((resolver, rechazar) => {
      try {
        if (!this.dispositivo) return;
        this.dispositivo.open();

        this.dispositivo.interfaces?.forEach((interfaz) => {
          interfaz.setAltSetting(interfaz.altSetting, () => {
            try {
              // http://libusb.sourceforge.net/api-1.0/group__dev.html#gab14d11ed6eac7519bb94795659d2c971
              // libusb_kernel_driver_active / libusb_attach_kernel_driver / libusb_detach_kernel_driver : "This functionality is not available on Windows."
              if ('win32' !== os.platform()) {
                if (interfaz.isKernelDriverActive()) {
                  try {
                    interfaz.detachKernelDriver();
                  } catch (e) {
                    console.error('[ERROR] Could not detatch kernel driver: %s', e);
                  }
                }
              }

              interfaz.claim();

              interfaz.endpoints.filter((endpoint) => {
                if (endpoint.direction == 'out' && !this.endpoint) {
                  this.endpoint = endpoint;
                }
              });

              if (this.endpoint) {
                resolver();
              } else if (++contador === this.dispositivo?.interfaces?.length && !this.endpoint) {
                rechazar();
              }
            } catch (e) {
              rechazar(e);
            }
          });
        });
      } catch (error) {
        rechazar(error);
        throw new Error(JSON.stringify(error, null, 2));
      }
    });
  }

  write(datos: Buffer, callback?: (error: usb.usb.LibUSBException | undefined, actual: number) => void) {
    (this.endpoint as OutEndpoint).transfer(datos, callback);
    return this;
  }

  close(callback?: any) {
    if (this.dispositivo) {
      try {
        this.dispositivo.close();
        // usb.removeAllListeners('detach');

        callback && callback(null);
      } catch (e) {
        callback && callback(e);
      }
    } else {
      callback && callback(null);
    }

    return this;
  }
}
