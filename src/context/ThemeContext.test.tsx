import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTheme, ThemeProvider } from './ThemeContext';
import { useTheme as useMuiTheme } from '@mui/material/styles';

function Probe() {
  const { theme, toggle } = useTheme();
  const muiTheme = useMuiTheme();
  return (
    <div>
      <span data-testid="context-theme">{theme}</span>
      <span data-testid="mui-mode">{muiTheme.palette.mode}</span>
      <button onClick={toggle}>Toggle</button>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    delete document.documentElement.dataset.theme;
  });

  it('defaults to dark theme and syncs MUI palette mode', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByTestId('context-theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('mui-mode')).toHaveTextContent('dark');
  });

  it('toggling context theme also toggles MUI palette mode', async () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    await userEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('context-theme')).toHaveTextContent('light');
    expect(screen.getByTestId('mui-mode')).toHaveTextContent('light');
  });

  it('sets data-theme attribute on document root for legacy CSS compatibility', async () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(document.documentElement.dataset.theme).toBe('dark');
    await userEvent.click(screen.getByText('Toggle'));
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('throws if useTheme is called outside ThemeProvider', () => {
    const BadProbe = () => {
      useTheme();
      return null;
    };
    expect(() => render(<BadProbe />)).toThrow('useTheme must be used within ThemeProvider');
  });
});