import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

console.log("Displaying dynamic treemap");

const width = 800;
const height = 800;
let svg;
let allData = []; // All data items from the JSON file
let scrollProgress = 0; // Track scroll progress
let maxVisibleItems = 0; // Maximum visible items at any scroll state

// Fetch the data
async function initializeTreemap() {
  const response = await fetch("./data-ch.json");
  if (response.ok) {
    const data = await response.json();
    allData = data.children || []; // Assume `data.children` contains the items
    maxVisibleItems = allData.length;
    if (allData.length > 0) {
      drawChart(); // Draw the chart
    } else {
      console.error("No data available in data-ch.json");
    }
  } else {
    alert("Failed to load data: " + response.status);
  }
}

// Scroll handler to update scroll progress
function handleScroll(event) {
  const delta = event.deltaY * 0.001; // Scale the scroll sensitivity
  scrollProgress += delta;

  // Clamp scroll progress to [0, maxVisibleItems]
  scrollProgress = Math.max(0, Math.min(scrollProgress, maxVisibleItems));

  // Update the chart dynamically
  updateChart();
}

// Draw the initial chart (empty)
function drawChart() {
  if (!svg) {
    svg = d3
      .create("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height);
    document.body.appendChild(svg.node());
  }
}

// Dynamically update the chart based on scroll progress
function updateChart() {
  // Determine the fraction of progress for each item
  const fractions = allData.map((_, i) => {
    const start = i; // Start showing the item at this scroll position
    const end = i + 1; // Fully visible at this position
    return Math.min(Math.max(scrollProgress - start, 0), 1); // Fraction in [0, 1]
  });

  const visibleItems = allData.slice(0, Math.ceil(scrollProgress));
  const color = d3
    .scaleOrdinal()
    .domain(allData.map((d) => d.name))
    .range(d3.schemeTableau10);

  const root = d3
    .treemap()
    .size([width, height])
    .padding(1)(
    d3
      .hierarchy({
        name: "root",
        children: allData.map((d, i) => ({
          ...d,
          value: d.value * fractions[i], // Scale value by fraction
        })),
      })
      .sum((d) => d.value)
      .sort((a, b) => b.value - a.value)
  );

  // Bind data to elements
  const leaves = svg.selectAll("g").data(root.leaves(), (d) => d.data.name);

  // Enter: Create new `g` elements
  const leafEnter = leaves
    .enter()
    .append("g")
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

  leafEnter
    .append("rect")
    .attr("fill", (d) => color(d.data.name))
    .attr("width", 0)
    .attr("height", 0)
    .attr("fill-opacity", 0);

  leafEnter
    .append("text")
    .attr("x", 4)
    .attr("y", 14)
    .attr("opacity", 0)
    .text((d) => d.data.name);

  // Update: Adjust size, position, and opacity dynamically
  leaves
    .merge(leafEnter)
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`)
    .select("rect")
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0)
    .attr("fill-opacity", (d, i) => fractions[i]);

  leaves
    .merge(leafEnter)
    .select("text")
    .attr("opacity", (d, i) => fractions[i]);

  // Exit: Remove old items
  leaves.exit().remove();
}

// Add the scroll event listener
document.addEventListener("wheel", handleScroll);

// Initialize the visualization
initializeTreemap();
