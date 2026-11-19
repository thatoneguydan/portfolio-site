const endpoint = '/api/publish';
const checkInterval = 10000;
const active = new Set(['queued', 'in_progress']);
const isPending = publish => publish?.pending || active.has(publish?.status);
const summaries = {
  queued: 'Queued', in_progress: 'In progress', success: 'Live and verified',
  failure: 'Checks failed', cancelled: 'Cancelled', unknown: 'Status unavailable'
};

async function publishRequest(options = {}) {
  const response = await fetch(endpoint, {
    credentials: 'same-origin',
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
    ...options
  });
  const data = await response.json().catch(() => null);
  if (!response.ok && !data?.publish) {
    throw new Error(data?.error || 'Could not reach the staging release service.');
  }
  if (!data || typeof data.configured !== 'boolean') throw new Error('Release status is unavailable.');
  return data;
}

export function mountTunePublish(section, saveSettings, onLayout) {
  const button = section.querySelector('[data-publish]');
  const refreshButton = section.querySelector('[data-publish-refresh]');
  const summary = section.querySelector('[data-publish-summary]');
  const message = section.querySelector('[data-publish-status]');
  const runLink = section.querySelector('[data-publish-run]');
  let info = null;
  let action = '';
  let error = '';
  let checking = false;
  let timer = 0;

  function render() {
    const publish = info?.publish;
    const status = publish?.status;
    const label = summaries[status];
    const working = isPending(publish);
    const link = /^https:\/\/github\.com\/thatoneguydan\/portfolio-site\/actions\/runs\/\d+$/.test(publish?.runUrl || '');
    button.disabled = !info?.configured || working || status === 'unknown' || Boolean(action) || checking;
    refreshButton.disabled = checking || Boolean(action);
    summary.textContent = action || (error && !label ? 'Status unavailable' : label || (info ? '' : 'Checking…'));
    const time = publish?.finishedAt && new Date(publish.finishedAt);
    const finished = time && !Number.isNaN(time.valueOf()) ? ` ${time.toLocaleString()}.` : '';
    const text = {
      queued: 'Waiting for the release runner.',
      in_progress: 'The release workflow is running.',
      success: `Both mobile profiles passed on the live site.${finished}`,
      failure: publish?.failedStep ? `Failed step: ${publish.failedStep}.${finished}` : `The release did not pass all checks.${finished}`,
      cancelled: `The release was cancelled.${finished}`,
      unknown: 'The last release could not be verified. Check status again before publishing.'
    }[status];
    const configuration = info && !info.configured ? 'Publishing from Tune still needs a GitHub credential.' : '';
    message.textContent = action || error || [text, configuration].filter(Boolean).join(' ') || (info?.configured
      ? 'No release has run from Tune yet.'
      : info ? 'The release service has not been configured.' : 'Checking the last publish…');
    if (link) runLink.href = publish.runUrl;
    else runLink.removeAttribute('href');
    runLink.hidden = !link;
    onLayout();
  }

  function scheduleCheck() {
    clearTimeout(timer);
    if (!document.hidden && isPending(info?.publish)) timer = setTimeout(refresh, checkInterval);
  }

  async function refresh(preserveError = false) {
    if (checking || action) return;
    checking = true;
    render();
    try {
      info = await publishRequest();
      if (!preserveError || isPending(info.publish)) error = '';
    } catch (failure) {
      error = failure.message;
    } finally {
      checking = false;
      render();
      scheduleCheck();
    }
  }

  button.addEventListener('click', async () => {
    if (button.disabled) return;
    clearTimeout(timer);
    action = 'Saving staging settings…';
    error = '';
    let dispatched = false;
    render();
    try {
      const revision = await saveSettings();
      action = 'Starting the release…';
      render();
      dispatched = true;
      info = await publishRequest({
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({revision: revision ?? null})
      });
      error = info.error || '';
    } catch (failure) {
      error = failure.message;
    } finally {
      action = '';
      render();
      if (dispatched && error && !isPending(info?.publish)) void refresh(true);
      else scheduleCheck();
    }
  });

  refreshButton.addEventListener('click', () => void refresh());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimeout(timer);
    else void refresh();
  });
  void refresh();
}
