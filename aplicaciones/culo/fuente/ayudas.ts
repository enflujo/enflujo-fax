import { SerialPort } from 'serialport';
import PuertoSerie from './PuertoSerie';
import { CONFIG_PUERTO_SERIAL } from './configuracion';

/**
 * Busca puertos seriales disponibles
 * @returns {Promise<string[]>} Array con los puertos encontrados
 */
export async function buscarPuertosSerie(): Promise<string[]> {
  try {
    const puertos = await SerialPort.list();
    return puertos.map((puerto) => puerto.path);
  } catch (error) {
    throw new Error(`Error al buscar puertos seriales: ${error}`);
  }
}

/**
 * Conecta al puerto serial configurado
 * @returns {Promise<PuertoSerie>}
 */
export async function conectar(): Promise<PuertoSerie> {
  const puertoSerie = new PuertoSerie(CONFIG_PUERTO_SERIAL);
  await puertoSerie.iniciar();
  return puertoSerie;
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
