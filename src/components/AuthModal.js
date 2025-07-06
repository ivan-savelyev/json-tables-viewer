import React, { useState } from 'react';
import axios from 'axios';

const AuthModal = ({ onClose, onLogin }) => {
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('authUrl') || 'http://localhost');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${apiUrl}/api/v1/api-token-auth/`, {
        username,
        password
      });
      
      localStorage.setItem('authUrl', apiUrl);
      onLogin(response.data.token);
      onClose();
    } catch (err) {
      setError('Ошибка авторизации. Проверьте URL, логин и пароль.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="windows-modal">
        <div className="modal-header">
          <h3>Авторизация</h3>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>URL API:</label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="windows-input"
              placeholder="http://localhost"
            />
          </div>
          <div className="form-group">
            <label>Логин:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="windows-input"
            />
          </div>
          <div className="form-group">
            <label>Пароль:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="windows-input"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="modal-buttons">
            <button type="submit" className="windows-button">Отправить</button>
            <button type="button" className="windows-button" onClick={onClose}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;