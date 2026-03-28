const TARIFF_API = 'https://www.centurylink.com/aboutus/legal/tariff-library/_jcr_content.tariffDBSearch';

export default async function fetchTariffSearch({ url }) {
  const jurisdiction = url.searchParams.get('jurisdiction');
  const entityType = url.searchParams.get('entityType');
  const entityName = url.searchParams.get('entityName');
  const tariffType = url.searchParams.get('tariffType');

  if (!jurisdiction || !entityType || !entityName || !tariffType) {
    return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
      status: 400,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
    });
  }

  const params = [
    `jurisdiction=${encodeURIComponent(jurisdiction)}`,
    `entityType=${encodeURIComponent(entityType)}`,
    `entityName=${encodeURIComponent(entityName)}`,
    `tariffType=${encodeURIComponent(tariffType)}`,
  ].join('.');

  const apiUrl = `${TARIFF_API}.${params}.json`;

  const resp = await fetch(apiUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });

  const body = await resp.text();

  return new Response(body, {
    status: resp.status,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'cache-control': 'public, max-age=3600',
    },
  });
}
