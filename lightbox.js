document.addEventListener('DOMContentLoaded', () => {
  const box = document.querySelector('#lightbox');
  if (!box) return;
  const image = box.querySelector('img');
  const caption = box.querySelector('figcaption');
  let links = [];
  let index = 0;

  function show(next) {
    index = (next + links.length) % links.length;
    const text = links[index].dataset.caption ?? links[index].querySelector('img').alt;
    image.src = links[index].href;
    image.alt = text;
    caption.textContent = text;
    box.classList.toggle('lightbox-single', links.length < 2);
  }

  // Links keep their href so images still open without JavaScript.
  document.querySelectorAll('.project-gallery a, a[data-lightbox]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const group = link.closest('.project-media');
      links = group ? [...group.querySelectorAll('.project-gallery a')] : [link];
      show(links.indexOf(link));
      box.showModal();
      document.body.style.overflow = 'hidden';
    });
  });

  box.querySelector('.lightbox-prev').addEventListener('click', () => show(index - 1));
  box.querySelector('.lightbox-next').addEventListener('click', () => show(index + 1));
  box.querySelector('.lightbox-close').addEventListener('click', () => box.close());
  box.addEventListener('close', () => { document.body.style.overflow = ''; });
  box.addEventListener('click', (event) => {
    if (event.target === box) box.close();
  });
  box.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(index - 1);
    if (event.key === 'ArrowRight') show(index + 1);
  });
});
