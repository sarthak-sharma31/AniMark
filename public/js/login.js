document.getElementById('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
  });

  if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token);
      window.location.href = '/';
  } else {
      alert('Login failed');
  }
});