export type TiposCaracteres = 'GB18030' | 'Cp858';
export type ModeloImpresora = 'qsprinter';
export type Rasterizado = 'normal' | 'dw' | 'dh' | 'dwdh' | 'dhdw' | 'dwh' | 'dhw';
export type DensidadMapaBits = 's8' | 'd8' | 's24' | 'd24';
export type Alineacion = 'izquierda' | 'centrado' | 'derecha';

export interface OpcionesImpresora {
  encoding?: TiposCaracteres;
  width?: number;
}
