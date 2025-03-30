document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) {
    fetch('/api/auth/me', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    })
    .then(data => {
      if (data) {
        console.log('User:', data.user);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      localStorage.removeItem('token');
      window.location.href = '/login';
    });
  } else {
    window.location.href = '/login';
  }
});
