import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
let xScale;
let yScale;

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line), // or just +row.line
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/vis-society/lab-7/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };
      Object.defineProperty(ret, 'lines', {
        value: lines,
        writable: false,
        configurable: false,
        enumerable: false
      });
      return ret;
    });
}

function computeStats(data, commits) {
  // Basic stats
  const numCommits = commits.length;
  
  // File statistics
  const uniqueFiles = [...new Set(data.map(d => d.file || d.path))];
  const numFiles = uniqueFiles.length;
  
  // Group lines by file
  const fileGroups = d3.group(data, d => d.file || d.path);
  
  // Maximum file length in lines
  const fileLengths = Array.from(fileGroups).map(([file, lines]) => ({
    file,
    lineCount: lines.length
  }));
  
  const maxFileLength = d3.max(fileLengths, d => d.lineCount);
  const longestFile = fileLengths.find(d => d.lineCount === maxFileLength)?.file || 'Unknown';
  
  // Time of day analysis
  const commitsByHour = d3.rollup(
    commits,
    v => v.length,
    d => d.datetime.getHours()
  );
  
  // Find the hour with the most commits
  let maxCommitHour = 0;
  let maxCommitCount = 0;
  commitsByHour.forEach((count, hour) => {
    if (count > maxCommitCount) {
      maxCommitCount = count;
      maxCommitHour = hour;
    }
  });
  
  // Determine time of day category
  let timeOfDay;
  if (maxCommitHour >= 5 && maxCommitHour < 12) {
    timeOfDay = "Morning";
  } else if (maxCommitHour >= 12 && maxCommitHour < 17) {
    timeOfDay = "Afternoon";
  } else if (maxCommitHour >= 17 && maxCommitHour < 21) {
    timeOfDay = "Evening";
  } else {
    timeOfDay = "Night";
  }
  
  // Day of week analysis
  const commitsByDay = d3.rollup(
    commits,
    v => v.length,
    d => d.datetime.getDay()
  );
  
  // Find the day with the most commits
  let maxCommitDay = 0;
  maxCommitCount = 0;
  commitsByDay.forEach((count, day) => {
    if (count > maxCommitCount) {
      maxCommitCount = count;
      maxCommitDay = day;
    }
  });
  
  // Convert day number to name
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const busyDay = daysOfWeek[maxCommitDay];
  
  return {
    "COMMITS": numCommits,
    "FILES": numFiles,
    "LONGEST FILE": `${longestFile}`,
    "MAX FILE LENGTH": `${maxFileLength} lines`,
    "MOST ACTIVE TIME": timeOfDay,
    "MOST ACTIVE DAY": busyDay
  };
}

function renderStats(data, commits) {
  // Calculate stats
  const stats = computeStats(data, commits);
  
  // Create container for stats
  const container = d3.select('#stats')
    .append('div')
    .attr('class', 'summary');
  
  // Add each stat to the container
  for (const [label, value] of Object.entries(stats)) {
    const stat = container.append('div').attr('class', 'stat');
    stat.append('div').attr('class', 'stat-label').text(label);
    stat.append('div').attr('class', 'stat-value').text(value);
  }
}

function setupTooltip() {
  // Check if the tooltip already exists
  let tooltip = document.getElementById('commit-tooltip');
  
  if (!tooltip) {
    // Create the tooltip structure as per instructions
    tooltip = document.createElement('dl');
    tooltip.id = 'commit-tooltip';
    tooltip.className = 'info tooltip';
    tooltip.hidden = true;  // Initially hidden
    
    // Commit info
    const dtCommit = document.createElement('dt');
    dtCommit.textContent = 'Commit';
    
    const ddCommit = document.createElement('dd');
    const commitLink = document.createElement('a');
    commitLink.id = 'commit-link';
    commitLink.target = '_blank';
    ddCommit.appendChild(commitLink);
    
    // Date info
    const dtDate = document.createElement('dt');
    dtDate.textContent = 'Date';
    
    const ddDate = document.createElement('dd');
    ddDate.id = 'commit-date';
    
    // Time info
    const dtTime = document.createElement('dt');
    dtTime.textContent = 'Time';
    
    const ddTime = document.createElement('dd');
    ddTime.id = 'commit-time';
    
    // Author info
    const dtAuthor = document.createElement('dt');
    dtAuthor.textContent = 'Author';
    
    const ddAuthor = document.createElement('dd');
    ddAuthor.id = 'commit-author';
    
    // Lines edited info
    const dtLines = document.createElement('dt');
    dtLines.textContent = 'Lines edited';
    
    const ddLines = document.createElement('dd');
    ddLines.id = 'commit-lines';
    
    // Append all elements to tooltip
    tooltip.appendChild(dtCommit);
    tooltip.appendChild(ddCommit);
    tooltip.appendChild(dtDate);
    tooltip.appendChild(ddDate);
    tooltip.appendChild(dtTime);
    tooltip.appendChild(ddTime);
    tooltip.appendChild(dtAuthor);
    tooltip.appendChild(ddAuthor);
    tooltip.appendChild(dtLines);
    tooltip.appendChild(ddLines);
    
    // Append tooltip to body
    document.body.appendChild(tooltip);
    
    // Add CSS styles 
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      /* Tooltip info styling */
      dl.info {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.5em 1em;
        margin: 0;
        padding: 1em;
        font-family: sans-serif;
        transition-duration: 500ms;
        transition-property: opacity, visibility;
      }
      
      dl.info dt {
        font-weight: bold;
        color: #666;
        margin: 0;
      }
      
      dl.info dd {
        margin: 0;
        font-weight: normal;
      }
      
      /* Tooltip positioning and appearance */
      .tooltip {
        position: fixed;
        background-color: rgba(255, 255, 255, 0.95);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
        border-radius: 6px;
        z-index: 1000;
        max-width: 300px;
        backdrop-filter: blur(4px);
      }
      
      /* Hidden tooltip state */
      dl.info[hidden]:not(:hover, :focus-within) {
        opacity: 0;
        visibility: hidden;
      }
      
      /* Circle hover styles */
      circle {
        transition: 200ms;
        transform-origin: center;
        transform-box: fill-box;
      }
      
      circle.hover, circle:hover {
        transform: scale(1.5);
      }
    `;
    
    document.head.appendChild(styleEl);
  }
  
  return tooltip;
}

function isCommitSelected(selection, commit) {
    if (!selection) return false;
  
    const [[x0, y0], [x1, y1]] = selection;
    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);
    return x >= x0 && x <= x1 && y >= y0 && y <= y1;
  }
  

function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  
  // Create SVG
  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

 // Add brush interaction
const brush = d3.brush().on('start brush end', brushed);

svg.append('g')
.attr('class', 'brush')
.call(brush);

// Raise the dots above the overlay so tooltips work
svg.selectAll('.dots, .brush ~ *').raise();

  
    
  // Set up margin and usable area
  const margin = { top: 20, right: 30, bottom: 50, left: 60 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };
  
  // Create scales
  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();
  
  yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);
  
  // Add gridlines BEFORE the axes
  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);
  
  // Create gridlines as an axis with no labels and full-width ticks
  gridlines.call(
    d3.axisLeft(yScale)
      .tickFormat('')
      .tickSize(-usableArea.width)
      .tickValues(d3.range(0, 25, 3)) 
  )
  .style('opacity', 0.2)
  .style('stroke-dasharray', '2,2');
  
  // Create and add axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00')
    .tickValues(d3.range(0, 25, 3)); 
  
  // Add X axis
  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);
  
  // Add Y axis
  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);
  
  // Add axis labels
  svg.append('text')
    .attr('class', 'x-label')
    .attr('text-anchor', 'middle')
    .attr('x', usableArea.left + usableArea.width / 2)
    .attr('y', height - 10)
    .text('Date');
  
  svg.append('text')
    .attr('class', 'y-label')
    .attr('text-anchor', 'middle')
    .attr('transform', `translate(${margin.left / 3}, ${usableArea.top + usableArea.height / 2}) rotate(-90)`)
    .text('Time of Day');

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
//   const rScale = d3.scaleLinear().domain([minLines, maxLines]).range([2, 30]);
const rScale = d3
  .scaleSqrt() 
  .domain([minLines, maxLines])
  .range([2, 30]);

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  // Create dots with hover effects
  const dots = svg.append('g').attr('class', 'dots');
  dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    // .attr('r', 5)
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .style('cursor', 'pointer')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1); 
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
      
      d3.select(event.target)
        .classed('hover', true);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
      
      // Reset dot appearance
      d3.select(event.target)
        .classed('hover', false);
    })
    .on('click', (event, commit) => {
      window.open(commit.url, '_blank');
    });

  const legend = svg
    .append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${usableArea.right - 120}, ${usableArea.top + 20})`);
  
  legend
    .append('circle')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('r', 5)
    .attr('fill', 'steelblue');
  
  legend
    .append('text')
    .attr('x', 10)
    .attr('y', 5)
    .text('Commit');
}

function renderSelectionCount(selection, commits) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];
  
    const countElement = document.querySelector('#selection-count');
    countElement.textContent = `${
      selectedCommits.length 
    } commits selected`;
  
    return selectedCommits;
  }
  function renderLanguageBreakdown(selection, commits) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];
    const container = document.getElementById('language-breakdown');
  
    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);
  
    const breakdown = d3.rollup(
      lines,
      (v) => v.length,
      (d) => d.type,
    );
  
    container.innerHTML = '';
  
    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);
  
      container.innerHTML += `
              <dt>${language}</dt>
              <dd>${count} lines (${formatted})</dd>
          `;
    }
  }
  

  
  function brushed(event) {
    const selection = event.selection;
    d3.selectAll('circle').classed('selected', (d) =>
      isCommitSelected(selection, d),
    );
    renderSelectionCount(selection);
    renderLanguageBreakdown(selection);
  }

  

  
  
  
  

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');
  
  if (!commit || Object.keys(commit).length === 0) return;
  
  if (link) {
    link.href = commit.url;
    link.textContent = commit.id;  
  }
  
  if (date) {
    date.textContent = commit.datetime?.toLocaleString('en', {
      dateStyle: 'full',
    }) || 'Unknown';
  }
  
  if (time) {
    time.textContent = commit.time || commit.datetime?.toLocaleTimeString() || 'Unknown';
  }
  
  if (author) {
    author.textContent = commit.author || 'Unknown';
  }
  
  if (lines) {
    lines.textContent = commit.totalLines || 'Unknown';
  }
}

function setupCommitPanel() {
  return null;
}


async function init() {
  try {
    // Create structure
    const statsEl = document.getElementById('stats') || 
      (() => {
        const el = document.createElement('div');
        el.id = 'stats';
        document.body.appendChild(el);
        return el;
      })();
      
    const chartEl = document.getElementById('chart') || 
      (() => {
        const el = document.createElement('div');
        el.id = 'chart';
        document.body.appendChild(el);
        return el;
      })();
    
    setupTooltip();
    
    // Load data
    const data = await loadData();
    
    // Process commits
    const commits = processCommits(data);
    
    // Render statistics and scatter plot
    renderStats(data, commits);
    renderScatterPlot(data, commits);
  } catch (error) {
    console.error("Error initializing:", error);
    

    const exampleData = generateExampleData();
    const exampleCommits = generateExampleCommits();
    

    renderStats(exampleData, exampleCommits);
    renderScatterPlot(exampleData, exampleCommits);
  }
}

function generateExampleData() {
  return Array.from({ length: 120 }, (_, i) => ({
    file: ["main.js", "style.css", "index.html", "utils.js", "app.js"][i % 5],
    line: (i % 30) + 1,
    length: 30 + Math.floor(Math.random() * 100),
    depth: Math.floor(Math.random() * 5) + 1,
    commit: `commit-${Math.floor(i / 10) + 1}`,
    author: ["Alice", "Bob", "Charlie", "Diana"][Math.floor(i / 30)],
    datetime: new Date(2023, Math.floor(i / 30), (i % 30) + 1, (i % 24)),
    date: `2023-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
    time: `${String(i % 24).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
    timezone: "-05:00"
  }));
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  if (tooltip) {
    tooltip.hidden = !isVisible;
  }
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  if (tooltip) {
    tooltip.style.left = `${event.clientX + 15}px`;
    tooltip.style.top = `${event.clientY + 15}px`;
  }
}


document.addEventListener('DOMContentLoaded', init);


