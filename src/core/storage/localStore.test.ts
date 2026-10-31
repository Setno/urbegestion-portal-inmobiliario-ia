import { describe, it, expect, beforeEach } from 'vitest';
import { createLocalStore } from './localStore';

describe('createLocalStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('devuelve null cuando no hay nada guardado', () => {
    expect(createLocalStore<string[]>('k').load()).toBeNull();
  });

  it('guarda y vuelve a cargar el mismo valor', () => {
    const store = createLocalStore<{ a: number }[]>('k');
    store.save([{ a: 1 }, { a: 2 }]);
    expect(store.load()).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it('borra el valor guardado', () => {
    const store = createLocalStore<string>('k');
    store.save('hola');
    store.clear();
    expect(store.load()).toBeNull();
    expect(localStorage.getItem('k')).toBeNull();
  });

  it('devuelve null y no lanza error cuando el contenido está corrupto', () => {
    localStorage.setItem('k', '{esto no es json');
    expect(createLocalStore('k').load()).toBeNull();
  });

  it('no lanza error cuando el almacenamiento está lleno o bloqueado', () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    try {
      expect(() => createLocalStore('k').save('x')).not.toThrow();
    } finally {
      Storage.prototype.setItem = original;
    }
  });

  it('usa una clave distinta para cada tienda', () => {
    createLocalStore<number>('a').save(1);
    createLocalStore<number>('b').save(2);
    expect(createLocalStore<number>('a').load()).toBe(1);
    expect(createLocalStore<number>('b').load()).toBe(2);
  });
});
