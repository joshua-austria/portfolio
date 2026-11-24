// Stop the submit when the captcha is not done, so visitors stay here instead of landing on Web3Forms' error page.
document.querySelector('.contact-form')?.addEventListener('submit', (event) => {
  const captcha = event.target.querySelector('[name="h-captcha-response"]');
  const missing = Boolean(captcha) && !captcha.value;
  document.querySelector('#captcha-error').hidden = !missing;
  if (missing) event.preventDefault();
});
