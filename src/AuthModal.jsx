import { createSignal } from 'solid-js';

export default function AuthModal(props) {
  const [username, setUsername] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [currentAuthUrl, setCurrentAuthUrl] = createSignal(props.authUrl);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(currentAuthUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username(),
          password: password()
        })
      });

      if (!response.ok) throw new Error('Authentication failed');
      const data = await response.json();
      props.onLoginSuccess(data.token);
      props.onAuthUrlChange(currentAuthUrl());
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div class="dialog">
      <div class="dialog-header">
        <div class="dialog-title">Authentication</div>
        <button class="dialog-close" onClick={props.onClose}>✕</button>
      </div>
      <div class="dialog-content">
        <form onSubmit={handleSubmit}>
          <div class="field-row">
            <label for="authUrl">Auth URL:</label>
            <input
              id="authUrl"
              type="text"
              value={currentAuthUrl()}
              onInput={(e) => setCurrentAuthUrl(e.target.value)}
              required
            />
          </div>
          <div class="field-row">
            <label for="username">Username:</label>
            <input
              id="username"
              type="text"
              value={username()}
              onInput={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div class="field-row">
            <label for="password">Password:</label>
            <input
              id="password"
              type="password"
              value={password()}
              onInput={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div class="dialog-buttons">
            <button type="submit">Authenticate</button>
            <button type="button" onClick={props.onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}