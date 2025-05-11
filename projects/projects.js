// import { fetchJSON, renderProjects } from '../global.js';
// import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
// const projects = await fetchJSON('../lib/projects.json');
// const projectsContainer = document.querySelector('.projects');
// const title = document.querySelector('.projects-title');
// const searchInput = document.querySelector('.searchBar');
// let selectedIndex = -1;
// let currentFilteredProjects = [...projects]; // Keep track of filtered projects

// renderProjects(projects, projectsContainer, 'h2');
// title.textContent = `${projects.length} Projects`;
// renderPieChart(projects, selectedIndex);

// searchInput.addEventListener('input', (event) => {
//   const query = event.target.value.toLowerCase();
//   const filteredProjects = projects.filter((project) => {
//     const values = Object.values(project).join('\n').toLowerCase();
//     return values.includes(query);
//   });
//   currentFilteredProjects = filteredProjects;
  
//   updateProjectsDisplay(filteredProjects, selectedIndex);
//   renderPieChart(filteredProjects, selectedIndex);
// });

// function updateProjectsDisplay(projectsToDisplay, currentSelectedIndex) {
//   if (currentSelectedIndex === -1) {
//     renderProjects(projectsToDisplay, projectsContainer, 'h2');
//     title.textContent = `${projectsToDisplay.length} Projects`;
//   } else {
//     const data = d3.rollups(
//       projectsToDisplay,
//       (v) => v.length,
//       (d) => d.year
//     ).sort(([a], [b]) => d3.ascending(a, b));
    
//     const selectedYear = data[currentSelectedIndex][0]; 
//     const yearFilteredProjects = projectsToDisplay.filter(project => project.year === selectedYear);
    
//     renderProjects(yearFilteredProjects, projectsContainer, 'h2');
//     title.textContent = `${yearFilteredProjects.length} Projects from ${selectedYear}`;
//   }
// }

// function renderPieChart(projectsGiven, currentSelectedIndex) {
//   const svg = d3.select('#projects-pie-plot');
//   const legend = d3.select('.legend');
//   svg.selectAll('*').remove();
//   legend.selectAll('*').remove();
  
//   const rolledData = d3.rollups(
//     projectsGiven,
//     (v) => v.length,
//     (d) => d.year
//   ).sort(([a], [b]) => d3.ascending(a, b));
  
//   const data = rolledData.map(([year, count]) => ({
//     value: count,
//     label: year
//   }));
  
//   const sliceGenerator = d3.pie().value((d) => d.value);
//   const arcData = sliceGenerator(data);
//   const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  
//   const visibleYears = data.map(d => d.label);
//   const baseColors = d3.schemeTableau10;
//   const baseColorScale = d3.scaleOrdinal()
//     .domain(visibleYears)
//     .range(baseColors.slice(0, visibleYears.length));
  
//   const usedColors = new Set(data.map(d => baseColorScale(d.label)));
  
//   const possibleHighlightColors = [
//     '#FF1493', // Deep Pink
//     '#00FFFF', // Cyan
//     '#FFD700', // Gold
//     '#8A2BE2', // Blue Violet
//     '#32CD32', // Lime Green
//     '#FF4500', // Orange Red
//     '#1E90FF', // Dodger Blue
//     '#FF00FF'  // Magenta
//   ];
  
//   const highlightColor = possibleHighlightColors.find(c => !usedColors.has(c)) || '#000000';
  
//   arcData.forEach((d, i) => {
//     const isSelected = i === currentSelectedIndex;
//     const fillColor = isSelected ? highlightColor : baseColorScale(d.data.label);
    
//     svg.append('path')
//       .attr('d', arcGenerator(d))
//       .attr('fill', fillColor)
//       .style('cursor', 'pointer')
//       .on('click', function() {
//         selectedIndex = selectedIndex === i ? -1 : i;
//         renderPieChart(projectsGiven, selectedIndex);
        
//         updateProjectsDisplay(currentFilteredProjects, selectedIndex);
        
//         const event = new CustomEvent('pieSelectionChanged', {
//           detail: {
//             selectedIndex: selectedIndex,
//             selectedYear: selectedIndex === -1 ? null : data[selectedIndex].label
//           }
//         });
//         document.dispatchEvent(event);
//       });
//   });
  
//   data.forEach((d, i) => {
//     const isSelected = i === currentSelectedIndex;
//     const fillColor = isSelected ? highlightColor : baseColorScale(d.label);
    
//     const listItem = legend.append('li')
//       .attr('class', 'legend-item')
//       .style('cursor', 'pointer')
//       .on('click', function() {
//         selectedIndex = selectedIndex === i ? -1 : i;
//         renderPieChart(projectsGiven, selectedIndex);
        
//         updateProjectsDisplay(currentFilteredProjects, selectedIndex);
        
//         const event = new CustomEvent('pieSelectionChanged', {
//           detail: {
//             selectedIndex: selectedIndex,
//             selectedYear: selectedIndex === -1 ? null : data[selectedIndex].label
//           }
//         });
//         document.dispatchEvent(event);
//       });
    
//     listItem.append('span')
//       .attr('class', 'swatch')
//       .style('background-color', fillColor);
    
//     listItem.append('span')
//       .html(`${d.label} <em>(${d.value})</em>`);
//   });
// }

import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const title = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');
let selectedIndex = -1;
let currentFilteredProjects = [...projects]; 

renderProjects(projects, projectsContainer, 'h2');
title.textContent = `${projects.length} Projects`;
renderPieChart(projects, selectedIndex);

searchInput.addEventListener('input', (event) => {
  const query = event.target.value.toLowerCase();
  const filteredProjects = projects.filter((project) => {
    const values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query);
  });
  currentFilteredProjects = filteredProjects;
  
  updateProjectsDisplay(filteredProjects, selectedIndex);
  renderPieChart(filteredProjects, selectedIndex);
});

function updateProjectsDisplay(projectsToDisplay, currentSelectedIndex) {
  if (currentSelectedIndex === -1) {
    renderProjects(projectsToDisplay, projectsContainer, 'h2');
    title.textContent = `${projectsToDisplay.length} Projects`;
  } else {
    const data = d3.rollups(
      projectsToDisplay,
      (v) => v.length,
      (d) => d.year
    ).sort(([a], [b]) => d3.ascending(a, b));
    
    const selectedYear = data[currentSelectedIndex][0]; 
    const yearFilteredProjects = projectsToDisplay.filter(project => project.year === selectedYear);
    
    renderProjects(yearFilteredProjects, projectsContainer, 'h2');
    title.textContent = `${yearFilteredProjects.length} Projects from ${selectedYear}`;
  }
}

function renderPieChart(projectsGiven, currentSelectedIndex) {
  const svg = d3.select('#projects-pie-plot');
  const legend = d3.select('.legend');
  svg.selectAll('*').remove();
  legend.selectAll('*').remove();
  
  const rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  ).sort(([a], [b]) => d3.ascending(a, b));
  
  const data = rolledData.map(([year, count]) => ({
    value: count,
    label: year
  }));
  
  const sliceGenerator = d3.pie().value((d) => d.value);
  const arcData = sliceGenerator(data);
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  
  const visibleYears = data.map(d => d.label);
  const baseColors = d3.schemeTableau10;
  const baseColorScale = d3.scaleOrdinal()
    .domain(visibleYears)
    .range(baseColors.slice(0, visibleYears.length));
  
  const usedColors = new Set(data.map(d => baseColorScale(d.label)));
  
  const possibleHighlightColors = [
    '#FF1493', // Deep Pink
    '#00FFFF', // Cyan
    '#FFD700', // Gold
    '#8A2BE2', // Blue Violet
    '#32CD32', // Lime Green
    '#FF4500', // Orange Red
    '#1E90FF', // Dodger Blue
    '#FF00FF'  // Magenta
  ];
  
  const highlightColor = possibleHighlightColors.find(c => !usedColors.has(c)) || '#000000';
  
  arcData.forEach((d, i) => {
    const isSelected = i === currentSelectedIndex;
    const fillColor = isSelected ? highlightColor : baseColorScale(d.data.label);
    
    svg.append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', fillColor)
      .style('cursor', 'pointer')
      .on('click', function() {
        selectedIndex = selectedIndex === i ? -1 : i;
        renderPieChart(currentFilteredProjects, selectedIndex);
        
        updateProjectsDisplay(currentFilteredProjects, selectedIndex);
        
        const event = new CustomEvent('pieSelectionChanged', {
          detail: {
            selectedIndex: selectedIndex,
            selectedYear: selectedIndex === -1 ? null : data[selectedIndex].label
          }
        });
        document.dispatchEvent(event);
      });
  });
  
  data.forEach((d, i) => {
    const isSelected = i === currentSelectedIndex;
    const fillColor = isSelected ? highlightColor : baseColorScale(d.label);
    
    const listItem = legend.append('li')
      .attr('class', 'legend-item')
      .style('cursor', 'pointer')
      .on('click', function() {
        selectedIndex = selectedIndex === i ? -1 : i;
        renderPieChart(currentFilteredProjects, selectedIndex);
        
        updateProjectsDisplay(currentFilteredProjects, selectedIndex);
        
        const event = new CustomEvent('pieSelectionChanged', {
          detail: {
            selectedIndex: selectedIndex,
            selectedYear: selectedIndex === -1 ? null : data[selectedIndex].label
          }
        });
        document.dispatchEvent(event);
      });
    
    listItem.append('span')
      .attr('class', 'swatch')
      .style('background-color', fillColor);
    
    listItem.append('span')
      .html(`${d.label} <em>(${d.value})</em>`);
  });
}