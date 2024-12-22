import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

console.log("Displaying dynamic treemap");

const width = 800;
const height = 800;
let svg;
let allData = []; // To store all data from the JSON file
let displayedData = []; // To store the currently displayed subset of data
let scrollPosition = 0; // Track the cumulative scroll position
let scrollThreshold = 120; // Define how much scroll is needed for a full item transition

// Function to fetch data and initialize the treemap
async function initializeTreemap() {
  const response = await fetch("./data-ch.json");
  if (response.ok) {
    const data = await response.json();
    allData = data.children || []; // Assuming `data.children` contains the list of items
    if (allData.length > 0) {
      displayedData.push(allData[0]); // Show the first item initially
      drawChart({ name: "root", children: displayedData });
    } else {
      console.error("No data available in data-ch.json");
    }
  } else {
    alert("Failed to load data: " + response.status);
  }
}

// Function to handle scroll and update the chart
function handleScroll(event) {
  scrollPosition += event.deltaY; // Accumulate the scroll delta

  // Check if we've scrolled enough to transition
  if (scrollPosition > scrollThreshold && displayedData.length < allData.length) {
    // Add the next item
    displayedData.push(allData[displayedData.length]);
    scrollPosition = 0; // Reset scroll position for the next transition
    drawChart({ name: "root", children: displayedData });
  } else if (scrollPosition < -scrollThreshold && displayedData.length > 1) {
    // Remove the last item
    displayedData.pop();
    scrollPosition = 0; // Reset scroll position for the next transition
    drawChart({ name: "root", children: displayedData });
  }
}

// Function to draw the chart
function drawChart(data) {
  const color = d3
    .scaleOrdinal()
    .domain(data.children.map((d) => d.name))
    .range(d3.schemeTableau10);

  const root = d3
    .treemap()
    .size([width, height])
    .padding(1)(
    d3
      .hierarchy(data)
      .sum((d) => d.value)
      .sort((a, b) => b.value - a.value)
  );

  if (!svg) {
    svg = d3
      .create("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height);
    document.body.appendChild(svg.node());
  }

  const leaf = svg.selectAll("g").data(root.leaves(), (d) => d.data.name);

  const leafEnter = leaf
    .enter()
    .append("g")
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

  leafEnter
    .append("rect")
    .attr("fill", (d) => color(d.data.name))
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0)
    .attr("fill-opacity", 0) // Start transparent
    .transition()
    .duration(750) // Animate as items appear or disappear
    .attr("fill-opacity", 1);

  leafEnter
    .append("text")
    .attr("x", 4)
    .attr("y", 14)
    .attr("opacity", 0) // Start transparent
    .text((d) => d.data.name)
    .transition()
    .duration(750) // Animate as items appear or disappear
    .attr("opacity", 1);

  leaf
    .transition()
    .duration(750) // Smooth transition for existing elements
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

  leaf
    .select("rect")
    .transition()
    .duration(750)
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0);

  leaf.exit()
    .select("rect")
    .transition()
    .duration(750) // Animate as items disappear
    .attr("fill-opacity", 0)
    .remove();

  leaf.exit()
    .select("text")
    .transition()
    .duration(750) // Animate as items disappear
    .attr("opacity", 0)
    .remove();

  leaf.exit().remove();
}

// Add the scroll event listener
document.addEventListener("wheel", handleScroll);

// Initialize the treemap with the first item
initializeTreemap();
