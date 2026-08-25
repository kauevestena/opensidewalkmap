'use strict';

import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.6.0/dist/maplibre-gl.mjs';

const REGISTRY_URL = 'data/cities_data.csv';
const SOURCE_ID = 'oswm-nodes';
const POINT_LAYER_ID = 'oswm-node-points';
const GLOW_LAYER_ID = 'oswm-node-glow';

const state = {
  nodes: [],
  selectedId: null,
  map: null,
  popup: null,
};

const elements = {
  count: document.getElementById('node-count'),
  feedback: document.getElementById('node-feedback'),
  list: document.getElementById('node-list'),
  search: document.getElementById('node-search'),
  clear: document.getElementById('clear-search'),
  mapError: document.getElementById('map-error'),
};

function parseCsvLine(line) {
  const values = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && quoted && nextCharacter === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      values.push(value.trim());
      value = '';
    } else {
      value += character;
    }
  }

  values.push(value.trim());
  return values;
}

function parseRegistry(csv) {
  const lines = csv.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const required = ['city_name', 'center_long', 'center_lat', 'url'];
  if (!required.every((header) => headers.includes(header))) {
    throw new Error('The node registry does not have the expected columns.');
  }

  return lines.slice(1).map((line, rowIndex) => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    const longitude = Number(row.center_long);
    const latitude = Number(row.center_lat);

    if (!row.city_name || !Number.isFinite(longitude) || !Number.isFinite(latitude) || !row.url) {
      throw new Error(`Invalid node registry entry on row ${rowIndex + 2}.`);
    }

    return {
      id: `${row.city_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${rowIndex}`,
      name: row.city_name,
      longitude,
      latitude,
      url: row.url,
    };
  }).sort((first, second) => first.name.localeCompare(second.name));
}

function toFeatureCollection(nodes) {
  return {
    type: 'FeatureCollection',
    features: nodes.map((node) => ({
      type: 'Feature',
      id: node.id,
      geometry: {
        type: 'Point',
        coordinates: [node.longitude, node.latitude],
      },
      properties: {
        id: node.id,
        city_name: node.name,
        url: node.url,
      },
    })),
  };
}

function setFeedback(message, isError = false) {
  elements.feedback.textContent = message;
  elements.feedback.classList.toggle('node-feedback--error', isError);
}

function createNodeCard(node) {
  const card = document.createElement('article');
  card.className = 'node-card';
  card.dataset.nodeId = node.id;
  card.dataset.selected = String(node.id === state.selectedId);
  card.setAttribute('role', 'listitem');

  const selectButton = document.createElement('button');
  selectButton.className = 'node-card__select';
  selectButton.type = 'button';
  selectButton.setAttribute('aria-label', `Locate ${node.name} on the map`);
  selectButton.setAttribute('aria-current', String(node.id === state.selectedId));
  selectButton.addEventListener('click', () => selectNode(node.id, { moveMap: true, openPopup: true }));

  const marker = document.createElement('span');
  marker.className = 'node-card__marker';
  marker.setAttribute('aria-hidden', 'true');

  const copy = document.createElement('span');
  copy.className = 'node-card__copy';

  const name = document.createElement('strong');
  name.textContent = node.name;

  const coordinates = document.createElement('span');
  coordinates.textContent = `${node.latitude.toFixed(3)}, ${node.longitude.toFixed(3)}`;

  copy.append(name, coordinates);
  selectButton.append(marker, copy);

  const openLink = document.createElement('a');
  openLink.className = 'node-card__open';
  openLink.href = node.url;
  openLink.setAttribute('aria-label', `Open the ${node.name} node`);
  openLink.title = `Open ${node.name}`;
  openLink.textContent = '↗';

  card.append(selectButton, openLink);
  return card;
}

function renderNodes(nodes) {
  elements.list.replaceChildren(...nodes.map(createNodeCard));
  setFeedback(nodes.length === state.nodes.length
    ? `${nodes.length} ${nodes.length === 1 ? 'city' : 'cities'} available`
    : `${nodes.length} matching ${nodes.length === 1 ? 'city' : 'cities'}`);

  if (!nodes.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No city matches that search yet.';
    elements.list.append(empty);
  }
}

function filterNodes() {
  const query = elements.search.value.trim().toLocaleLowerCase();
  elements.clear.hidden = !query;
  const filtered = query
    ? state.nodes.filter((node) => node.name.toLocaleLowerCase().includes(query))
    : state.nodes;
  renderNodes(filtered);
}

function popupContent(node) {
  const wrapper = document.createElement('div');
  wrapper.className = 'popup-card';

  const overline = document.createElement('p');
  overline.className = 'overline';
  overline.textContent = 'OpenSidewalkMap node';

  const heading = document.createElement('h2');
  heading.textContent = node.name;

  const link = document.createElement('a');
  link.href = node.url;
  link.textContent = 'Open city portal →';

  wrapper.append(overline, heading, link);
  return wrapper;
}

function selectNode(id, options = {}) {
  const node = state.nodes.find((candidate) => candidate.id === id);
  if (!node) return;

  if (state.map && state.selectedId && state.map.getSource(SOURCE_ID)) {
    state.map.setFeatureState({ source: SOURCE_ID, id: state.selectedId }, { selected: false });
  }

  state.selectedId = id;

  if (state.map && state.map.getSource(SOURCE_ID)) {
    state.map.setFeatureState({ source: SOURCE_ID, id }, { selected: true });

    if (options.moveMap) {
      state.map.flyTo({
        center: [node.longitude, node.latitude],
        zoom: Math.max(state.map.getZoom(), 4.4),
        duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 900,
        essential: true,
      });
    }

    if (options.openPopup) {
      if (state.popup) state.popup.remove();
      state.popup = new maplibregl.Popup({ className: 'node-popup', offset: 18, closeButton: true })
        .setLngLat([node.longitude, node.latitude])
        .setDOMContent(popupContent(node))
        .addTo(state.map);
    }
  }

  document.querySelectorAll('.node-card').forEach((card) => {
    const selected = card.dataset.nodeId === id;
    card.dataset.selected = String(selected);
    card.querySelector('.node-card__select')?.setAttribute('aria-current', String(selected));
  });

  if (options.scrollCard) {
    document.querySelector(`[data-node-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'nearest' });
  }
}

function fitAllNodes() {
  if (!state.map || !state.nodes.length) return;
  const bounds = new maplibregl.LngLatBounds();
  state.nodes.forEach((node) => bounds.extend([node.longitude, node.latitude]));
  const mobile = window.matchMedia('(max-width: 680px)').matches;
  state.map.fitBounds(bounds, {
    padding: mobile
      ? { top: 95, right: 35, bottom: Math.min(window.innerHeight * 0.7, 630), left: 35 }
      : { top: 125, right: 100, bottom: 85, left: 490 },
    maxZoom: 3.8,
    duration: 0,
  });
}

function initializeMap() {
  try {
    if (!maplibregl.supported()) {
      throw new Error('WebGL is unavailable.');
    }

    state.map = new maplibregl.Map({
      container: 'map',
      center: [-28, 8],
      zoom: 1.25,
      minZoom: 1,
      maxZoom: 16,
      attributionControl: false,
      style: {
        version: 8,
        sources: {
          'carto-dark': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
            ],
            tileSize: 512,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          },
        },
        layers: [{ id: 'carto-dark', type: 'raster', source: 'carto-dark', paint: { 'raster-opacity': 0.82 } }],
      },
    });

    state.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    state.map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    state.map.on('load', () => {
      state.map.addSource(SOURCE_ID, { type: 'geojson', data: toFeatureCollection(state.nodes) });

      state.map.addLayer({
        id: GLOW_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-radius': ['case', ['boolean', ['feature-state', 'selected'], false], 23, 16],
          'circle-color': '#7cf29a',
          'circle-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 0.28, 0.15],
          'circle-blur': 0.65,
        },
      });

      state.map.addLayer({
        id: POINT_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-radius': ['case', ['boolean', ['feature-state', 'selected'], false], 9, 7],
          'circle-color': ['case', ['boolean', ['feature-state', 'selected'], false], '#f9d66b', '#7cf29a'],
          'circle-stroke-color': '#08111f',
          'circle-stroke-width': 3,
        },
      });

      state.map.on('mouseenter', POINT_LAYER_ID, () => { state.map.getCanvas().style.cursor = 'pointer'; });
      state.map.on('mouseleave', POINT_LAYER_ID, () => { state.map.getCanvas().style.cursor = ''; });
      state.map.on('click', POINT_LAYER_ID, (event) => {
        const feature = event.features?.[0];
        if (feature?.properties?.id) {
          selectNode(feature.properties.id, { moveMap: false, openPopup: true, scrollCard: true });
        }
      });

      fitAllNodes();
    });
  } catch (error) {
    console.warn('MapLibre could not initialize:', error);
    elements.mapError.hidden = false;
    document.body.classList.add('map-unavailable');
  }
}

async function initialize() {
  try {
    const response = await fetch(REGISTRY_URL);
    if (!response.ok) throw new Error(`Registry request returned HTTP ${response.status}.`);
    state.nodes = parseRegistry(await response.text());
    elements.count.textContent = String(state.nodes.length);
    renderNodes(state.nodes);
    initializeMap();
  } catch (error) {
    console.error(error);
    elements.count.textContent = '0';
    setFeedback('The node registry could not be loaded. Please try again later.', true);
  }
}

elements.search.addEventListener('input', filterNodes);
elements.search.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    const firstMatch = elements.list.querySelector('.node-card__select');
    if (firstMatch) firstMatch.click();
  }
});
elements.clear.addEventListener('click', () => {
  elements.search.value = '';
  elements.search.focus();
  filterNodes();
});

initialize();
