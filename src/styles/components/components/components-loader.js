async function loadComponent(url, selector) {
  const res = await fetch(url);
  const html = await res.text();
  document.querySelector(selector).innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
  loadComponent('/components/header.html', '#site-header');
  loadComponent('/components/footer.html', '#site-footer');
});
