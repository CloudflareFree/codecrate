/* Apply persisted preferences before first paint without an inline script. */
try {
  var stored = JSON.parse(localStorage.getItem('it-toolbox-store') || '{}');
  var mode = stored.state && stored.state.themeMode || 'system';
  document.documentElement.classList.toggle('dark', mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches));
  document.documentElement.lang = localStorage.getItem('it-toolbox-language') || 'zh-CN';
} catch (_) {}
