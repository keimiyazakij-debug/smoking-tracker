import { beforeEach, describe, expect, test } from 'vitest';
import userEvent from '@testing-library/user-event';
import { waitFor } from '@testing-library/react';
import { renderApp } from '../../helpers/renderApp';

describe('GamePage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('チャレンジ画面に遷移して戻るできる', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/game' });
    expect(window.location.pathname).toBe('/game');
    expect(document.getElementById('game')).not.toBeNull();

    await user.click(document.getElementById('gameChallengeLink') as HTMLButtonElement);
    await waitFor(() => {
      expect(window.location.pathname).toBe('/game/challenge');
      expect(document.getElementById('gameChallenge')).not.toBeNull();
    });

    await user.click(document.getElementById('dcBack') as HTMLButtonElement);
    await waitFor(() => {
      expect(window.location.pathname).toBe('/game');
      expect(document.getElementById('game')).not.toBeNull();
    });
  });

  test('バッジ画面に遷移して戻るできる', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/game' });
    expect(window.location.pathname).toBe('/game');
    expect(document.getElementById('game')).not.toBeNull();

    await user.click(document.getElementById('gameBadgeLink') as HTMLButtonElement);
    await waitFor(() => {
      expect(window.location.pathname).toBe('/game/badges');
      expect(document.getElementById('gameBadges')).not.toBeNull();
    });

    await user.click(document.getElementById('badgeBackBtn') as HTMLButtonElement);
    await waitFor(() => {
      expect(window.location.pathname).toBe('/game');
      expect(document.getElementById('game')).not.toBeNull();
    });
  });

  test('バッジ一覧は旧版と同じ9件を表示する', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/game' });
    await user.click(document.getElementById('gameBadgeLink') as HTMLButtonElement);

    await waitFor(() => {
      const cards = document.querySelectorAll('#allBadges .badge-card');
      expect(cards.length).toBe(9);
    });
  });
});
