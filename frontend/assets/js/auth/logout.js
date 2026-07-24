document.addEventListener('DOMContentLoaded', () => {
  const logoutButton = document.querySelector('.logout-btn');

  if (!logoutButton) return;

  logoutButton.addEventListener('click', async () => {
    try {
      const response = await fetch('/user/logout', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Logout failed');
      }

      sessionStorage.clear();
      localStorage.clear();
      window.history.pushState(null, '', '/user/login');
      window.history.replaceState(null, '', '/user/login');
      window.location.replace('/user/login');
      window.location.href = '/user/login';
    } catch (error) {
      console.error('Logout error:', error);
      alert(error.message || 'Logout failed');
    }
  });
});
