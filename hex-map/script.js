// script.js
console.time('generate');
generate(11);    // seed 11 blobs with enhanced Azgaar-inspired terrain
console.timeEnd('generate');

// General function; run onload to start from scratch
// Enhanced with Azgaar-inspired terrain generation techniques
function generate(count) {
  // Add general elements
  var svg = d3.select("svg")
    .on("touchmove mousemove", moved, { passive: true }),
    mapWidth = +svg.attr("width"),
    mapHeight = +svg.attr("height"),
    defs = svg.select("defs"),
    viewbox = svg.append("g").attr("class", "viewbox"),
    islandBack = viewbox.append("g").attr("class", "islandBack"),
    mapCells = viewbox.append("g").attr("class", "mapCells"),
    oceanLayer = viewbox.append("g").attr("class", "oceanLayer"),
    circles = viewbox.append("g").attr("class", "circles"),
    coastline = viewbox.append("g").attr("class", "coastline"),
		shallow = viewbox.append("g").attr("class", "shallow"),
    lakecoast = viewbox.append("g").attr("class", "lakecoast");
  // Poisson-disc sampling from https://bl.ocks.org/mbostock/99049112373e12709381
  var sampler = poissonDiscSampler(mapWidth, mapHeight, sizeInput.valueAsNumber),
    samples = [],
    sample;
  while (sample = sampler()) samples.push(sample);
  // Voronoi D3
  var delaunay = d3.Delaunay.from(samples),
    diagram = delaunay.voronoi([0, 0, mapWidth, mapHeight]),
    polygons = [];
  
  // Create polygons array from voronoi cells
  for (var i = 0; i < samples.length; i++) {
    var cell = diagram.cellPolygon(i);
    if (cell) {
      polygons.push(cell);
    } else {
      // If no cell polygon, create a simple point
      polygons.push([samples[i]]);
    }
  }
    // Colors D3 interpolation
    const color = d3.scaleSequential(d3.interpolateSpectral);

  var cursor = svg.append("g").append("circle")
    .attr("r", 1)
    .attr("class", "cursor");

  // Add D3 drag and zoom behavior
  var zoom = d3.zoom()
    .scaleExtent([1, 50])
    .translateExtent([
      [-100, -100],
      [mapWidth + 100, mapHeight + 100]
    ])
    .on("zoom", function(event) {
      viewbox.attr("transform", event.transform);
    });

  svg.call(zoom);

  // Use vanilla JavaScript instead of jQuery for reset zoom
  document.getElementById("resetZoom").addEventListener("click", function() {
    svg.transition().duration(1000)
      .call(zoom.transform, d3.zoomIdentity);
  });

  // array to use as names
  var adjectives = ["Ablaze", "Ablazing", "Accented", "Ashen", "Ashy", "Beaming", "Bi-Color", "Blazing", "Bleached", "Bleak", "Blended", "Blotchy", "Bold", "Brash", "Bright", "Brilliant", "Burnt", "Checkered", "Chromatic", "Classic", "Clean", "Colored", "Colorful", "Colorless", "Complementing", "Contrasting", "Cool", "Coordinating", "Crisp", "Dappled", "Dark", "Dayglo", "Deep", "Delicate", "Digital", "Dim", "Dirty", "Discolored", "Dotted", "Drab", "Dreary", "Dull", "Dusty", "Earth", "Electric", "Eye-Catching", "Faded", "Faint", "Festive", "Fiery", "Flashy", "Flattering", "Flecked", "Florescent", "Frosty", "Full-Toned", "Glistening", "Glittering", "Glowing", "Harsh", "Hazy", "Hot", "Hued", "Icy", "Illuminated", "Incandescent", "Intense", "Interwoven", "Iridescent", "Kaleidoscopic", "Lambent", "Light", "Loud", "Luminous", "Lusterless", "Lustrous", "Majestic", "Marbled", "Matte", "Medium", "Mellow", "Milky", "Mingled", "Mixed", "Monochromatic", "Motley", "Mottled", "Muddy", "Multicolored", "Multihued", "Murky", "Natural", "Neutral", "Opalescent", "Opaque", "Pale", "Pastel", "Patchwork", "Patchy", "Patterned", "Perfect", "Picturesque", "Plain", "Primary", "Prismatic", "Psychedelic", "Pure", "Radiant", "Reflective", "Rich", "Royal", "Ruddy", "Rustic", "Satiny", "Saturated", "Secondary", "Shaded", "Sheer", "Shining", "Shiny", "Shocking", "Showy", "Smoky", "Soft", "Solid", "Somber", "Soothing", "Sooty", "Sparkling", "Speckled", "Stained", "Streaked", "Streaky", "Striking", "Strong Neutral", "Subtle", "Sunny", "Swirling", "Tinged", "Tinted", "Tonal", "Toned", "Translucent", "Transparent", "Two-Tone", "Undiluted", "Uneven", "Uniform", "Vibrant", "Vivid", "Wan", "Warm", "Washed-Out", "Waxen", "Wild"];

  detectNeighbors();

  // for each polygon detect neibours and add their indexes
  function detectNeighbors() {
    // push neighbors indexes to each polygons element
    for (var d = 0; d < polygons.length; d++) {
      var polygon = polygons[d];
      polygon.index = d; // index of this element
      polygon.height = 0;
      // Get neighbors using D3 v7 API
      var neighbors = delaunay.neighbors(d);
      polygon.neighbors = neighbors.filter(function(n) { return n !== -1; });
    }
  }

  function add(start, type) {
    // get options
    var height = heightInput.valueAsNumber,
      radius = radiusInput.valueAsNumber,
      sharpness = sharpnessInput.valueAsNumber,
      queue = [], // polygons to check
      used = new Set(); // use Set for O(1) lookups
    polygons[start].height += height;
    console.log("seeded at", start, "new height:", polygons[start].height, "type:", type);
    polygons[start].featureType = undefined;
    queue.push(start);
    used.add(start);
    for (i = 0; i < queue.length && height > 0.01; i++) {
      // Use parent polygon's height for more natural terrain spreading (Azgaar's approach)
      var currentHeight = polygons[queue[i]].height;
      if (type == "island") {
        height = currentHeight * radius;
      } else {
        height = height * radius;
      }
      var neighbors = polygons[queue[i]].neighbors;
      for (var j = 0; j < neighbors.length; j++) {
        var e = neighbors[j];
        if (!used.has(e)) {
          // Enhanced sharpness calculation inspired by Azgaar
          var mod = 1;
          if (sharpness > 0) {
            mod = Math.random() * sharpness + 1.1 - sharpness;
          }
          polygons[e].height += height * mod;
          if (polygons[e].height > 1) {
            polygons[e].height = 1;
          }
          polygons[e].featureType = undefined;
          queue.push(e);
          used.add(e);
        }
      }
    }
  }

  function drawPolygons() {
    // delete all polygons
    svg.selectAll(".mapCell").remove();
    // redraw the polygons based on new heights
    var grads = [],
      limit = seaInput.checked ? 0 : 0.05; // Lowered from 0.2 to 0.05 for debugging
    for (var i = 0; i < polygons.length; i++) {
      var polygon = polygons[i];
      if (polygon.height >= limit) {
        var pathData = "M" + polygon.map(function(p) { return p.join(","); }).join("L") + "Z";
        mapCells.append("path")
          .attr("d", pathData)
          .attr("class", "mapCell")
          .attr("fill", color(1 - polygon.height));
        mapCells.append("path")
          .attr("d", pathData)
          .attr("class", "mapStroke")
          .attr("stroke", color(1 - polygon.height));
      }
      if (polygon.type === "shallow") {
        var pathData = "M" + polygon.map(function(p) { return p.join(","); }).join("L") + "Z";
        shallow.append("path")
          .attr("d", pathData);
      }
    }
    if (blurInput.valueAsNumber > 0) {
      toggleBlur();
    }
  }

  // Mark GeoFeatures (ocean, lakes, isles)
  function markFeatures() {
    var queue = []; // polygons to check
    var used = []; // checked polygons
    // define ocean cells
    var start = diagram.delaunay.find(0, 0);
    queue.push(start);
    used.push(start);
    var type = "Ocean",
      name;
    if (polygons[start].featureType) {
      name = polygons[start].featureName;
    } else {
      name = adjectives[Math.floor(Math.random() * adjectives.length)];
    }
    polygons[start].featureType = type;
    polygons[start].featureName = name;
    while (queue.length > 0) {
      var i = queue[0];
      queue.shift();
      polygons[i].neighbors.forEach(function(e) {
        if (used.indexOf(e) < 0 && polygons[e].height < 0.05) { // Lowered from 0.2 to 0.05
          polygons[e].featureType = type;
          polygons[e].featureName = name;
          queue.push(e);
          used.push(e);
        }
      });
    }
    // define islands and lakes
    var island = 0,
      lake = 0,
      number = 0,
      greater = 0,
      less = 0;
    // Use vanilla JavaScript instead of jQuery grep
    var unmarked = polygons.filter(function(e) {
      return (!e.featureType);
    });
    while (unmarked.length > 0) {
      if (unmarked[0].height >= 0.05) { // Lowered from 0.2 to 0.05
        type = "Island";
        number = island;
        island += 1;
        greater = 0.05; // Lowered from 0.2 to 0.05
        less = 100; // just to omit exclusion
      } else {
        type = "Lake";
        number = lake;
        lake += 1;
        greater = -100; // just to omit exclusion
        less = 0.05; // Lowered from 0.2 to 0.05
      }
      name = adjectives[Math.floor(Math.random() * adjectives.length)];
      start = unmarked[0].index;
      polygons[start].featureType = type;
      polygons[start].featureName = name;
      polygons[start].featureNumber = number;
      queue.push(start);
      used = new Set([start]); // use Set for O(1) lookups
      while (queue.length > 0) {
        var i = queue[0];
        queue.shift();
        var neighbors = polygons[i].neighbors;
        for (var k = 0; k < neighbors.length; k++) {
          var e = neighbors[k];
          if (!used.has(e) && polygons[e].height >= greater && polygons[e].height < less) {
            polygons[e].featureType = type;
            polygons[e].featureName = name;
            polygons[e].featureNumber = number;
            queue.push(e);
            used.add(e);
          }
        }
      }
      unmarked = polygons.filter(function(e) {
        return (!e.featureType);
      });
    }
  }

  function drawCoastline() {
    d3.selectAll(".coastlines").remove();
    // Clear existing ocean layer and add it first (at the back)
    oceanLayer.selectAll("*").remove();
    oceanLayer.append("rect")
      .attr("x", 0).attr("y", 0)
      .attr("width", mapWidth).attr("height", mapHeight);
    
    var line = []; // array to store coasline edges
    for (var i = 0; i < polygons.length; i++) {
      if (polygons[i].height >= 0.05) { // Lowered from 0.2 to 0.05
        // Get cell edges using D3 v7 API
        var cell = diagram.cellPolygon(i);
        if (cell) {
          var delaunay = diagram.delaunay;
          var neighbors = delaunay.neighbors(i);
          neighbors.forEach(function(ea) {
            if (ea !== -1 && polygons[ea] && polygons[ea].height < 0.05) { // Lowered from 0.2 to 0.05
              // Get edge points between cells i and ea
              var p1 = samples[i];
              var p2 = samples[ea];
              var start = p1.join(" ");
              var end = p2.join(" ");
              if (polygons[ea].featureType === "Ocean") {
                polygons[ea].type = "shallow";
                var type = "Island";
                var number = polygons[i].featureNumber;
              } else {
                var type = "Lake";
                var number = polygons[ea].featureNumber;
              }
              line.push({start, end, type, number});
            }
          });
        }
      }
    }
    // scales amd line for paths drawing
    var x = d3.scaleLinear().domain([0, mapWidth]).range([0, mapWidth]);
    var y = d3.scaleLinear().domain([0, mapHeight]).range([0, mapHeight]);
    var path = d3.line()
      .x(function(d) {
        return x(d.x);
      })
      .y(function(d) {
        return y(d.y);
      })
      .curve(d3.curveBasisClosed);
    // find and draw continuous coastline (island/ocean)
    var number = 0;
    var type = "Island";
    // Use vanilla JavaScript instead of jQuery grep
    var edgesOfFeature = line.filter(function(e) {
      return (e.type == type && e.number === number);
    });
    while (edgesOfFeature.length > 0) {
      var coast = []; // array to store coastline for feature
      var start = edgesOfFeature[0].start;
      var end = edgesOfFeature[0].end;
      edgesOfFeature.shift();
      var spl = start.split(" ");
      coast.push({
        x: spl[0],
        y: spl[1]
      });
      spl = end.split(" ");
      coast.push({
        x: spl[0],
        y: spl[1]
      });
      for (var i = 0; end !== start && i < 2000; i++) {
        var next = edgesOfFeature.filter(function(e) {
          return (e.start == end || e.end == end);
        });
        if (next.length > 0) {
          if (next[0].start == end) {
            end = next[0].end;
          } else if (next[0].end == end) {
            end = next[0].start;
          }
          spl = end.split(" ");
          coast.push({
            x: spl[0],
            y: spl[1]
          });
        }
        var rem = edgesOfFeature.indexOf(next[0]);
        edgesOfFeature.splice(rem, 1);
      }
      svg.select("#shape").append("path").attr("d", path(coast))
        .attr("fill", "black");
      islandBack.append("path").attr("d", path(coast));
      coastline.append("path").attr("d", path(coast));
      number += 1;
      edgesOfFeature = line.filter(function(e) {
        return (e.type == type && e.number === number);
      });
    }
    // find and draw continuous coastline (lake/island)
    number = 0;
    type = "Lake";
    edgesOfFeature = line.filter(function(e) {
      return (e.type == type && e.number === number);
    });
    while (edgesOfFeature.length > 0) {
      var coast = []; // array to store coasline for feature
      number += 1;
      var start = edgesOfFeature[0].start;
      var end = edgesOfFeature[0].end;
      edgesOfFeature.shift();
      spl = start.split(" ");
      coast.push({
        x: spl[0],
        y: spl[1]
      });
      spl = end.split(" ");
      coast.push({
        x: spl[0],
        y: spl[1]
      });
      for (var i = 0; end !== start && i < 2000; i++) {
        var next = edgesOfFeature.filter(function(e) {
          return (e.start == end || e.end == end);
        });
        if (next.length > 0) {
          if (next[0].start == end) {
            end = next[0].end;
          } else if (next[0].end == end) {
            end = next[0].start;
          }
          spl = end.split(" ");
          coast.push({
            x: spl[0],
            y: spl[1]
          });
        }
        var rem = edgesOfFeature.indexOf(next[0]);
        edgesOfFeature.splice(rem, 1);
      }
      edgesOfFeature = line.filter(function(e) {
        return (e.type == type && e.number === number);
      });
      lakecoast.append("path").attr("d", path(coast));
    }
  }

  // Add a blob on mouseclick
  svg.on("click", function(event) {
    // draw circle in center in clicked point
    var point = d3.pointer(event),
      nearest = diagram.delaunay.find(point[0], point[1]);
    circles.append("circle")
      .attr("r", 3)
      .attr("cx", point[0])
      .attr("cy", point[1])
      .attr("fill", color(1 - heightInput.valueAsNumber))
      .attr("class", "circle");
    
    // Use vanilla JavaScript instead of jQuery
    var circles = document.querySelectorAll('.circle');
    if (circles.length == 1) {
      add(nearest, "island");
      // change options to defaults for hills
      heightInput.value = 0.2;
      heightOutput.value = 0.2;
      radiusInput.value = 0.99;
      radiusOutput.value = 0.99;
    } else {
      add(nearest, "hill");
      // let's make height random for hills
      var height = (Math.random() * 0.4 + 0.1).toFixed(2);
      heightInput.value = height;
      heightOutput.value = height;
    }
    
    // Defer heavy rendering work to next frame for better responsiveness
    requestAnimationFrame(function() {
      // Use more efficient path removal
      d3.selectAll("path").remove();
      drawPolygons();
      markFeatures();
      drawCoastline();
    });
  });

  function moved(event) {
    // update cursor and debug div on mousemove
    var point = d3.pointer(event),
      nearest = diagram.delaunay.find(point[0], point[1]),
      radius = heightInput.value * radiusInput.value * 100;
    // Use vanilla JavaScript instead of jQuery
    document.getElementById("cell").textContent = nearest;
    document.getElementById("height").textContent = (polygons[nearest].height).toFixed(2);
    if (polygons[nearest].featureType) {
      document.getElementById("feature").textContent = polygons[nearest].featureName + " " + polygons[nearest].featureType;
    } else {
      document.getElementById("feature").textContent = "no!";
    }
    cursor.attr("r", radius)
      .attr("cx", point[0])
      .attr("cy", point[1])
      .attr("stroke", color(1 - heightInput.value));
  }

  if (count != undefined) {
    randomMap(count);
  }

  // Create random map with enhanced multi-blob strategy (inspired by Azgaar)
  function randomMap(count) {
    // Phase 1: Create main island/continent (large blob)
    if (count > 0) {
      var x = Math.random() * mapWidth / 4 + mapWidth / 2;
      var y = Math.random() * mapHeight / 4 + mapHeight / 2;
      var rnd = diagram.delaunay.find(x, y);
      
      // Set better parameters for main island
      heightInput.value = 1.0; // Higher initial height
      radiusInput.value = 0.8; // Slower falloff
      heightOutput.value = 1.0;
      radiusOutput.value = 0.8;
      
      circles.append("circle")
        .attr("r", 4)
        .attr("cx", x)
        .attr("cy", y)
        .attr("fill", color(1 - heightInput.valueAsNumber))
        .attr("class", "circle");
      add(rnd, "island");
    }
    
    // Phase 2: Add complexity with smaller blobs (Azgaar's approach)
    for (c = 1; c < count; c++) {
      var limit = 0;
      var rnd;
      do {
        rnd = Math.floor(Math.random() * polygons.length);
        limit++;
        // Prefer areas with some existing height but not too high (creates peninsulas and inlets)
      } while ((polygons[rnd].height > 0.4 || polygons[rnd].height < 0.05 || 
                samples[rnd][0] < mapWidth * 0.1 || samples[rnd][0] > mapWidth * 0.9 || 
                samples[rnd][1] < mapHeight * 0.1 || samples[rnd][1] > mapHeight * 0.9) &&
               limit < 100);
      
      // Vary blob sizes for more natural terrain
      var blobSize = Math.random() * 0.4 + 0.3; // 0.3 to 0.7 (higher range)
      heightInput.value = blobSize;
      
      circles.append("circle")
        .attr("r", 2)
        .attr("cx", samples[rnd][0])
        .attr("cy", samples[rnd][1])
        .attr("fill", color(1 - blobSize))
        .attr("class", "circle");
      add(rnd, "hill");
    }
    
    // Phase 3: Add some very small detail blobs for coastline complexity
    var detailBlobs = Math.min(count, 3); // Add 1-3 detail blobs
    for (c = 0; c < detailBlobs; c++) {
      var limit = 0;
      var rnd;
      do {
        rnd = Math.floor(Math.random() * polygons.length);
        limit++;
        // Look for edge areas to create small islands or peninsulas
      } while ((polygons[rnd].height > 0.3 || polygons[rnd].height < 0.1 || 
                samples[rnd][0] < mapWidth * 0.2 || samples[rnd][0] > mapWidth * 0.8 || 
                samples[rnd][1] < mapHeight * 0.2 || samples[rnd][1] > mapHeight * 0.8) &&
               limit < 50);
      
      var detailSize = Math.random() * 0.25 + 0.15; // 0.15 to 0.4 (higher range)
      heightInput.value = detailSize;
      
      circles.append("circle")
        .attr("r", 1)
        .attr("cx", samples[rnd][0])
        .attr("cy", samples[rnd][1])
        .attr("fill", color(1 - detailSize))
        .attr("class", "circle");
      add(rnd, "hill");
    }
    
    heightInput.value = Math.random() * 0.4 + 0.1;
    heightOutput.value = heightInput.valueAsNumber;
    
    // Debug: Log height statistics
    var maxHeight = Math.max(...polygons.map(p => p.height));
    var avgHeight = polygons.reduce((sum, p) => sum + p.height, 0) / polygons.length;
    var aboveThreshold = polygons.filter(p => p.height >= 0.05).length;
    console.log("Height stats - Max:", maxHeight.toFixed(3), "Avg:", avgHeight.toFixed(3), "Above 0.05:", aboveThreshold);
    
    // process the calculations
    markFeatures();
    drawCoastline();
    drawPolygons();
    // Use vanilla JavaScript instead of jQuery
    var circleElements = document.querySelectorAll('.circles');
    circleElements.forEach(circle => circle.style.display = 'none');
  }

  // redraw all polygons on SeaInput change 
  // Use vanilla JavaScript instead of jQuery
  document.getElementById("seaInput").addEventListener("change", function() {
    drawPolygons();
  });

  // Draw of remove blur polygons on intup change
  // Use vanilla JavaScript instead of jQuery
  document.getElementById("blurInput").addEventListener("change", function() {
    toggleBlur();
  });

  // Change blur, in case of 0 will not be drawn 
  function toggleBlur() {
    d3.selectAll(".blur").remove();
    if (blurInput.valueAsNumber > 0) {
      var limit = seaInput.checked ? 0 : 0.05; // Lowered from 0.2 to 0.05
      for (var i = 0; i < polygons.length; i++) {
        var polygon = polygons[i];
        if (polygon.height >= limit) {
          var pathData = "M" + polygon.map(function(p) { return p.join(","); }).join("L") + "Z";
          mapCells.append("path")
            .attr("d", pathData)
            .attr("class", "blur")
            .attr("stroke-width", blurInput.valueAsNumber)
            .attr("stroke", color(1 - polygon.height));
        }
      }
    }
  }

  // Draw of remove blur polygons on intup change
  // Use vanilla JavaScript instead of jQuery
  document.getElementById("strokesInput").addEventListener("change", function() {
    toggleStrokes();
  });

  // Change polygons stroke-width,
  // in case of low width svg background will be shined through 
  function toggleStrokes() {
    if (strokesInput.checked == true) {
      var limit = seaInput.checked ? 0 : 0.05; // Lowered from 0.2 to 0.05
      for (var i = 0; i < polygons.length; i++) {
        var polygon = polygons[i];
        if (polygon.height >= limit) {
          var pathData = "M" + polygon.map(function(p) { return p.join(","); }).join("L") + "Z";
          mapCells.append("path")
            .attr("d", pathData)
            .attr("class", "mapStroke")
            .attr("stroke", "grey");
        }
      }
    } else {
      d3.selectAll(".mapStroke").remove();
    }
  }

  // Enhanced terrain generation inspired by Azgaar's heightmap approach
  function createComplexTerrain(baseCount) {
    // Create a more complex terrain pattern with multiple phases
    var totalBlobs = baseCount + Math.floor(Math.random() * 3); // Add some randomness
    
    // Phase 1: Main continent/island
    if (totalBlobs > 0) {
      var x = Math.random() * mapWidth / 3 + mapWidth / 3;
      var y = Math.random() * mapHeight / 3 + mapHeight / 3;
      var rnd = diagram.delaunay.find(x, y);
      add(rnd, "island");
    }
    
    // Phase 2: Secondary landmasses
    var secondaryCount = Math.floor(totalBlobs * 0.6);
    for (var i = 0; i < secondaryCount; i++) {
      var x = Math.random() * mapWidth;
      var y = Math.random() * mapHeight;
      var rnd = diagram.delaunay.find(x, y);
      if (polygons[rnd].height < 0.3) { // Only add if not too high
        add(rnd, "hill");
      }
    }
    
    // Phase 3: Detail blobs for coastline complexity
    var detailCount = Math.floor(totalBlobs * 0.4);
    for (var i = 0; i < detailCount; i++) {
      // Look for edge areas
      var attempts = 0;
      var rnd;
      do {
        rnd = Math.floor(Math.random() * polygons.length);
        attempts++;
      } while (polygons[rnd].height > 0.2 && attempts < 20);
      
      if (attempts < 20) {
        add(rnd, "hill");
      }
    }
  }

  // Based on https://www.jasondavies.com/poisson-disc/
  function poissonDiscSampler(width, height, radius) {
    var k = 30, // maximum number of samples before rejection
      radius2 = radius * radius,
      R = 3 * radius2,
      cellSize = radius * Math.SQRT1_2,
      gridWidth = Math.ceil(width / cellSize),
      gridHeight = Math.ceil(height / cellSize),
      grid = new Array(gridWidth * gridHeight),
      queue = [],
      queueSize = 0,
      sampleSize = 0;

    return function() {
      if (!sampleSize) return sample(Math.random() * width, Math.random() * height);

      // Pick a random existing sample and remove it from the queue.
      while (queueSize) {
        var i = Math.random() * queueSize | 0,
          s = queue[i];

        // Make a new candidate between [radius, 2 * radius] from the existing sample.
        for (var j = 0; j < k; ++j) {
          var a = 2 * Math.PI * Math.random(),
            r = Math.sqrt(Math.random() * R + radius2),
            x = s[0] + r * Math.cos(a),
            y = s[1] + r * Math.sin(a);

          // Reject candidates that are outside the allowed extent,
          // or closer than 2 * radius to any existing sample.
          if (0 <= x && x < width && 0 <= y && y < height && far(x, y)) return sample(x, y);
        }

        queue[i] = queue[--queueSize];
        queue.length = queueSize;
      }
    };

    function far(x, y) {
      var i = x / cellSize | 0,
        j = y / cellSize | 0,
        i0 = Math.max(i - 2, 0),
        j0 = Math.max(j - 2, 0),
        i1 = Math.min(i + 3, gridWidth),
        j1 = Math.min(j + 3, gridHeight);

      for (j = j0; j < j1; ++j) {
        var o = j * gridWidth;
        for (i = i0; i < i1; ++i) {
          if (s = grid[o + i]) {
            var s,
              dx = s[0] - x,
              dy = s[1] - y;
            if (dx * dx + dy * dy < radius2) return false;
          }
        }
      }

      return true;
    }

    function sample(x, y) {
      var s = [x, y];
      queue.push(s);
      grid[gridWidth * (y / cellSize | 0) + (x / cellSize | 0)] = s;
      ++sampleSize;
      ++queueSize;
      return s;
    }
  }
}

// Clear the map on re-generation
function undraw() {
  // Use vanilla JavaScript instead of jQuery
  const groups = document.querySelectorAll("g");
  groups.forEach(g => g.remove());
  
  const paths = document.querySelectorAll("path");
  paths.forEach(p => p.remove());
  
  // Reset input values
  const heightInput = document.getElementById('heightInput');
  const heightOutput = document.getElementById('heightOutput');
  const radiusInput = document.getElementById('radiusInput');
  const radiusOutput = document.getElementById('radiusOutput');
  
  if (heightInput) heightInput.value = 0.9;
  if (heightOutput) heightOutput.value = 0.9;
  if (radiusInput) radiusInput.value = 0.9;
  if (radiusOutput) radiusOutput.value = 0.9;
}

// Toggle options panel
function toggleOptions() {
  const options = document.getElementById('options');
  if (options) {
    options.hidden = !options.hidden;
  }
}

// Toggle circles visibility
function toggleCircles() {
  const circles = document.querySelectorAll('.circles');
  circles.forEach(circle => {
    circle.style.display = circle.style.display === 'none' ? 'block' : 'none';
  });
} 