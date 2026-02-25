import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { Header } from '../../../src/components/Header';

describe('Header', () => {
  test('バナーのヘルプ領域クリックでヘルプモーダルを開閉できる', async () => {
    const user = userEvent.setup();
    render(<Header />);

    expect(document.getElementById('helpModal')?.className).toContain('hidden');
    await user.click(screen.getByRole('button', { name: '操作ガイドを開く' }));
    expect(document.getElementById('helpModal')?.className).toContain('visible');

    await user.click(screen.getByRole('button', { name: '閉じる' }));
    expect(document.getElementById('helpModal')?.className).toContain('hidden');
  });
});
