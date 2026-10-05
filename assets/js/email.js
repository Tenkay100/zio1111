// ── EMAIL SERVICE (EmailJS Integration) ──

const EMAILJS_PUBLIC_KEY = 'kOmNcMqcxg72aR7Jr';
const EMAILJS_SERVICE_ID = 'service_ymey92e';
const EMAILJS_TEMPLATE_ID = 'template_p8sfzx8';

let emailjsLoaded = false;

// Load EmailJS SDK dynamically if not present
export function loadEmailJS() {
  return new Promise((resolve) => {
    if (window.emailjs) {
      if (!emailjsLoaded) {
        try {
          window.emailjs.init(EMAILJS_PUBLIC_KEY);
          emailjsLoaded = true;
        } catch (e) {
          console.warn("EmailJS init warning:", e);
        }
      }
      return resolve(window.emailjs);
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    script.onload = () => {
      try {
        window.emailjs.init(EMAILJS_PUBLIC_KEY);
        emailjsLoaded = true;
      } catch (e) {
        console.warn("EmailJS init error:", e);
      }
      resolve(window.emailjs);
    };
    script.onerror = () => {
      console.warn("Failed to load EmailJS SDK script.");
      resolve(null);
    };
    document.head.appendChild(script);
  });
}

/**
 * Send welcome email to new client
 * @param {Object} params
 * @param {string} params.to_name - Client full name
 * @param {string} params.to_email - Client email address
 * @param {string} params.account_number - Generated account number
 * @param {string} params.currency - Account currency (e.g. USD)
 * @param {string} [params.login_url] - URL to bank login page
 */
export async function sendWelcomeEmail({ to_name, to_email, account_number, currency = 'USD', login_url }) {
  try {
    const emailjs = await loadEmailJS();
    if (!emailjs) {
      console.warn("EmailJS SDK unavailable, skipping email dispatch.");
      return { success: false, message: 'EmailJS SDK unavailable' };
    }

    const baseUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
    const resolvedLoginUrl = login_url || (baseUrl.endsWith('/admin') ? baseUrl.replace('/admin', '') + '/login.html' : baseUrl + '/login.html');

    const templateParams = {
      to_name: to_name || 'Valued Customer',
      to_email: to_email,
      account_number: account_number || 'Pending Assignment',
      currency: currency || 'USD',
      login_url: resolvedLoginUrl,
      bank_name: 'IDB Global Federal Credit Union'
    };

    console.log("Sending welcome email via EmailJS with params:", templateParams);
    const response = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
    console.log("EmailJS welcome email sent successfully:", response.status, response.text);
    return { success: true, response };
  } catch (error) {
    console.error("EmailJS dispatch error:", error);
    return { success: false, error };
  }
}
