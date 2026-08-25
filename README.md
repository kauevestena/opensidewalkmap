# OSWM — OpenSidewalkMap

OpenSidewalkMap is an open-source, fully static project for publishing and
exploring pedestrian-network data derived from OpenStreetMap. The project is
modular and decentralized: each city or region has an independent OSWM node,
while every node uses the shared [`oswm_codebase`](https://github.com/kauevestena/oswm_codebase).

This repository hosts the project landing page and the global node index at
<https://kauevestena.github.io/opensidewalkmap/>.

## Architecture

The index is a zero-build static MapLibre application:

- `index.html` provides the global map and searchable node directory;
- `assets/index-map.js` loads the registry and renders the MapLibre map;
- `assets/site.css` is the shared responsive design system for the index and
  About pages;
- `data/cities_data.csv` is the canonical node registry;
- `about.html` explains the project, modules and open-data pipeline.

No generated map HTML, Folium, Python runtime, jQuery or Bootstrap is required.

## Add or update a node

Edit `data/cities_data.csv` using this schema:

```csv
city_name,center_long,center_lat,url
Milan,9.1594985,45.46129315,https://opensidewalkmap.github.io/milan/
```

The browser reads the registry directly, so the updated marker appears as soon
as GitHub Pages publishes the commit. Node URLs must use HTTPS and end with a
trailing slash.

## Local preview

Serve the repository with any static HTTP server; opening `index.html` directly
will not allow the browser to fetch the CSV registry. For example:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000/>.

## Validation

The `site_checks` workflow validates JavaScript syntax, the CSV schema,
coordinates, URLs, duplicates and the removal of legacy Folium/Leaflet
dependencies. Run the same checks locally with:

```bash
node --check assets/index-map.js
node tests/site_checks.mjs
```

The one-repository-per-city model was inspired by the
[EqualStreetNames](https://equalstreetnames.org/) project.
