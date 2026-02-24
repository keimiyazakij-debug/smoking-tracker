import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocalStorage } from '../../../src/hooks/useLocalStorage';

function Probe({ storageKey, initial }: { storageKey: string; initial: string }) {
  const [value, setValue] = useLocalStorage(storageKey, initial);
  return (
    <div>
      <div data-testid="value">{value}</div>
      <button type="button" onClick={() => setValue('next')}>set</button>
    </div>
  );
}

describe('hooks/useLocalStorage', () => {
  test('localStorage が空なら初期値を使う', () => {
    window.localStorage.clear();
    render(<Probe storageKey="k1" initial="init" />);
    expect(screen.getByTestId('value').textContent).toBe('init');
  });

  test('既存値があればJSONを読み出す', () => {
    window.localStorage.setItem('k2', JSON.stringify('saved'));
    render(<Probe storageKey="k2" initial="init" />);
    expect(screen.getByTestId('value').textContent).toBe('saved');
  });

  test('不正JSONなら初期値にフォールバックする', () => {
    window.localStorage.setItem('k3', '{broken');
    render(<Probe storageKey="k3" initial="init" />);
    expect(screen.getByTestId('value').textContent).toBe('init');
  });

  test('setでstateとlocalStorageが更新される', async () => {
    const user = userEvent.setup();
    window.localStorage.clear();
    render(<Probe storageKey="k4" initial="init" />);

    await user.click(screen.getByRole('button', { name: 'set' }));

    expect(screen.getByTestId('value').textContent).toBe('next');
    expect(JSON.parse(window.localStorage.getItem('k4') || 'null')).toBe('next');
  });
});
