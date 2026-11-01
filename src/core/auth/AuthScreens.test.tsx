import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { LoginScreen, NoMembershipScreen, NewPasswordScreen } from './AuthScreens';
import { useAuthStore } from './useAuthStore';
import { useLocaleStore } from '../i18n/i18n';

describe('AuthScreens (acceso al panel)', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'sin_sesion', email: null, membership: null, error: null, busy: false });
    useLocaleStore.setState({ locale: 'es' });
  });

  afterEach(() => cleanup());

  it('la pantalla de ingreso pide correo y clave y ofrece recuperar la clave', () => {
    render(<LoginScreen />);
    expect(screen.getByText('Ingresar al panel')).toBeTruthy();
    expect(screen.getByLabelText('Correo')).toBeTruthy();
    expect(screen.getByLabelText('Clave')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '¿Olvidaste tu clave?' })).toBeTruthy();
  });

  it('un error de credenciales se muestra como alerta', () => {
    useAuthStore.setState({ error: 'credenciales' });
    render(<LoginScreen />);
    expect(screen.getByRole('alert').textContent).toBe('Correo o clave incorrectos.');
  });

  it('Olvidaste tu clave abre la recuperación y se puede volver', () => {
    render(<LoginScreen />);
    fireEvent.click(screen.getByRole('button', { name: '¿Olvidaste tu clave?' }));
    expect(screen.getByText('Recuperar clave')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Enviar enlace' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Volver a ingresar/ }));
    expect(screen.getByText('Ingresar al panel')).toBeTruthy();
  });

  it('la pantalla de clave nueva y la de cuenta sin corredora muestran sus textos', () => {
    render(<NewPasswordScreen />);
    expect(screen.getByText('Crea tu clave nueva')).toBeTruthy();
    expect(screen.getByText('Clave nueva (mínimo 8 caracteres)')).toBeTruthy();
    cleanup();
    render(<NoMembershipScreen email="ana@ejemplo.cl" />);
    expect(screen.getByText('Cuenta sin corredora')).toBeTruthy();
    expect(screen.getByText(/Tu cuenta \(ana@ejemplo.cl\) aún no está asociada a una corredora/)).toBeTruthy();
  });

  describe('en inglés', () => {
    beforeEach(() => useLocaleStore.setState({ locale: 'en' }));

    it('el ingreso, el error y la recuperación se muestran en inglés', () => {
      useAuthStore.setState({ error: 'clave_corta' });
      render(<LoginScreen />);
      expect(screen.getByText('Sign in to the panel')).toBeTruthy();
      expect(screen.getByLabelText('Email')).toBeTruthy();
      expect(screen.getByLabelText('Password')).toBeTruthy();
      expect(screen.getByRole('alert').textContent).toBe('The password must have at least 8 characters.');
      fireEvent.click(screen.getByRole('button', { name: 'Forgot your password?' }));
      expect(screen.getByText('Reset password')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Send link' })).toBeTruthy();
    });

    it('la cuenta sin corredora y la clave nueva salen en inglés', () => {
      render(<NoMembershipScreen email={null} />);
      expect(screen.getByText('Account without a brokerage')).toBeTruthy();
      expect(screen.getByText(/Your account is not linked to a brokerage yet/)).toBeTruthy();
      cleanup();
      render(<NewPasswordScreen />);
      expect(screen.getByRole('button', { name: /Save password/ })).toBeTruthy();
    });
  });
});
