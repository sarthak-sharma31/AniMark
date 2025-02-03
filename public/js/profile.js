document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
    }
  });
  
  document.getElementById('profileForm').addEventListener('submit', async (event) => {
    event.preventDefault();
  
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
  
    const token = localStorage.getItem('token');
  
    const response = await fetch('/api/user/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ username, email })
    });
  
    if (response.ok) {
      alert('Profile updated successfully');
    } else {
      alert('Profile update failed');
    }
  });
  
  document.getElementById('passwordForm').addEventListener('submit', async (event) => {
    event.preventDefault();
  
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
  
    const token = localStorage.getItem('token');
  
    const response = await fetch('/api/user/profile/password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
  
    if (response.ok) {
      alert('Password changed successfully');
    } else {
      alert('Password change failed');
    }
  });
  