import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');

const csv = read('data/cities_data.csv').trim().split(/\r?\n/);
assert.deepEqual(csv[0].split(','), ['city_name', 'center_long', 'center_lat', 'url']);

const names = new Set();
const urls = new Set();

for (const [index, line] of csv.slice(1).entries()) {
  const [name, rawLongitude, rawLatitude, url] = line.split(',');
  const longitude = Number(rawLongitude);
  const latitude = Number(rawLatitude);

  assert.ok(name, `Row ${index + 2} must have a city name`);
  assert.ok(Number.isFinite(longitude) && longitude >= -180 && longitude <= 180,
    `Row ${index + 2} must have a valid longitude`);
  assert.ok(Number.isFinite(latitude) && latitude >= -90 && latitude <= 90,
    `Row ${index + 2} must have a valid latitude`);
  assert.match(url, /^https:\/\/.+\/$/, `Row ${index + 2} must use an absolute HTTPS URL ending in /`);
  assert.ok(!names.has(name.toLocaleLowerCase()), `Duplicate city name: ${name}`);
  assert.ok(!urls.has(url), `Duplicate node URL: ${url}`);
  names.add(name.toLocaleLowerCase());
  urls.add(url);
}

const indexHtml = read('index.html');
const aboutHtml = read('about.html');
const mapScript = read('assets/index-map.js');
const siteCss = read('assets/site.css');
const activeSite = `${indexHtml}\n${aboutHtml}\n${mapScript}\n${siteCss}`.toLocaleLowerCase();

assert.match(indexHtml, /assets\/index-map\.js/, 'The index must load the map application');
assert.match(indexHtml, /<details class="node-panel" id="node-directory">/,
  'The node panel must use a native disclosure that is collapsed by default');
assert.match(indexHtml, /Expand to search/, 'The collapsed node panel must include its search hint');
assert.match(mapScript, /data\/cities_data\.csv/, 'The map application must use the node registry');
assert.match(mapScript, /maplibre-gl@6\.6\.0\/dist\/maplibre-gl\.mjs/,
  'The map application must pin the MapLibre GL JS 6.6.0 ES module');
assert.doesNotMatch(mapScript, /maplibregl\.supported\(/,
  'The map application must not call the removed MapLibre v5 supported() API');
assert.match(siteCss, /\.map-error\[hidden\]\s*{[^}]*display:\s*none/s,
  'The map error must stay hidden unless map initialization fails');
assert.match(aboutHtml, /class="about-page"/, 'The About page must use the shared design system');
assert.doesNotMatch(activeSite, /folium|leaflet|jquery|bootstrap/, 'Legacy Folium/Leaflet dependencies must not remain in the active site');

assert.match(mapScript, /https:\/\/tiles\.openfreemap\.org\/styles\/dark/,
  'The index map must use the OpenFreeMap dark style');
assert.doesNotMatch(mapScript, /cartocdn|carto-dark/i,
  'The former CARTO basemap must not remain in the index map');

console.log(`Validated ${csv.length - 1} OSWM nodes and the static MapLibre site.`);
