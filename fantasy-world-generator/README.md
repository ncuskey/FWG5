# Fantasy World Generator

A React-based procedural fantasy world generation tool that creates height maps and coastlines using advanced algorithms.

## Features

- **Procedural Generation**: Uses Poisson-disc sampling and Voronoi diagrams to create natural-looking terrain
- **Interactive Map Creation**: Click to add land masses, islands, and hills
- **Height Map Visualization**: Color-coded terrain based on elevation
- **Coastline Detection**: Automatic detection and rendering of coastlines
- **Geographic Features**: Identifies and names oceans, lakes, and islands
- **Zoom and Pan**: Interactive navigation with D3.js zoom functionality
- **Customizable Parameters**: Adjust various generation settings in real-time
- **Responsive SVG Canvas**: The map automatically scales to fit your screen or container

## Technologies Used

- **React 19**: Modern React with hooks
- **D3.js**: Data visualization and SVG manipulation
- **d3-voronoi**: Voronoi diagram generation
- **CSS Grid**: Modern layout system

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fantasy-world-generator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
# If you are in the project root, first run:
# cd fantasy-world-generator
# then:
# npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

### Basic Controls

- **New Map**: Generates a new world with the current Blob Count (see settings)
- **Random Map**: Creates a world with a higher Blob Count (11 blobs)
- **Reset Zoom**: Returns the view to the original position and scale

### Interactive Features

- **Click to Add Land**: 
  - First click creates an island
  - Subsequent clicks add hills
- **Mouse Hover**: Shows debug information about the cell under the cursor
- **Zoom and Pan**: Use mouse wheel to zoom, drag to pan

### Generation Parameters

#### Core Parameters:
- **Points Radius**: Controls the density of the Voronoi cells (1-10)
- **Max Height**: Maximum elevation for the primary land mass (0.1-1.0)
- **Blob Radius**: How quickly height spreads and decays (0.5-0.999)
- **Blob Sharpness**: Controls terrain randomness (0 = smooth, higher = jagged)
- **Blob Count**: Number of blobs/islands to generate (1-20, adjustable slider)
- **Sea Level**: Minimum water height; guarantees a water border around all land (default 0.2)

#### Visual Parameters:
- **Blur**: Adds a blurred outline effect to land masses (0-2px)
- **Show Grid**: Toggles the display of cell boundaries
- **Draw Sea Polygons**: Shows all polygons including ocean areas

#### Algorithm Behavior:
- **Main Peak**: First blob uses full max height value
- **Radius Decay**: Subsequent blobs decay by radius^b for natural progression
- **Height Accumulation**: Multiple overlapping blobs add their heights together
- **Sharpness Factor**: Randomness multiplier (0 = deterministic, higher = more variation)

## Algorithm Details

### Poisson-Disc Sampling
Creates a uniform distribution of points across the map area, ensuring no two points are too close together. This creates natural-looking, organic terrain patterns.

### Voronoi Diagram
Divides the map into cells based on the sampled points, where each cell contains all points closest to one of the sample points. This creates the basic terrain structure.

### Height Map Generation
Uses a **BFS-based blob algorithm** that efficiently generates organic terrain:

#### Algorithm Features:
- **Breadth-First Search**: Ensures proper height propagation from center points
- **Configurable Parameters**: Main peak, radius, sharpness, blob count, and sea level
- **Height Accumulation**: Multiple blobs can overlap and accumulate height
- **Natural Decay**: Subsequent blobs decay by radius^b for realistic progression
- **Randomness Control**: Sharpness parameter controls terrain variation
- **Guaranteed Water Border**: Blobs are seeded far enough from the edge to ensure land always falls below sea level before reaching the map border
- **Mountain-Range Clustering**: Secondary blobs cluster along existing ridges for natural mountain chains

#### Algorithm Process:
1. **Reset**: Clear all heights and temporary flags
2. **Blob Generation**: For each blob:
   - Select random starting point
   - Calculate initial height (main peak for first blob, decayed for others)
   - Initialize BFS queue with starting point
   - Spread height to neighbors with radius and sharpness factors
   - Continue until height drops below threshold
   - Blobs are seeded at least clearanceDistance from the edge (guaranteed water border)
   - Secondary blobs cluster along existing ridges for mountain-range shapes
3. **Height Capping**: Ensure heights don't exceed 1.0 maximum
4. **Cleanup**: Clear temporary flags for next generation

This approach generates more natural-looking terrain with better performance than the previous ad-hoc method.

### Feature Detection
Automatically identifies:
- **Oceans**: Large connected areas of low elevation
- **Islands**: Connected areas of high elevation surrounded by ocean
- **Lakes**: Connected areas of low elevation surrounded by land

### Coastline Generation
Detects edges between land and water cells, then connects them into continuous coastline paths using curve interpolation.

## File Structure

```
src/
├── components/
│   ├── WorldGenerator.js    # Main world generation component
│   └── WorldGenerator.css   # Component-specific styles
├── App.js                   # Main application component
├── App.css                  # Application styles
└── index.js                 # Application entry point
```

## Customization

The application is highly customizable through the settings panel. You can:

- Adjust terrain generation parameters
- Modify visual appearance
- Change the map size (in the code)
- For a larger or smaller map, edit the `mapWidth` and `mapHeight` constants at the top of `WorldGenerator.js`. The SVG will remain fully responsive.
- Add new feature types
- Implement additional algorithms

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Performance

The application is optimized for:
- Smooth 60fps interaction
- Real-time parameter updates
- Efficient memory usage
- Responsive UI

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Recent Updates

This project has been actively developed with several major improvements:

### Latest Version (v2.0) - BFS Blob Algorithm
- **🚀 BFS-Based Blob Algorithm**: Replaced ad-hoc height generation with efficient BFS approach
- **⚙️ Parameterized Generation**: Clean, configurable height map generation with main peak, radius, sharpness controls
- **⚡ Performance Optimization**: Improved memory usage and rendering speed
- **🧹 Code Cleanup**: Removed legacy circle markers and unused features
- **📚 Better Documentation**: Comprehensive algorithm documentation and usage guides
- **🖱️ Improved UX**: New Map always plants blobs; Blob Count is user-adjustable with a slider; no more blank ocean on new maps
- **🌊 Guaranteed Water Border & Mountain Clustering**: Blobs are seeded to ensure a water border, and secondary blobs cluster for natural mountain ranges
- **🖼️ Responsive SVG & Larger Map**: The map canvas is now 960×540 logical units and scales fluidly to any screen size

### Key Algorithm Improvements:
- **Efficient BFS Queue**: Proper height propagation with breadth-first search
- **Height Accumulation**: Multiple blobs can overlap and combine naturally
- **Natural Decay**: Subsequent blobs decay by radius^b for realistic progression
- **Configurable Randomness**: Sharpness parameter controls terrain variation
- **Memory Optimization**: Temporary flags for efficient neighbor tracking

### Previous Versions
- **v1.0**: Initial implementation with basic blob algorithm
- **v1.1**: Added coastline detection and feature identification
- **v1.2**: Implemented interactive controls and real-time updates

## Acknowledgments

- Original algorithm inspiration from JSFiddle by byzeyLaa
- D3.js community for excellent documentation and examples
- React team for the amazing framework
