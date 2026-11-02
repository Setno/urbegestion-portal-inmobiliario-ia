import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useState } from 'react';
import { NumberInput, formatNumber, parseNumber } from './NumberInput';

describe('formatNumber', () => {
  it('agrupa los miles con punto en es-CL y deja vacío lo vacío', () => {
    expect(formatNumber(1234567, 'es-CL')).toBe('1.234.567');
    expect(formatNumber(950, 'es-CL')).toBe('950');
    expect(formatNumber('', 'es-CL')).toBe('');
  });

  it('usa la coma como decimal cuando se piden decimales', () => {
    expect(formatNumber(1234.5, 'es-CL', 2)).toBe('1.234,5');
  });

  it('en inglés agrupa con coma', () => {
    expect(formatNumber(1234567, 'en-US')).toBe('1,234,567');
  });
});

describe('parseNumber', () => {
  it('lee el número aunque venga con puntos de miles, espacios o texto', () => {
    expect(parseNumber('1.234.567', 'es-CL')).toBe(1234567);
    expect(parseNumber(' 12 000 ', 'es-CL')).toBe(12000);
    expect(parseNumber('$ 5.000 UF', 'es-CL')).toBe(5000);
  });

  it('vacío o sin dígitos es vacío, no cero', () => {
    expect(parseNumber('', 'es-CL')).toBe('');
    expect(parseNumber('abc', 'es-CL')).toBe('');
  });

  it('sin decimales ignora la parte decimal', () => {
    expect(parseNumber('45,9', 'es-CL', 0)).toBe(459); // la coma no es decimal aquí: solo cuentan los dígitos
  });

  it('con decimales respeta la coma y limita la cantidad', () => {
    expect(parseNumber('1.234,567', 'es-CL', 2)).toBe(1234.56);
    expect(parseNumber('45,5', 'es-CL', 2)).toBe(45.5);
  });
});

function Probe({ onValue, initial = '' as number | '', fractionDigits = 0 }: { onValue?: (v: number | '') => void; initial?: number | ''; fractionDigits?: number }) {
  const [v, setV] = useState<number | ''>(initial);
  return (
    <NumberInput
      aria-label="Monto"
      value={v}
      locale="es-CL"
      fractionDigits={fractionDigits}
      onChange={(n) => {
        setV(n);
        onValue?.(n);
      }}
    />
  );
}

const campo = () => screen.getByLabelText('Monto') as HTMLInputElement;

describe('NumberInput', () => {
  afterEach(() => cleanup());

  it('muestra el valor inicial con puntos de miles', () => {
    render(<Probe initial={12000} />);
    expect(campo().value).toBe('12.000');
  });

  it('al escribir va poniendo los puntos y entrega el número limpio', () => {
    const onValue = vi.fn();
    render(<Probe onValue={onValue} />);
    fireEvent.change(campo(), { target: { value: '1234567' } });
    expect(campo().value).toBe('1.234.567');
    expect(onValue).toHaveBeenLastCalledWith(1234567);
  });

  it('se puede borrar todo y queda vacío (no se vuelve a poner un 0)', () => {
    const onValue = vi.fn();
    render(<Probe initial={500} onValue={onValue} />);
    fireEvent.change(campo(), { target: { value: '' } });
    expect(campo().value).toBe('');
    expect(onValue).toHaveBeenLastCalledWith('');
  });

  it('ignora las letras que se escriban', () => {
    render(<Probe />);
    fireEvent.change(campo(), { target: { value: '12ab3' } });
    expect(campo().value).toBe('123');
  });

  it('acepta un número pegado con puntos', () => {
    const onValue = vi.fn();
    render(<Probe onValue={onValue} />);
    fireEvent.change(campo(), { target: { value: '150.000.000' } });
    expect(campo().value).toBe('150.000.000');
    expect(onValue).toHaveBeenLastCalledWith(150000000);
  });

  it('es un campo de texto numérico (teclado de números en el teléfono) y no un input number', () => {
    render(<Probe />);
    expect(campo().type).toBe('text');
    expect(campo().inputMode).toBe('numeric');
  });

  it('con decimales usa inputMode decimal y acepta la coma', () => {
    render(<Probe fractionDigits={2} />);
    expect(campo().inputMode).toBe('decimal');
    fireEvent.change(campo(), { target: { value: '1234,5' } });
    expect(campo().value).toBe('1.234,5');
  });

  it('mantiene el cursor junto al dígito que se escribió al agregarse un punto', () => {
    render(<Probe initial={1234} />); // "1.234"
    const input = campo();
    // el usuario pone un 5 en medio: "1.2|34" → "1.253|4" ; sin el punto: 12534 → "12.534", cursor tras el 5 (3 dígitos desde la izquierda)
    fireEvent.change(input, { target: { value: '1.2534', selectionStart: 4, selectionEnd: 4 } });
    expect(input.value).toBe('12.534');
    expect(input.selectionStart).toBe(4); // "12.5|34": después del 5
  });
});
