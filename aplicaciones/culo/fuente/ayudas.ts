import { Device, getDeviceList } from 'usb';
import type { OutEndpoint } from 'usb';
import { INTERFACES } from './constantes';
import { platform } from 'os';

export function buscarImpresora() {
  const impresoras = getDeviceList().filter(({ configDescriptor }) => {
    try {
      const impresoras = configDescriptor?.interfaces.filter((interfaz) => {
        return interfaz.filter(({ bInterfaceClass }) => bInterfaceClass === INTERFACES.IMPRESORA).length;
      });

      return impresoras?.length;
    } catch (error) {
      console.error(error);
      throw new Error('No hay impresoras conectadas por USB.');
    }
  });

  if (impresoras.length) return impresoras[0];
  return null;
}

export function conectar(impresora: Device): Promise<OutEndpoint | null> {
  return new Promise((resolver, rechazar) => {
    const cerrarSeguro = () => {
      try {
        impresora.close();
      } catch {
        // El dispositivo puede haberse cerrado al fallar libusb.
      }
    };

    try {
      impresora.open();
      const interfaz = impresora.interfaces?.find(
        ({ descriptor }) => descriptor.bInterfaceClass === INTERFACES.IMPRESORA
      );
      if (!interfaz) {
        cerrarSeguro();
        throw new Error('No se encontró la interfaz USB de la impresora.');
      }

      let reclamada = false;
      try {
        // libusb exige soltar el controlador antes de reclamar o cambiar la
        // configuración. Para imprimir solo necesitamos la salida de la
        // alternativa activa; setAltSetting aquí causaba LIBUSB_ERROR_NOT_FOUND.
        if ('win32' !== platform() && interfaz.isKernelDriverActive()) interfaz.detachKernelDriver();
        interfaz.claim();
        reclamada = true;
        const puntoConexion = interfaz.endpoints.find(({ direction }) => direction === 'out') as
          OutEndpoint | undefined;
        if (!puntoConexion) throw new Error('No se encontró una salida USB para la impresora.');
        puntoConexion.timeout = 20_000;
        resolver(puntoConexion);
      } catch (error) {
        const terminar = () => {
          cerrarSeguro();
          rechazar(error);
        };
        if (reclamada) {
          try {
            interfaz.release(true, terminar);
          } catch {
            terminar();
          }
        } else terminar();
      }
    } catch (error) {
      cerrarSeguro();
      rechazar(error);
    }
  });
}

export function getParityBit(str: string) {
  let parity = 0;
  let reversedCode = str.split('').reverse().join('');
  for (let counter = 0; counter < reversedCode.length; counter += 1) {
    parity += parseInt(reversedCode.charAt(counter), 10) * Math.pow(3, (counter + 1) % 2);
  }
  return ((10 - (parity % 10)) % 10).toString();
}

export function codeLength(str: string) {
  const hex = Number(str.length).toString(16).padStart(2, '0');
  let buff = Buffer.from(hex, 'hex');
  return buff.toString();
}

export function charLength(char: string) {
  const code = char.charCodeAt(0);
  return code > 0x7f && code <= 0xffff ? 2 : 1; // More than 2bytes count as 2
}

export function textLength(str: string) {
  return str.split('').reduce((accLen, char) => {
    return accLen + charLength(char);
  }, 0);
}

export function textSubstring(str: string, start: number, end?: number) {
  let accLen = 0;
  return str.split('').reduce((accStr, char) => {
    accLen = accLen + charLength(char);
    return accStr + (accLen > start && (!end || accLen <= end) ? char : '');
  }, '');
}

export function upperCase<T extends string>(string: T): Uppercase<T> {
  return string.toUpperCase() as Uppercase<T>;
}

export type AnyCase<T extends string> = Uppercase<T> | Lowercase<T>;

export function isKey<T extends {} | []>(key: string | number | symbol, of: T): key is keyof T {
  return key in of;
}

export const numToHexString = (valor: number | string) => {
  valor = +valor;
  if (!isNaN(valor)) {
    valor = valor.toString(16);
    while (valor.length % 2 !== 0) {
      valor = '0' + valor;
    }
  }
  return valor;
};
