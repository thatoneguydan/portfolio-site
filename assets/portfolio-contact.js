(() => {
  'use strict';
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.matches('[data-portfolio-contact]')) return;
    if (!form.checkValidity()) return;
    event.preventDefault();
    const value = (name) => String(form.elements.namedItem(name)?.value || '').trim();
    const recipient = String(form.dataset.recipient || '').trim();
    const name = value('field1') || value('name');
    const senderEmail = value('email');
    const message = value('field2') || value('message');
    const subject = 'Portfolio inquiry from ' + (name || senderEmail || 'website visitor');
    const body = ['Name: ' + name, 'Email: ' + senderEmail, '', message].join('\n');
    const status = form.querySelector('[data-contact-status]');
    if (status) status.textContent = status.dataset.sentMessage || '';
    location.href = 'mailto:' + recipient + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }, true);
})();
