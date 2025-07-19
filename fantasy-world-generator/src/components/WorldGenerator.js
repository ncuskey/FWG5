import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { voronoi } from 'd3-voronoi';
import './WorldGenerator.css';

// Add Array.prototype.random helper
if (!Array.prototype.random) {
  Object.defineProperty(Array.prototype, 'random', {
    value: function() {
      return this[Math.floor(Math.random() * this.length)];
    },
    enumerable: false
  });
}

// ---------- New generateHeightmap function ----------
/**
 * Spread height values in “blobs” using a BFS queue.
 * @param {Array<Cell>} polygons – array of cells, each with a .neighbors array.
 * @param {object} options
 * @param {number} options.mainPeak    – starting height for blob #0 (0–1)
 * @param {number} options.radius      – fall‑off factor per ring (e.g. 0.8)
 * @param {number} options.sharpness   – randomness (0 = smooth; >0 adds ±modulation)
 * @param {number} options.blobCount   – how many blobs to plant
 * @param {number} options.seaLevel    – sea level threshold
 * @param {object} diagram             – voronoi diagram
 */
export function generateHeightmap(polygons, diagram, { mainPeak, radius, sharpness, blobCount, seaLevel }) {
  // 1. Reset heights and flags
  polygons.forEach(p => {
    p.height = 0;
    p._used = false;
  });

  // 2. Blob seeding: just pick random indices (all are now safe due to margin)
  let lastSeeds = [];
  for (let b = 0; b < blobCount; b++) {
    let startIndex;
    if (b === 0) {
      startIndex = Math.floor(Math.random() * polygons.length);
    } else {
      const parent = lastSeeds.random();
      const nbrs = polygons[parent].neighbors;
      startIndex = nbrs.length ? nbrs.random() : Math.floor(Math.random() * polygons.length);
    }
    lastSeeds.push(startIndex);

    const initialH = b === 0
      ? mainPeak
      : mainPeak * Math.pow(radius, b);

    // Initialize BFS queue
    const queue = [{ idx: startIndex, h: initialH }];
    polygons[startIndex].height = initialH;
    polygons[startIndex]._used = true;

    // Spread until tiny
    while (queue.length) {
      const { idx, h } = queue.shift();
      if (h < 0.01) continue;

      // Spread to neighbors
      polygons[idx].neighbors.forEach(ni => {
        const cell = polygons[ni];
        if (cell._used) return;

        // random modulation around 1 ± sharpness
        const mod = sharpness === 0
          ? 1
          : 1 + (Math.random() * 2 - 1) * sharpness;

        const nextH = h * radius * mod;
        if (nextH < 0.01) return;

        // accumulate and cap at 1
        cell.height = Math.min(1, cell.height + nextH);
        cell._used = true;
        queue.push({ idx: ni, h: nextH });
      });
    }

    // Reset flags for next blob
    polygons.forEach(p => { p._used = false; });
  }
}

const WorldGenerator = () => {
  const svgRef = useRef();
  const [debugInfo, setDebugInfo] = useState({ cell: 0, height: 0, feature: 'no' });
  const [settings, setSettings] = useState({
    pointsRadius: 4,
    maxHeight: 0.9,
    blobRadius: 0.9,
    blobSharpness: 0.2,
    blobCount: 3,
    seaLevel: 0.2,
    blur: 0,
    showGrid: false,
    drawSeaPolygons: false
  });
  // Map size constants
  const mapWidth = 960;
  const mapHeight = 540;
  const [sampleWarning, setSampleWarning] = useState("");

  // Poisson-disc sampling algorithm
  const poissonDiscSampler = (width, height, radius) => {
    const k = 30;
    const radius2 = radius * radius;
    const R = 3 * radius2;
    const cellSize = radius * Math.SQRT1_2;
    const gridWidth = Math.ceil(width / cellSize);
    const gridHeight = Math.ceil(height / cellSize);
    const grid = new Array(gridWidth * gridHeight);
    const queue = [];
    let queueSize = 0;
    let sampleSize = 0;

    return function() {
      if (!sampleSize) return sample(Math.random() * width, Math.random() * height);

      while (queueSize) {
        const i = Math.random() * queueSize | 0;
        const s = queue[i];

        for (let j = 0; j < k; ++j) {
          const a = 2 * Math.PI * Math.random();
          const r = Math.sqrt(Math.random() * R + radius2);
          const x = s[0] + r * Math.cos(a);
          const y = s[1] + r * Math.sin(a);

          if (0 <= x && x < width && 0 <= y && y < height && far(x, y)) {
            return sample(x, y);
          }
        }

        queue[i] = queue[--queueSize];
        queue.length = queueSize;
      }
    };

    function far(x, y) {
      const i = x / cellSize | 0;
      const j = y / cellSize | 0;
      const i0 = Math.max(i - 2, 0);
      const j0 = Math.max(j - 2, 0);
      const i1 = Math.min(i + 3, gridWidth);
      const j1 = Math.min(j + 3, gridHeight);

      for (let j = j0; j < j1; ++j) {
        const o = j * gridWidth;
        for (let i = i0; i < i1; ++i) {
          const s = grid[o + i];
          if (s) {
            const dx = s[0] - x;
            const dy = s[1] - y;
            if (dx * dx + dy * dy < radius2) return false;
          }
        }
      }
      return true;
    }

    function sample(x, y) {
      const s = [x, y];
      queue.push(s);
      grid[gridWidth * (y / cellSize | 0) + (x / cellSize | 0)] = s;
      ++sampleSize;
      ++queueSize;
      return s;
    }
  };

  // Bounded Poisson-disc sampler
  function boundedSampler(w, h, r, margin) {
    if (margin * 2 >= w || margin * 2 >= h) {
      const msg = 'Margin too large for map size/settings: no valid area for blob centers.';
      console.warn(msg);
      setSampleWarning(msg);
      return () => null;
    }
    const sampler = poissonDiscSampler(w, h, r);
    return () => {
      let p;
      let attempts = 0;
      const maxAttempts = 1000;
      do {
        p = sampler();
        attempts++;
        if (attempts > maxAttempts) {
          const msg = `Could not find a valid sample after ${maxAttempts} attempts. Try lowering blob count, max height, or points radius.`;
          console.warn(msg);
          setSampleWarning(msg);
          return null;
        }
      } while (
        !p ||
        p[0] < margin || p[0] > w - margin ||
        p[1] < margin || p[1] > h - margin
      );
      return p;
    };
  }


  // Detect neighbors for each polygon
  const detectNeighbors = (polygons, diagram) => {
    polygons.forEach((polygon, index) => {
      polygon.index = index;
      polygon.height = 0;
      const neighbors = [];
      
      diagram.cells[index].halfedges.forEach((e) => {
        const edge = diagram.edges[e];
        if (edge.left && edge.right) {
          let ea = edge.left.index;
          if (ea === index) {
            ea = edge.right.index;
          }
          neighbors.push(ea);
        }
      });
      polygon.neighbors = neighbors;
    });
  };

  // Mark geographic features (ocean, lakes, islands)
  const markFeatures = (polygons, diagram) => {
    const queue = [];
    const used = [];
    
    // Define ocean cells
    const start = diagram.find(0, 0).index;
    queue.push(start);
    used.push(start);
    let type = "Ocean";
    let name;
    
    if (polygons[start].featureType) {
      name = polygons[start].featureName;
    } else {
      name = getRandomAdjective();
    }
    
    polygons[start].featureType = type;
    polygons[start].featureName = name;
    
    while (queue.length > 0) {
      const i = queue[0];
      queue.shift();
      polygons[i].neighbors.forEach((e) => {
        if (used.indexOf(e) < 0 && polygons[e].height < 0.2) {
          polygons[e].featureType = type;
          polygons[e].featureName = name;
          queue.push(e);
          used.push(e);
        }
      });
    }
    
    // Define islands and lakes
    let island = 0;
    let lake = 0;
    let number = 0;
    let greater = 0;
    let less = 0;
    
    const unmarked = polygons.filter(e => !e.featureType);
    
    while (unmarked.length > 0) {
      if (unmarked[0].height >= 0.2) {
        type = "Island";
        number = island;
        island += 1;
        greater = 0.2;
        less = 100; // just to omit exclusion
      } else {
        type = "Lake";
        number = lake;
        lake += 1;
        greater = -100; // just to omit exclusion
        less = 0.2;
      }
      
      name = getRandomAdjective();
      const start = unmarked[0].index;
      polygons[start].featureType = type;
      polygons[start].featureName = name;
      polygons[start].featureNumber = number;
      
      queue.push(start);
      used.push(start);
      
      while (queue.length > 0) {
        const i = queue[0];
        queue.shift();
        polygons[i].neighbors.forEach((e) => {
          if (used.indexOf(e) < 0 && polygons[e].height >= greater && polygons[e].height < less) {
            polygons[e].featureType = type;
            polygons[e].featureName = name;
            polygons[e].featureNumber = number;
            queue.push(e);
            used.push(e);
          }
        });
      }
      
      unmarked.splice(0, 1);
    }
  };

  // Get random adjective for naming features
  const getRandomAdjective = () => {
    const adjectives = [
      "Ablaze", "Ablazing", "Accented", "Ashen", "Ashy", "Beaming", "Bi-Color", "Blazing",
      "Bleached", "Bleak", "Blended", "Blotchy", "Bold", "Brash", "Bright", "Brilliant",
      "Burnt", "Checkered", "Chromatic", "Classic", "Clean", "Colored", "Colorful",
      "Colorless", "Complementing", "Contrasting", "Cool", "Coordinating", "Crisp",
      "Dappled", "Dark", "Dayglo", "Deep", "Delicate", "Digital", "Dim", "Dirty",
      "Discolored", "Dotted", "Drab", "Dreary", "Dull", "Dusty", "Earth", "Electric",
      "Eye-Catching", "Faded", "Faint", "Festive", "Fiery", "Flashy", "Flattering",
      "Flecked", "Florescent", "Frosty", "Full-Toned", "Glistening", "Glittering",
      "Glowing", "Harsh", "Hazy", "Hot", "Hued", "Icy", "Illuminated", "Incandescent",
      "Intense", "Interwoven", "Iridescent", "Kaleidoscopic", "Lambent", "Light",
      "Loud", "Luminous", "Lusterless", "Lustrous", "Majestic", "Marbled", "Matte",
      "Medium", "Mellow", "Milky", "Mingled", "Mixed", "Monochromatic", "Motley",
      "Mottled", "Muddy", "Multicolored", "Multihued", "Murky", "Natural", "Neutral",
      "Opalescent", "Opaque", "Pale", "Pastel", "Patchwork", "Patchy", "Patterned",
      "Perfect", "Picturesque", "Plain", "Primary", "Prismatic", "Psychedelic",
      "Pure", "Radiant", "Reflective", "Rich", "Royal", "Ruddy", "Rustic", "Satiny",
      "Saturated", "Secondary", "Shaded", "Sheer", "Shining", "Shiny", "Shocking",
      "Showy", "Smoky", "Soft", "Solid", "Somber", "Soothing", "Sooty", "Sparkling",
      "Speckled", "Stained", "Streaked", "Streaky", "Striking", "Strong Neutral",
      "Subtle", "Sunny", "Swirling", "Tinged", "Tinted", "Tonal", "Toned",
      "Translucent", "Transparent", "Two-Tone", "Undiluted", "Uneven", "Uniform",
      "Vibrant", "Vivid", "Wan", "Warm", "Washed-Out", "Waxen", "Wild"
    ];
    return adjectives[Math.floor(Math.random() * adjectives.length)];
  };

  // Generate the world
  const generateWorld = (count = 0) => {
    setSampleWarning(""); // clear warning on new map
    const svg = d3.select(svgRef.current);
    
    // Clear previous content
    svg.selectAll("*").remove();
    
    // Create SVG groups
    const defs = svg.append("defs");
    const viewbox = svg.append("g").attr("class", "viewbox");
    // 1) draw ocean background first
    const oceanLayer = viewbox.append("g").attr("class", "oceanLayer");
    oceanLayer.append("rect")
      .attr("x", 0).attr("y", 0)
      .attr("width", mapWidth).attr("height", mapHeight);
    // 2) now draw land and outlines
    const islandBack = viewbox.append("g").attr("class", "islandBack");
    const mapCells = viewbox.append("g").attr("class", "mapCells");
    const coastline = viewbox.append("g").attr("class", "coastline");
    const shallow = viewbox.append("g").attr("class", "shallow");
    const lakecoast = viewbox.append("g").attr("class", "lakecoast");
    
    // Add filters and patterns
    defs.append("filter")
      .attr("id", "blurFilter")
      .attr("x", "-1")
      .attr("y", "-1")
      .attr("width", "100")
      .attr("height", "100")
      .append("feGaussianBlur")
      .attr("in", "SourceGraphic")
      .attr("stdDeviation", "1");
    
    defs.append("mask")
      .attr("id", "shape")
      .append("rect")
      .attr("x", "0")
      .attr("y", "0")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "white");
    
    defs.append("pattern")
      .attr("id", "shallowHatch")
      .attr("width", "2")
      .attr("height", "4")
      .attr("patternTransform", "rotate(90 0 0)")
      .attr("patternUnits", "userSpaceOnUse")
      .append("line")
      .attr("x1", "0")
      .attr("y1", "0")
      .attr("x2", "0")
      .attr("y2", "4")
      .style("stroke", "black")
      .style("stroke-width", "0.5")
      .style("fill", "black");
    
    // Compute rings and margin for safe blob seeding
    const mainPeak = count > 0 ? settings.maxHeight : 0.5;
    const radius = count > 0 ? settings.blobRadius : 0.9;
    const seaLevel = settings.seaLevel;
    const rings = Math.ceil(Math.log(seaLevel / mainPeak) / Math.log(radius));
    const margin = rings * settings.pointsRadius;
    
    // Poisson-disc sampling
    const sampler = boundedSampler(mapWidth, mapHeight, settings.pointsRadius, margin);
    const samples = [];
    let sample;
    while ((sample = sampler())) samples.push(sample);
    
    // Voronoi diagram
    const voronoiGenerator = voronoi().extent([[0, 0], [mapWidth, mapHeight]]);
    const diagram = voronoiGenerator(samples);
    const polygons = diagram.polygons();
    
    // Color scale
    const color = d3.scaleSequential(d3.interpolateSpectral);
    
    // Detect neighbors
    detectNeighbors(polygons, diagram);
    
    // Add some initial height for visualization
    if (count === 0) {
      generateHeightmap(polygons, diagram, {
        mainPeak: 0.5,
        radius: 0.9,
        sharpness: 0.2,
        blobCount: 5,
        seaLevel: settings.seaLevel
      });
    }
    
    // Generate random map if count is provided
    if (count > 0) {
      generateHeightmap(polygons, diagram, {
        mainPeak: settings.maxHeight,
        radius: settings.blobRadius,
        sharpness: settings.blobSharpness,
        blobCount: count,
        seaLevel: settings.seaLevel
      });
    }
    
    // Mark features and draw
    markFeatures(polygons, diagram);
    
    // Debug: Log some height values
    const heights = polygons.map(p => p.height).filter(h => h > 0);
    console.log(`Generated ${heights.length} cells with height > 0, max height: ${Math.max(...heights)}`);
    
    drawPolygons(polygons, mapCells, color);
    drawCoastline(polygons, diagram, mapWidth, mapHeight, coastline, lakecoast, shallow, islandBack);
    

    
    // Add cursor for mouse tracking
    const cursor = svg.append("g").append("circle")
      .attr("r", 1)
      .attr("class", "cursor");

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([1, 50])
      .translateExtent([[-100, -100], [mapWidth + 100, mapHeight + 100]])
      .on("zoom", (event) => {
        viewbox.attr("transform", event.transform);
      });
    
    svg.call(zoom);
    
    // Add mouse movement tracking
    svg.on("touchmove mousemove", function(event) {
      const point = d3.pointer(event);
      const nearest = diagram.find(point[0], point[1]).index;
      const radius = settings.maxHeight * settings.blobRadius * 100;
      
      setDebugInfo({
        cell: nearest,
        height: polygons[nearest].height.toFixed(2),
        feature: polygons[nearest].featureType ? 
          `${polygons[nearest].featureName} ${polygons[nearest].featureType}` : 'no'
      });
      
      cursor.attr("r", radius)
        .attr("cx", point[0])
        .attr("cy", point[1])
        .attr("stroke", color(1 - settings.maxHeight));
    });
    
    // Add click handler
    svg.on("click", function(event) {
      const point = d3.pointer(event);
      const nearest = diagram.find(point[0], point[1]).index;
      
      // Add a small blob at the clicked location
      generateHeightmap(polygons, diagram, {
        mainPeak: settings.maxHeight,
        radius: settings.blobRadius,
        sharpness: settings.blobSharpness,
        blobCount: 1,
        seaLevel: settings.seaLevel
      });
      
      markFeatures(polygons, diagram);
      drawPolygons(polygons, mapCells, color);
      drawCoastline(polygons, diagram, mapWidth, mapHeight, coastline, lakecoast, shallow, islandBack);
    });
    
    // Store map data for potential future use
    // setMapData({ polygons, diagram, samples });
  };

  // Draw polygons based on height
  const drawPolygons = (polygons, mapCells, color) => {
    mapCells.selectAll(".mapCell").remove();
    mapCells.selectAll(".mapStroke").remove();
    mapCells.selectAll(".blur").remove();
    
    const limit = settings.drawSeaPolygons ? 0 : 0.1;
    
    polygons.forEach((polygon, index) => {
      if (polygon && polygon.length > 0 && polygon.height >= limit) {
        // Create SVG path from polygon points
        let pathData = "";
        if (polygon.length > 0) {
          pathData = "M" + polygon[0].join(",");
          for (let i = 1; i < polygon.length; i++) {
            pathData += "L" + polygon[i].join(",");
          }
          pathData += "Z";
        }
        
        if (pathData) {
          mapCells.append("path")
            .attr("d", pathData)
            .attr("class", "mapCell")
            .attr("fill", color(1 - polygon.height));
          
          if (settings.showGrid) {
            mapCells.append("path")
              .attr("d", pathData)
              .attr("class", "mapStroke")
              .attr("stroke", "grey");
          }
          
          if (settings.blur > 0) {
            mapCells.append("path")
              .attr("d", pathData)
              .attr("class", "blur")
              .attr("stroke-width", settings.blur)
              .attr("stroke", color(1 - polygon.height));
          }
        }
      }
      
      if (polygon && polygon.type === "shallow") {
        let pathData = "";
        if (polygon.length > 0) {
          pathData = "M" + polygon[0].join(",");
          for (let i = 1; i < polygon.length; i++) {
            pathData += "L" + polygon[i].join(",");
          }
          pathData += "Z";
        }
        
        if (pathData) {
          mapCells.append("path")
            .attr("d", pathData)
            .attr("class", "shallow");
        }
      }
    });
  };

  // Draw coastline
  const drawCoastline = (polygons, diagram, mapWidth, mapHeight, coastline, lakecoast, shallow, islandBack) => {
    coastline.selectAll("*").remove();
    lakecoast.selectAll("*").remove();
    shallow.selectAll("*").remove();
    islandBack.selectAll("*").remove();
    
    const line = [];
    
    // Find coastline edges
    for (let i = 0; i < polygons.length; i++) {
      if (polygons[i].height >= 0.2) {
        const cell = diagram.cells[i];
        cell.halfedges.forEach((e) => {
          const edge = diagram.edges[e];
          if (edge.left && edge.right) {
            let ea = edge.left.index;
            if (ea === i) {
              ea = edge.right.index;
            }
            if (polygons[ea].height < 0.2) {
              const start = edge[0].join(" ");
              const end = edge[1].join(" ");
                          let type, number;
            if (polygons[ea].featureType === "Ocean") {
              polygons[ea].type = "shallow";
              type = "Island";
              number = polygons[i].featureNumber;
            } else {
              type = "Lake";
              number = polygons[ea].featureNumber;
            }
            line.push({ start, end, type, number });
            }
          }
        });
      }
    }
    
    // Draw coastlines
    const x = d3.scaleLinear().domain([0, mapWidth]).range([0, mapWidth]);
    const y = d3.scaleLinear().domain([0, mapHeight]).range([0, mapHeight]);
    const path = d3.line()
      .x(d => x(d.x))
      .y(d => y(d.y))
      .curve(d3.curveBasisClosed);
    
    // Draw island coastlines
    let number = 0;
    let type = "Island";
    let edgesOfFeature = line.filter(e => e.type === type && e.number === number);
    
    while (edgesOfFeature.length > 0) {
      const coast = [];
      const start = edgesOfFeature[0].start;
      let end = edgesOfFeature[0].end;
      edgesOfFeature.shift();
      
      const spl = start.split(" ");
      coast.push({ x: spl[0], y: spl[1] });
      const spl2 = end.split(" ");
      coast.push({ x: spl2[0], y: spl2[1] });
      
      for (let i = 0; end !== start && i < 2000; i++) {
        const next = edgesOfFeature.filter(e => e.start === end || e.end === end);
        if (next.length > 0) {
          if (next[0].start === end) {
            end = next[0].end;
          } else if (next[0].end === end) {
            end = next[0].start;
          }
          const spl3 = end.split(" ");
          coast.push({ x: spl3[0], y: spl3[1] });
        }
        const rem = edgesOfFeature.indexOf(next[0]);
        edgesOfFeature.splice(rem, 1);
      }
      
      islandBack.append("path").attr("d", path(coast));
      coastline.append("path").attr("d", path(coast));
      number += 1;
      edgesOfFeature = line.filter(e => e.type === type && e.number === number);
    }
    
    // Draw lake coastlines
    number = 0;
    type = "Lake";
    edgesOfFeature = line.filter(e => e.type === type && e.number === number);
    
    while (edgesOfFeature.length > 0) {
      const coast = [];
      number += 1;
      const start = edgesOfFeature[0].start;
      let end = edgesOfFeature[0].end;
      edgesOfFeature.shift();
      
      const spl = start.split(" ");
      coast.push({ x: spl[0], y: spl[1] });
      const spl2 = end.split(" ");
      coast.push({ x: spl2[0], y: spl2[1] });
      
      for (let i = 0; end !== start && i < 2000; i++) {
        const next = edgesOfFeature.filter(e => e.start === end || e.end === end);
        if (next.length > 0) {
          if (next[0].start === end) {
            end = next[0].end;
          } else if (next[0].end === end) {
            end = next[0].start;
          }
          const spl3 = end.split(" ");
          coast.push({ x: spl3[0], y: spl3[1] });
        }
        const rem = edgesOfFeature.indexOf(next[0]);
        edgesOfFeature.splice(rem, 1);
      }
      
      edgesOfFeature = line.filter(e => e.type === type && e.number === number);
      lakecoast.append("path").attr("d", path(coast));
    }
  };

  useEffect(() => {
    generateWorld();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNewMap = () => {
    generateWorld(settings.blobCount); // Use blobCount from settings
  };

  const handleRandomMap = () => {
    generateWorld(11); // Use a higher blob count for random map
  };

  const handleResetZoom = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().duration(1000)
      .call(d3.zoom().transform, d3.zoomIdentity);
  };

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    
    // Regenerate world when key parameters change
    if (['pointsRadius', 'maxHeight', 'blobRadius', 'blobSharpness'].includes(setting)) {
      generateWorld();
    }
  };

  return (
    <div className="world-generator">
      <div className="controls">
        <button onClick={handleNewMap}>New Map</button>
        <button onClick={handleRandomMap}>Random Map</button>
        <button onClick={handleResetZoom}>Reset Zoom</button>
        <span className="debug-info">
          Cell: {debugInfo.cell}; Height: {debugInfo.height}; {debugInfo.feature};
        </span>
        <div className="settings">
          <label>
            Points Radius:
            <input
              type="range"
              min="1"
              max="10"
              value={settings.pointsRadius}
              onChange={(e) => handleSettingChange('pointsRadius', parseInt(e.target.value))}
            />
            {settings.pointsRadius}
          </label>
          <label>
            Max Height:
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.01"
              value={settings.maxHeight}
              onChange={(e) => handleSettingChange('maxHeight', parseFloat(e.target.value))}
            />
            {settings.maxHeight}
          </label>
          <label>
            Blob Radius:
            <input
              type="range"
              min="0.5"
              max="0.999"
              step="0.001"
              value={settings.blobRadius}
              onChange={(e) => handleSettingChange('blobRadius', parseFloat(e.target.value))}
            />
            {settings.blobRadius}
          </label>
          <label>
            Blob Sharpness:
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.1"
              value={settings.blobSharpness}
              onChange={(e) => handleSettingChange('blobSharpness', parseFloat(e.target.value))}
            />
            {settings.blobSharpness}
          </label>
          <label>
            Blob Count:
            <input
              type="range"
              min="1"
              max="20"
              value={settings.blobCount}
              onChange={(e) => handleSettingChange('blobCount', parseInt(e.target.value))}
            />
            {settings.blobCount}
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.showGrid}
              onChange={(e) => handleSettingChange('showGrid', e.target.checked)}
            />
            Show Grid
          </label>
                      <label>
              <input
                type="checkbox"
                checked={settings.drawSeaPolygons}
                onChange={(e) => handleSettingChange('drawSeaPolygons', e.target.checked)}
              />
              Draw Sea Polygons
            </label>

            <label>
              Blur:
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.blur}
                onChange={(e) => handleSettingChange('blur', parseFloat(e.target.value))}
              />
              {settings.blur}px
            </label>
          </div>
        </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
        width="100%"
        height="100%"
        style={{ display: "block" }}
      />
      {sampleWarning && (
        <div style={{ color: 'red', fontWeight: 'bold', margin: '1em 0' }}>
          {sampleWarning}
        </div>
      )}
      <div className="instructions">
        <p>Click on the map to add land masses. First click creates an island, subsequent clicks add hills.</p>
      </div>
    </div>
  );
};

export default WorldGenerator; 