// Cloudflare Pages Function - handles POST /api/contact from contact.html.
// Auto-detected by Cloudflare from this file's path under functions/, no
// wrangler.toml or extra deploy config needed - runs alongside the static
// site on the same domain.
//
// Replaces Formspree for this form specifically because Formspree's free
// plan rejects file attachments outright ("File Uploads Not Permitted").
// Sends the message (and an optional image attachment) as an email via
// Resend instead - the same service already used for Pattern Pages'
// access-key emails, so the account/domain verification can be reused.
//
// SETUP (Cloudflare dashboard, for this Pages project):
// Settings -> Environment variables -> add:
//   RESEND_API_KEY (encrypted) - an API key from resend.com
//   FROM_EMAIL (plain) - e.g. "Seamlessly Creative <hello@checkdesignz.com>",
//     using a domain verified in Resend. Optional - falls back to Resend's
//     own test address if not set.

const TO_EMAIL = 'checkdesignz@gmail.com';
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024; // 8MB

export async function onRequestPost(context) {
  const { request, env } = context;

  let form;
  try {
    form = await request.formData();
  } catch (e) {
    return jsonResponse({ errors: [{ message: 'Could not read the form submission.' }] }, 400);
  }

  // Honeypot - bots that fill in every field trip this. Respond as if it
  // worked so they don't learn to skip it, without actually sending mail.
  if ((form.get('_gotcha') || '').toString().trim()) {
    return jsonResponse({ ok: true }, 200);
  }

  const name = (form.get('name') || '').toString().trim();
  const email = (form.get('email') || '').toString().trim();
  const message = (form.get('message') || '').toString().trim();
  const appUsed = (form.get('app_used') || '').toString().trim();
  const socialLink = (form.get('social_link') || '').toString().trim();
  const attachment = form.get('attachment');

  if (!name || !email || !message) {
    return jsonResponse({ errors: [{ message: 'Name, email and message are all required.' }] }, 400);
  }

  if (!env.RESEND_API_KEY) {
    return jsonResponse({ errors: [{ message: 'Email sending is not set up yet - please email directly instead.' }] }, 500);
  }

  const attachments = [];
  if (attachment && typeof attachment === 'object' && attachment.size > 0) {
    if (attachment.size > MAX_ATTACHMENT_BYTES) {
      return jsonResponse({ errors: [{ message: 'That image is a bit too big (max 8MB) - please use a smaller one.' }] }, 400);
    }
    const buffer = await attachment.arrayBuffer();
    attachments.push({ filename: attachment.name || 'creation.jpg', content: arrayBufferToBase64(buffer) });
  }

  const html = `
    <p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p>
    ${appUsed ? `<p><strong>App:</strong> ${escapeHtml(appUsed)}</p>` : ''}
    ${socialLink ? `<p><strong>Shop/social:</strong> ${escapeHtml(socialLink)}</p>` : ''}
    <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
  `;

  let resendRes;
  try {
    resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || 'Seamlessly Creative <onboarding@resend.dev>',
        to: [TO_EMAIL],
        reply_to: email,
        subject: 'New message from Seamlessly Creative',
        html,
        attachments,
      }),
    });
  } catch (e) {
    return jsonResponse({ errors: [{ message: 'Something went wrong sending your message - please try emailing directly instead.' }] }, 502);
  }

  if (!resendRes.ok) {
    return jsonResponse({ errors: [{ message: 'Something went wrong sending your message - please try emailing directly instead.' }] }, 502);
  }

  return jsonResponse({ ok: true }, 200);
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
}
