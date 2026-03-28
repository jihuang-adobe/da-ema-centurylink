const PROXY_API = '/api/tariff-search';
const FALLBACK_URL = 'https://www.centurylink.com/aboutus/legal/tariff-library.html#tariff-search';
const RESULTS_PER_PAGE = 25;

function parseEntries(data) {
  return data.map((entry) => {
    const [jurisdiction, entityType, entityName, tariffType] = entry.split('|');
    return { jurisdiction, entityType, entityName, tariffType };
  });
}

function getUnique(entries, field, filters = {}) {
  return [...new Set(
    entries
      .filter((e) => Object.entries(filters).every(([k, v]) => e[k] === v))
      .map((e) => e[field]),
  )].sort();
}

function createSelect(name) {
  const field = document.createElement('div');
  field.classList.add('tariff-search-field');
  const label = document.createElement('label');
  label.textContent = name;
  const id = `tariff-${name.toLowerCase().replace(/\s+/g, '-')}`;
  label.setAttribute('for', id);
  const select = document.createElement('select');
  select.id = id;
  select.innerHTML = `<option value="">--Select ${name}--</option>`;
  field.append(label, select);
  return { field, select };
}

function populateSelect(select, values) {
  const ph = select.querySelector('option')?.textContent || '';
  select.innerHTML = `<option value="">${ph}</option>`;
  values.forEach((v) => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    select.append(opt);
  });
}

function renderResults(container, results, currentPage) {
  container.innerHTML = '';
  if (!results || !results.length) {
    container.innerHTML = '<p class="tariff-no-results">No results found.</p>';
    return;
  }
  const total = results.length;
  const totalPages = Math.ceil(total / RESULTS_PER_PAGE);
  const start = (currentPage - 1) * RESULTS_PER_PAGE;
  const end = Math.min(start + RESULTS_PER_PAGE, total);
  const pageResults = results.slice(start, end);

  const info = document.createElement('p');
  info.classList.add('tariff-results-info');
  info.textContent = `Showing ${start + 1}\u2013${end} of ${total} results`;
  container.append(info);

  const tableWrap = document.createElement('div');
  tableWrap.classList.add('tariff-table-wrap');
  const table = document.createElement('table');
  table.classList.add('tariff-results-table');
  table.innerHTML = `<thead><tr>
    <th>Document</th><th>Jurisdiction</th><th>Entity Type</th>
    <th>Entity Name</th><th>Tariff Type</th><th>Summary</th>
  </tr></thead>`;
  const tbody = document.createElement('tbody');
  pageResults.forEach((r) => {
    const tr = document.createElement('tr');
    const docLink = r.assetPath
      ? `<a href="https://www.centurylink.com${r.assetPath}" target="_blank" rel="noopener noreferrer">${r.asset || 'View'}</a>`
      : (r.asset || '');
    tr.innerHTML = `<td class="tariff-results-link">${docLink}</td>
      <td>${r.jurisdiction || ''}</td><td>${r.entityType || ''}</td>
      <td>${r.entityName || ''}</td><td>${r.tariffType || ''}</td>
      <td>${r.summary || ''}</td>`;
    tbody.append(tr);
  });
  table.append(tbody);
  tableWrap.append(table);
  container.append(tableWrap);

  if (totalPages > 1) {
    const pag = document.createElement('div');
    pag.classList.add('tariff-results-pagination');
    const prev = document.createElement('button');
    prev.classList.add('tariff-page-btn');
    prev.textContent = 'Previous';
    prev.disabled = currentPage === 1;
    prev.addEventListener('click', () => renderResults(container, results, currentPage - 1));
    const pi = document.createElement('span');
    pi.classList.add('tariff-page-info');
    pi.textContent = `Page ${currentPage} of ${totalPages}`;
    const next = document.createElement('button');
    next.classList.add('tariff-page-btn');
    next.textContent = 'Next';
    next.disabled = currentPage === totalPages;
    next.addEventListener('click', () => renderResults(container, results, currentPage + 1));
    pag.append(prev, pi, next);
    container.append(pag);
  }
}

export default async function init(el) {
  let entries;
  let resultsDB;
  try {
    const entryResp = await fetch('/blocks/embed-tariff-search/tariff-data.json');
    entries = parseEntries(await entryResp.json());
  } catch {
    el.innerHTML = '<p class="tariff-search-error">Failed to load tariff data.</p>';
    return;
  }

  try {
    const resultsResp = await fetch('/blocks/embed-tariff-search/tariff-results.json');
    resultsDB = await resultsResp.json();
  } catch {
    resultsDB = null;
  }

  el.textContent = '';
  const form = document.createElement('div');
  form.classList.add('tariff-search-form');

  const fields = document.createElement('div');
  fields.classList.add('tariff-search-fields');

  const jur = createSelect('Jurisdiction');
  const ent = createSelect('Entity Type');
  const nam = createSelect('Entity Name');
  const tar = createSelect('Tariff Type');
  fields.append(jur.field, ent.field, nam.field, tar.field);

  const actions = document.createElement('div');
  actions.classList.add('tariff-search-actions');
  const searchBtn = document.createElement('button');
  searchBtn.classList.add('tariff-search-btn');
  searchBtn.textContent = 'Search';
  searchBtn.disabled = true;
  const resetBtn = document.createElement('button');
  resetBtn.classList.add('tariff-reset-btn');
  resetBtn.textContent = 'Reset';
  actions.append(searchBtn, resetBtn);

  form.append(fields, actions);
  const resultsContainer = document.createElement('div');
  resultsContainer.classList.add('tariff-search-results');
  el.append(form, resultsContainer);

  populateSelect(jur.select, getUnique(entries, 'jurisdiction'));

  function updateSearchBtn() {
    searchBtn.disabled = !(jur.select.value && ent.select.value
      && nam.select.value && tar.select.value);
  }

  jur.select.addEventListener('change', () => {
    populateSelect(ent.select, jur.select.value
      ? getUnique(entries, 'entityType', { jurisdiction: jur.select.value }) : []);
    ent.select.value = '';
    populateSelect(nam.select, []);
    populateSelect(tar.select, []);
    updateSearchBtn();
  });

  ent.select.addEventListener('change', () => {
    populateSelect(nam.select, ent.select.value
      ? getUnique(entries, 'entityName', {
        jurisdiction: jur.select.value,
        entityType: ent.select.value,
      }) : []);
    nam.select.value = '';
    populateSelect(tar.select, []);
    updateSearchBtn();
  });

  nam.select.addEventListener('change', () => {
    populateSelect(tar.select, nam.select.value
      ? getUnique(entries, 'tariffType', {
        jurisdiction: jur.select.value,
        entityType: ent.select.value,
        entityName: nam.select.value,
      }) : []);
    tar.select.value = '';
    updateSearchBtn();
  });

  tar.select.addEventListener('change', updateSearchBtn);

  searchBtn.addEventListener('click', async () => {
    searchBtn.disabled = true;
    searchBtn.textContent = 'Searching\u2026';
    resultsContainer.innerHTML = '';

    const params = {
      jurisdiction: jur.select.value,
      entityType: ent.select.value,
      entityName: nam.select.value,
      tariffType: tar.select.value,
    };

    // Try proxy first, then local data, then redirect to CenturyLink
    let results;
    try {
      const qs = new URLSearchParams(params).toString();
      const resp = await fetch(`${PROXY_API}?${qs}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      results = data.queryResultJson || [];
    } catch {
      if (resultsDB) {
        const key = Object.values(params).join('|');
        results = resultsDB[key] || [];
      } else {
        window.open(FALLBACK_URL, '_blank', 'noopener,noreferrer');
        searchBtn.textContent = 'Search';
        updateSearchBtn();
        return;
      }
    }

    renderResults(resultsContainer, results, 1);
    searchBtn.textContent = 'Search';
    updateSearchBtn();
  });

  resetBtn.addEventListener('click', () => {
    jur.select.value = '';
    populateSelect(ent.select, []);
    populateSelect(nam.select, []);
    populateSelect(tar.select, []);
    searchBtn.disabled = true;
    resultsContainer.innerHTML = '';
  });
}
