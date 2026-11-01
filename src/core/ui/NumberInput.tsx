import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

// Separadores del idioma: en es-CL el miles es "." y el decimal ","; en en-US al revés.
const separators = (locale: string): { group: string; decimal: string } => {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234567.5);
  return {
    group: parts.find((p) => p.type === 'group')?.value ?? '.',
    decimal: parts.find((p) => p.type === 'decimal')?.value ?? ',',
  };
};

const groupDigits = (digits: string, group: string): string => digits.replace(/\B(?=(\d{3})+(?!\d))/g, group);

// Un texto escrito por la persona → sus partes: dígitos enteros y decimales (si se permiten decimales).
function splitTyped(raw: string, locale: string, fractionDigits: number) {
  const { decimal } = separators(locale);
  let intPart = '';
  let fracPart = '';
  let hasDecimal = false;
  for (const ch of raw) {
    if (/\d/.test(ch)) {
      if (hasDecimal) {
        if (fracPart.length < fractionDigits) fracPart += ch;
      } else intPart += ch;
    } else if (ch === decimal && fractionDigits > 0 && !hasDecimal) hasDecimal = true;
  }
  return { intPart: intPart.replace(/^0+(?=\d)/, ''), fracPart, hasDecimal };
}

// El texto tal como se ve en el campo: con puntos de miles (y la coma decimal si la escribieron).
export function formatTyped(raw: string, locale: string, fractionDigits = 0): string {
  const { group, decimal } = separators(locale);
  const { intPart, fracPart, hasDecimal } = splitTyped(raw, locale, fractionDigits);
  if (!intPart && !hasDecimal) return '';
  return `${groupDigits(intPart || '0', group)}${hasDecimal ? decimal + fracPart : ''}`;
}

// El número que representa un texto; vacío (no cero) si no hay dígitos.
export function parseNumber(raw: string, locale: string, fractionDigits = 0): number | '' {
  const { intPart, fracPart } = splitTyped(raw, locale, fractionDigits);
  if (!intPart && !fracPart) return '';
  return Number(`${intPart || '0'}${fracPart ? '.' + fracPart : ''}`);
}

export const formatNumber = (value: number | '', locale: string, fractionDigits = 0): string =>
  value === '' ? '' : new Intl.NumberFormat(locale, { maximumFractionDigits: fractionDigits }).format(value);

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'inputMode'> & {
  value: number | '';
  onChange: (value: number | '') => void;
  locale: string;
  fractionDigits?: number;
};

// Campo de números con separador de miles mientras se escribe. Se puede vaciar del todo (no se rellena con 0) y el
// cursor se queda junto al dígito que se escribió, aunque se agreguen o quiten puntos.
export const NumberInput: React.FC<Props> = ({ value, onChange, locale, fractionDigits = 0, ...rest }) => {
  const [text, setText] = useState(() => formatNumber(value, locale, fractionDigits));
  const inputRef = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);

  // Si el valor cambia desde fuera (por ejemplo al abrir otra propiedad), el texto lo sigue.
  useEffect(() => {
    if (parseNumber(text, locale, fractionDigits) !== value) setText(formatNumber(value, locale, fractionDigits));
    // solo cuando cambia el valor de afuera
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useLayoutEffect(() => {
    if (caret.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  }, [text]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const pos = e.target.selectionStart ?? raw.length;
    const { decimal } = separators(locale);
    const isSignificant = (ch: string) => /\d/.test(ch) || (fractionDigits > 0 && ch === decimal);
    // cuántos dígitos (o coma decimal) había a la izquierda del cursor
    const left = [...raw.slice(0, pos)].filter(isSignificant).length;
    const formatted = formatTyped(raw, locale, fractionDigits);
    // el cursor va después del mismo número de dígitos en el texto con puntos
    let seen = 0;
    let newPos = 0;
    for (const ch of formatted) {
      if (seen >= left) break;
      newPos += 1;
      if (isSignificant(ch)) seen += 1;
    }
    caret.current = newPos;
    setText(formatted);
    onChange(parseNumber(formatted, locale, fractionDigits));
  };

  return (
    <input
      {...rest}
      ref={inputRef}
      type="text"
      inputMode={fractionDigits > 0 ? 'decimal' : 'numeric'}
      autoComplete="off"
      value={text}
      onChange={handleChange}
    />
  );
};
