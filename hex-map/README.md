# Hex-Grid Map Generator

A procedural fantasy world generator that creates beautiful hex-grid maps using Voronoi diagrams, Poisson-disc sampling, and interactive terrain generation.

## 🌟 Features

### Core Functionality
- **Procedural Terrain Generation**: Creates realistic terrain using blob-based height maps
- **Voronoi Diagram Cells**: Generates organic-looking hex-like cells using D3.js v7
- **Poisson-Disc Sampling**: Ensures even distribution of terrain points
- **Interactive Terrain Building**: Click to add islands and hills
- **Random Map Generation**: Generate complete maps with one click

### Visual Features
- **Height-Based Coloring**: Terrain colored by elevation (spectral color scale)
- **Coastline Detection**: Automatic detection and rendering of coastlines
- **Feature Classification**: Identifies oceans, islands, and lakes
- **Zoom and Pan**: Interactive navigation with D3 zoom behavior
- **Responsive Design**: Works on different screen sizes

### Customization Options
- **Points Radius**: Control density of terrain cells
- **Max Height**: Adjust maximum terrain elevation
- **Blob Radius**: Control how far terrain spreads
- **Blob Sharpness**: Add randomness to terrain edges
- **Visual Effects**: Toggle grid lines, blur effects, and sea polygons

## 🚀 Quick Start

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3.x (for local server) or any HTTP server

### Installation

1. **Clone or download** the project files
2. **Navigate** to the `hex-map` directory
3. **Start a local HTTP server**:

```bash
# Using Python 3
python -m http.server 8000

# Or using Python 2
python -m SimpleHTTPServer 8000

# Or using Node.js (if you have http-server installed)
npx http-server -p 8000
```

4. **Open your browser** and navigate to `http://localhost:8000`

## 🎮 How to Use

### Basic Controls
- **Click anywhere** on the map to add terrain blobs
- **First click**: Creates an island (larger blob)
- **Subsequent clicks**: Creates hills (smaller blobs)
- **"New map" button**: Generates a fresh empty map
- **"Random map" button**: Creates a complete random world

### Advanced Options
Click the **"Options"** button to access:
- **Show grid**: Toggle cell boundary lines
- **Blur**: Add blur effects to terrain
- **Draw sea polygons**: Show ocean areas
- **Show blob centers**: Display terrain generation points

### Terrain Parameters
- **Points radius**: Higher values = fewer, larger cells
- **Max Height**: Maximum elevation of generated terrain
- **Blob Radius**: How far terrain spreads from center
- **Blob Sharpness**: Randomness in terrain edges

## 🛠️ Technical Details

### Architecture
- **Frontend**: Pure HTML, CSS, and JavaScript
- **Graphics**: SVG rendering with D3.js v7
- **Algorithms**: 
  - Poisson-disc sampling for point distribution
  - Voronoi diagrams for cell generation
  - Breadth-first search for terrain spreading
  - Graph-based neighbor detection

### Key Components

#### Dependencies
- **D3.js v7**: Data visualization and SVG manipulation (includes Delaunay/Voronoi)
- **Vanilla JavaScript**: No jQuery dependency

#### Core Functions
- `generate()`: Main generation function
- `poissonDiscSampler()`: Point distribution algorithm
- `detectNeighbors()`: Cell neighbor detection
- `add()`: Terrain blob spreading
- `drawPolygons()`: SVG rendering
- `markFeatures()`: Geographic feature classification
- `drawCoastline()`: Coastline detection and rendering

### Algorithm Details

#### Poisson-Disc Sampling
Based on Jason Davies' implementation, ensures minimum distance between points while maintaining natural distribution.

#### Voronoi Diagram Generation
Uses D3 v7's Delaunay triangulation to create Voronoi cells from sampled points.

#### Terrain Generation
1. **Blob Seeding**: User clicks or random placement
2. **BFS Spreading**: Terrain spreads to neighboring cells
3. **Height Accumulation**: Multiple blobs combine for complex terrain
4. **Feature Detection**: Oceans, islands, and lakes identified

#### Coastline Detection
1. **Edge Analysis**: Finds boundaries between land and water
2. **Path Tracing**: Connects edges into continuous coastlines
3. **Feature Classification**: Distinguishes ocean and lake coastlines

## 🎨 Customization

### Styling
Modify `style.css` to change:
- Ocean color (`#5E4FA2`)
- Land colors (spectral scale)
- Coastline appearance
- Grid line styling

### Parameters
Adjust in `script.js`:
- `sizeInput.valueAsNumber`: Point density
- `heightInput.valueAsNumber`: Maximum height
- `radiusInput.valueAsNumber`: Blob spread
- `sharpnessInput.valueAsNumber`: Terrain randomness

## 🐛 Troubleshooting

### Common Issues

**"Cannot read properties of undefined"**
- Ensure all HTML elements exist before JavaScript runs
- Check that D3.js is properly loaded

**"d3.voronoi is not a function"**
- Verify D3.js v7 is loaded (includes Delaunay/Voronoi)
- Check script loading order

**Purple screen only**
- Ocean layer might be covering terrain
- Check that `drawPolygons()` is called after terrain generation

**No terrain appears**
- Verify mouse events are working
- Check that `add()` function is being called
- Ensure polygon rendering is working

### Browser Compatibility
- **Chrome**: Full support
- **Firefox**: Full support  
- **Safari**: Full support
- **Edge**: Full support
- **IE**: Not supported (uses modern JavaScript features)

## 📝 Development

### Project Structure
```
hex-map/
├── index.html      # Main HTML file
├── style.css       # Styling and visual effects
├── script.js       # Core application logic
├── README.md       # This documentation
├── DEVLOG.md       # Development history
└── TESTING.md      # Testing guide
```

### Key Functions to Modify
- `generate()`: Main generation logic
- `add()`: Terrain spreading algorithm
- `drawPolygons()`: Rendering system
- `markFeatures()`: Feature detection

### Adding New Features
1. **New terrain types**: Modify `add()` function
2. **Different color schemes**: Change `color` scale in `generate()`
3. **Additional effects**: Add new SVG filters in `index.html`
4. **Export functionality**: Add canvas/svg export functions

## 🧪 Testing

See `TESTING.md` for comprehensive testing procedures and verification steps.

## 📄 License

This project is open source. Feel free to modify and distribute.

## 🙏 Acknowledgments

- **D3.js**: Mike Bostock for the amazing visualization library
- **Poisson-Disc Sampling**: Jason Davies for the algorithm implementation
- **Voronoi Diagrams**: Computational geometry algorithms
- **Color Scales**: D3's spectral color interpolation

---

**Happy map making!** 🗺️ 