document.addEventListener('DOMContentLoaded', function () {
  const toggleBtn = document.getElementById('mode-toggle');
  if (!toggleBtn) return;

  const icon = toggleBtn.querySelector('i');

  function setTheme(mode) {
    document.body.classList.toggle('dark-mode', mode === 'dark');
    if (icon) {
      icon.classList.replace(
        mode === 'dark' ? 'fa-moon' : 'fa-sun',
        mode === 'dark' ? 'fa-sun' : 'fa-moon'
      );
    }
    localStorage.setItem('theme', mode);
  }

  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);

  toggleBtn.addEventListener('click', function (e) {
    e.preventDefault();
    const current = localStorage.getItem('theme') || 'light';
    const newTheme = current === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  });
});
