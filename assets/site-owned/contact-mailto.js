(() => {
  'use strict';
  const recipient = "dan.tyler.smith@gmail.com";
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.closest('body') || location.pathname !== '/contact') return;
    if (!form.checkValidity()) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const value = (name) => String(form.elements.namedItem(name)?.value || '').trim();
    const name = value('field1') || value('name');
    const senderEmail = value('email');
    const message = value('field2') || value('message');
    const subject = 'Portfolio inquiry from ' + (name || senderEmail || 'website visitor');
    const body = ['Name: ' + name, 'Email: ' + senderEmail, '', message].join('\n');
    const mailtoUrl = 'mailto:' + recipient + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    const composeEvent = new CustomEvent('portfolio:contact-compose', {
      bubbles: false,
      cancelable: true,
      detail: { recipient, subject, body, mailtoUrl },
    });
    if (document.dispatchEvent(composeEvent)) location.href = mailtoUrl;
  }, true);
})();
