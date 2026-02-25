import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { UIProvider, useUIContext } from '../../../src/state/ui/UIContext';

function Probe() {
  const { state, dispatch } = useUIContext();
  return (
    <div>
      <div data-testid="active-tab">{state.activeTab}</div>
      <div data-testid="timeline-modal">{String(state.isTimelineModalOpen)}</div>
      <div data-testid="temporary-notice">{String(state.isTemporaryNoticeVisible)}</div>
      <button type="button" onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', tab: '/stats' })}>
        set-tab
      </button>
      <button type="button" onClick={() => dispatch({ type: 'OPEN_TIMELINE_MODAL' })}>
        open-modal
      </button>
      <button type="button" onClick={() => dispatch({ type: 'SET_TEMPORARY_NOTICE_VISIBLE', visible: true })}>
        show-notice
      </button>
    </div>
  );
}

describe('state/ui/UIContext', () => {
  test('UIProvider 配下で UI state を更新できる', async () => {
    const user = userEvent.setup();
    render(
      <UIProvider>
        <Probe />
      </UIProvider>,
    );

    expect(screen.getByTestId('active-tab').textContent).toBe('/main');
    expect(screen.getByTestId('timeline-modal').textContent).toBe('false');
    expect(screen.getByTestId('temporary-notice').textContent).toBe('false');

    await user.click(screen.getByRole('button', { name: 'set-tab' }));
    await user.click(screen.getByRole('button', { name: 'open-modal' }));
    await user.click(screen.getByRole('button', { name: 'show-notice' }));

    expect(screen.getByTestId('active-tab').textContent).toBe('/stats');
    expect(screen.getByTestId('timeline-modal').textContent).toBe('true');
    expect(screen.getByTestId('temporary-notice').textContent).toBe('true');
  });
});
