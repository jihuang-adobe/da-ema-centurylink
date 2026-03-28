export default function init(el) {
  const link = el.querySelector('a[href]');
  if (!link) return;

  const url = link.href;
  const wrapper = document.createElement('div');
  wrapper.classList.add('embed-tariff-search-wrapper');

  const heading = document.createElement('p');
  heading.classList.add('embed-tariff-search-label');
  heading.textContent = 'Search the tariff database by jurisdiction, entity, and tariff type.';

  const btn = document.createElement('a');
  btn.href = url;
  btn.target = '_blank';
  btn.rel = 'noopener noreferrer';
  btn.classList.add('embed-tariff-search-btn');
  btn.textContent = 'Open Tariff Search';

  wrapper.append(heading, btn);
  el.textContent = '';
  el.append(wrapper);
}
