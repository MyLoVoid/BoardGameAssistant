import { render, waitFor } from '@testing-library/react-native';

import App from '../src/App';

describe('App shell', () => {
  it('renders the authentication screen by default', async () => {
    const { getByText } = render(<App />);
    await waitFor(() => expect(getByText('Board Game Assistant')).toBeTruthy());
  });
});
