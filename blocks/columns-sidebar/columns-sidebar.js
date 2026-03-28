export default function init(el) {
  // Add layout class to parent section for two-column grid
  const section = el.closest('.section');
  if (section) {
    section.classList.add('has-sidebar');
  }

  const row = el.querySelector(':scope > div');
  if (!row) return;

  // Consolidate all links into a single list
  const links = el.querySelectorAll('a');
  const heading = el.querySelector('h2');
  if (!links.length) return;

  const list = document.createElement('ul');
  list.classList.add('sidebar-links');

  links.forEach((link) => {
    const li = document.createElement('li');
    const a = link.cloneNode(true);
    li.append(a);
    list.append(li);
  });

  // Replace content with heading + consolidated list
  const content = document.createElement('div');
  content.classList.add('sidebar-content');
  if (heading) {
    heading.classList.add('sidebar-heading');
    content.append(heading);
  }
  content.append(list);

  el.textContent = '';
  el.append(content);
}
