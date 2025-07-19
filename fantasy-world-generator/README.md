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
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

### Basic Controls

- **New Map**: Generates a fresh, empty world
- **Random Map**: Creates a procedurally generated world with multiple land masses
- **Reset Zoom**: Returns the view to the original position and scale

### Interactive Features

- **Click to Add Land**: 
  - First click creates an island
  - Subsequent clicks add hills
- **Mouse Hover**: Shows debug information about the cell under the cursor
- **Zoom and Pan**: Use mouse wheel to zoom, drag to pan

### Generation Parameters

- **Points Radius**: Controls the density of the Voronoi cells (1-10)
- **Max Height**: Maximum elevation for new land masses (0.1-1.0)
- **Blob Radius**: How far height spreads from the center (0.5-0.999)
- **Blob Sharpness**: Controls the randomness of height distribution (0-0.5)
- **Blur**: Adds a blurred outline effect to land masses (0-2px)
- **Show Grid**: Toggles the display of cell boundaries
- **Draw Sea Polygons**: Shows all polygons including ocean areas

## Algorithm Details

### Poisson-Disc Sampling
Creates a uniform distribution of points across the map area, ensuring no two points are too close together. This creates natural-looking, organic terrain patterns.

### Voronoi Diagram
Divides the map into cells based on the sampled points, where each cell contains all points closest to one of the sample points. This creates the basic terrain structure.

### Height Map Generation
Uses a "blob" algorithm that spreads height values from selected points to neighboring cells, creating realistic elevation gradients.

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

## Acknowledgments

- Original algorithm inspiration from JSFiddle by byzeyLaa
- D3.js community for excellent documentation and examples
- React team for the amazing framework
