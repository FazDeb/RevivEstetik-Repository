(async () => {
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  const onlineOrigin = 'https://revivestetik-dev.pages.dev';
  if (!local && location.origin !== onlineOrigin) {
    document.body.textContent = `Open ${onlineOrigin}/admin/ to edit the test website.`;
    return;
  }
  try {
    const response = await fetch('/admin/config.yml');
    if (!response.ok) throw new Error('Configuration unavailable');
    const config = await response.json();
    if (!local) {
      config.local_backend = false;
      config.backend = {name: 'github', repo: 'FazDeb/RevivEstetik-Repository', branch: 'dev/cms-rebuild', base_url: onlineOrigin, auth_endpoint: 'api/auth', auth_scope: 'public_repo'};
      config.display_url = onlineOrigin;
      config.site_url = onlineOrigin;
    }
    window.REVIVESTETIK_CMS_CONFIG = {...config, load_config_file: false};
    window.CMS_MANUAL_INIT = true;
    const script = document.createElement('script');
    script.src = '/admin/decap-cms.js';
    script.onload = () => {
      const previews = document.createElement('script');
      previews.src = '/admin/previews.js';
      document.body.appendChild(previews);
    };
    script.onerror = () => { document.body.textContent = 'The editor could not load. Please refresh to try again.'; };
    document.body.appendChild(script);
  } catch {
    document.body.textContent = 'The editor configuration could not load. Please refresh to try again.';
  }
})();
