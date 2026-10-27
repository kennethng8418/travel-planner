"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import type { GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";
import { activityStyle } from "@/lib/activityStyle";
import type { LatLng } from "@/lib/geocode";

export interface MapStop {
  number: number;
  name: string;
  time: string;
  address?: string;
  type?: string;
  coords: LatLng | null;
}

// Free, keyless vector tiles (https://openfreemap.org). The style carries its own
// OpenFreeMap/OpenMapTiles/OpenStreetMap credits; we only add the geocoder's.
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
const ATTRIBUTION =
  'Search by <a href="https://photon.komoot.io" target="_blank">Photon</a>';
const ROUTE_SOURCE = "day-route";
// Copied into public/ by scripts/copy-maplibre-worker.mjs; the bundler can't locate it itself.
const WORKER_URL = "/maplibre/maplibre-gl-worker.mjs";

/** Pin element: category-coloured, numbered to match the timeline. */
function pinElement(stop: MapStop): HTMLElement {
  const el = document.createElement("div");
  el.className = "map-pin";
  el.style.backgroundColor = activityStyle(stop.type).color;
  el.textContent = String(stop.number);
  el.setAttribute("aria-label", `${stop.number}. ${stop.name}`);
  return el;
}

/** Popup body built with textContent — stop names come from the model, so never inject them as HTML. */
function popupContent(stop: MapStop): HTMLElement {
  const root = document.createElement("div");
  root.className = "map-popup";
  const time = document.createElement("p");
  time.className = "map-popup-time";
  time.textContent = `${stop.number} · ${stop.time}`;
  const name = document.createElement("p");
  name.className = "map-popup-name";
  name.textContent = stop.name;
  root.append(time, name);
  if (stop.address) {
    const address = document.createElement("p");
    address.className = "map-popup-address";
    address.textContent = stop.address;
    root.append(address);
  }
  return root;
}

/**
 * The selected day's stops as numbered pins joined by a dashed route, in visiting order.
 * `stops` is null while locations are loading. Hidden entirely when nothing could be placed.
 */
type PlacedStop = MapStop & { coords: LatLng };

export function DayMap({ stops }: { stops: MapStop[] | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);

  const placed = stops?.filter((s): s is PlacedStop => s.coords !== null) ?? [];
  // null while loading, so a refinement in progress keeps the current map on screen.
  const pinsKey = stops === null ? null : JSON.stringify(placed);

  useEffect(
    () => () => {
      mapRef.current?.remove();
      mapRef.current = null;
    },
    [],
  );

  // Create the map on first use, then redraw pins and route whenever the stops change.
  // MapLibre touches `window`, so it's imported on the client only.
  useEffect(() => {
    if (pinsKey === null) return;
    const pins = JSON.parse(pinsKey) as PlacedStop[];
    if (pins.length === 0) {
      // Nothing to show: the container unmounts, so drop the map with it.
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = [];
      return;
    }
    let cancelled = false;

    import("maplibre-gl").then(({ Map, Marker, Popup, LngLatBounds, NavigationControl, setWorkerUrl }) => {
      if (cancelled || !containerRef.current) return;
      let map = mapRef.current;
      if (!map) {
        setWorkerUrl(WORKER_URL);
        map = new Map({
          container: containerRef.current,
          style: STYLE_URL,
          center: [pins[0].coords.lng, pins[0].coords.lat],
          zoom: 12,
          attributionControl: { compact: true, customAttribution: ATTRIBUTION },
          // Two-finger / ctrl-scroll to move the map, so it never traps page scrolling.
          cooperativeGestures: true,
        });
        map.addControl(new NavigationControl({ showCompass: false }), "top-right");
        // MapLibre opens compact credits until the first drag, covering the bottom pins;
        // start collapsed behind the (i) button instead.
        map.once("load", () => {
          map
            ?.getContainer()
            .querySelector(".maplibregl-ctrl-attrib")
            ?.classList.remove("maplibregl-compact-show");
        });
        mapRef.current = map;
      }
      const draw = () => {
        if (!cancelled) drawStops(map, pins, markersRef, { Marker, Popup, LngLatBounds });
      };
      if (map.isStyleLoaded()) draw();
      else map.once("load", draw);
    });

    return () => {
      cancelled = true;
    };
  }, [pinsKey]);

  if (stops !== null && placed.length === 0) return null;

  const missing = stops ? stops.length - placed.length : 0;
  return (
    <figure className="mb-8 max-w-3xl">
      <div className="relative">
        <div
          ref={containerRef}
          className="h-56 overflow-hidden rounded-2xl border border-[#eadfca] bg-[#efe7dc] shadow-[0_12px_20px_rgba(10,45,60,0.05)] sm:h-72"
          aria-label="Map of today's stops"
          role="region"
        />
        {stops === null ? (
          <div
            aria-hidden
            className="absolute inset-0 animate-pulse rounded-2xl bg-[#efe7dc]/80"
          />
        ) : null}
      </div>
      {missing > 0 ? (
        <figcaption className="mt-2 text-xs text-[var(--muted)]">
          {missing === 1 ? "1 stop" : `${missing} stops`} couldn&apos;t be placed on
          the map — use the address links below.
        </figcaption>
      ) : null}
    </figure>
  );
}

/** Replaces the pins and route line, then frames every stop. */
function drawStops(
  map: MapLibreMap,
  pins: PlacedStop[],
  markersRef: { current: Marker[] },
  lib: Pick<typeof import("maplibre-gl"), "Marker" | "Popup" | "LngLatBounds">,
) {
  markersRef.current.forEach((m) => m.remove());
  markersRef.current = pins.map((stop) =>
    new lib.Marker({ element: pinElement(stop) })
      .setLngLat([stop.coords.lng, stop.coords.lat])
      .setPopup(
        new lib.Popup({ offset: 18, closeButton: false }).setDOMContent(popupContent(stop)),
      )
      .addTo(map),
  );

  const route: GeoJSON.Feature<GeoJSON.LineString> = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: pins.map((s) => [s.coords.lng, s.coords.lat]),
    },
  };
  const source = map.getSource<GeoJSONSource>(ROUTE_SOURCE);
  if (source) {
    source.setData(route);
  } else {
    map.addSource(ROUTE_SOURCE, { type: "geojson", data: route });
    map.addLayer({
      id: ROUTE_SOURCE,
      type: "line",
      source: ROUTE_SOURCE,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#0b8199",
        "line-width": 2.5,
        "line-opacity": 0.75,
        "line-dasharray": [1.5, 1.5],
      },
    });
  }

  if (pins.length === 1) {
    map.jumpTo({ center: [pins[0].coords.lng, pins[0].coords.lat], zoom: 14 });
  } else {
    const bounds = new lib.LngLatBounds();
    pins.forEach((s) => bounds.extend([s.coords.lng, s.coords.lat]));
    map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 600 });
  }
}
