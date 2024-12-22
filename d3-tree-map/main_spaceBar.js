import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

console.log("Displaying dynamic treemap");

const width = 800;
const height = 800;
let svg;
let allData = []; // To store all data from the JSON file
let displayedData = []; // To store the currently displayed subset of data

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

// Function to add the next item on space key press
function addNextItem() {
  if (displayedData.length < allData.length) {
    displayedData.push(allData[displayedData.length]); // Add the next item
    drawChart({ name: "root", children: displayedData }); // Redraw the chart
  } else {
    console.log("All items have already been displayed.");
  }
}

// Event listener for space key
document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault(); // Prevent default behavior like page scrolling
    addNextItem();
  }
});

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
    .attr("height", (d) => d.y1 - d.y0);

  leafEnter
    .append("text")
    .attr("x", 4)
    .attr("y", 14)
    .text((d) => d.data.name);

  leaf
    .transition()
    .duration(750)
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

  leaf
    .select("rect")
    .transition()
    .duration(750)
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0);

  leaf.exit().remove();
}

// Initialize the treemap with the first item
initializeTreemap();
