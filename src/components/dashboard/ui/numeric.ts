/**
 * Regulile tipografice ale unei cifre afișate. Stau separat de `DASHBOARD_TOKENS` fiindcă sunt
 * consumate de o singură componentă — `Amount` — și de pagina Acasă, care trebuie să rămână la
 * exact aceleași valori. Un al doilea set de hex-uri „aproape la fel" ar fi produs, în timp,
 * două nuanțe de gri pentru aceeași zecimală.
 */

/**
 * Cifrele monetare nu au voie să „danseze" între rânduri. `lining-nums` le ține pe aceeași
 * linie de bază, `tabular-nums` le dă tuturor aceeași lățime — fără el, „3.625" și „1.172"
 * ocupă spații diferite și coloana pare strâmbă.
 */
export const tabularNums = {
  fontVariantNumeric: 'tabular-nums lining-nums',
  fontFeatureSettings: "'tnum' 1, 'lnum' 1",
} as const

/**
 * Perechea de culori a unui număr: partea întreagă poartă greutatea, zecimalele și unitatea
 * rămân mereu secundare. E rampa neutră a paginii Acasă, ridicată la comun.
 */
export const NUMERIC_TEXT = {
  primary: '#101828',
  secondary: '#667085',
} as const
