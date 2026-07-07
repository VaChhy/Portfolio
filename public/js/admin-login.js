// If already logged in, skip straight to the dashboard
fetch('/api/session')
  .then((r) => r.json())
  .then((data) => {
    if (data.loggedIn) window.location.href = '/admin/dashboard.html';
  });

const form = document.getElementById('loginForm');
const errorMsg = document.getElementById('errorMsg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.hidden = true;

  const formData = new FormData(form);
  const payload = {
    username: formData.get('username'),
    password: formData.get('password'),
  };

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      errorMsg.textContent = data.error || 'Login failed';
      errorMsg.hidden = false;
      return;
    }
    window.location.href = '/admin/dashboard.html';
  } catch (err) {
    errorMsg.textContent = 'Something went wrong. Try again.';
    errorMsg.hidden = false;
  }
});
