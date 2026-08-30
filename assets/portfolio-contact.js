(() => {
  'use strict';
  const tokenKeys = [29, 71, 43, 97, 13, 53, 83];
  const decodeContactToken = (token) => String(token || '').split('.').filter(Boolean).map((part, index) => {
    const value = Number(part);
    return Number.isInteger(value) ? String.fromCharCode(value ^ tokenKeys[index % tokenKeys.length]) : '';
  }).join('');

  for (const node of document.querySelectorAll('[data-contact-email][data-contact-token]')) {
    node.textContent = decodeContactToken(node.dataset.contactToken);
  }

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.matches('[data-portfolio-contact]')) return;
    if (!form.checkValidity()) return;
    event.preventDefault();
    const value = (name) => String(form.elements.namedItem(name)?.value || '').trim();
    const recipient = decodeContactToken(form.dataset.recipientToken);
    const name = value('field1') || value('name');
    const senderEmail = value('email');
    const message = value('field2') || value('message');
    const subject = 'Portfolio inquiry from ' + (name || senderEmail || 'website visitor');
    const body = ['Name: ' + name, 'Email: ' + senderEmail, '', message].join('\n');
    const status = form.querySelector('[data-contact-status]');
    if (status) status.textContent = status.dataset.sentMessage || '';
    if (!recipient) return;
    location.href = 'mailto:' + recipient + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }, true);
})();
