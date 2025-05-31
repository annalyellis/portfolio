import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

let xScale;
let yScale;
let commitProgress = 100;
let timeScale = null;
let commitMaxTime = null;
let allCommits = [];

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
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
  const numCommits = commits.length;
  const uniqueFiles = [...new Set(data.map(d => d.file || d.path))];
  const numFiles = uniqueFiles.length;
  const fileGroups = d3.group(data, d => d.file || d.path);
  const fileLengths = Array.from(fileGroups).map(([file, lines]) => ({ file, lineCount: lines.length }));
  const maxFileLength = d3.max(fileLengths, d => d.lineCount);
  const longestFile = fileLengths.find(d => d.lineCount === maxFileLength)?.file || 'Unknown';
  const commitsByHour = d3.rollup(commits, v => v.length, d => d.datetime.getHours());

  let maxCommitHour = 0;
  let maxCommitCount = 0;
  commitsByHour.forEach((count, hour) => {
    if (count > maxCommitCount) {
      maxCommitCount = count;
      maxCommitHour = hour;
    }
  });

  let timeOfDay;
  if (maxCommitHour >= 5 && maxCommitHour < 12) timeOfDay = "Morning";
  else if (maxCommitHour >= 12 && maxCommitHour < 17) timeOfDay = "Afternoon";
  else if (maxCommitHour >= 17 && maxCommitHour < 21) timeOfDay = "Evening";
  else timeOfDay = "Night";

  const commitsByDay = d3.rollup(commits, v => v.length, d => d.datetime.getDay());
  let maxCommitDay = 0;
  maxCommitCount = 0;
  commitsByDay.forEach((count, day) => {
    if (count > maxCommitCount) {
      maxCommitCount = count;
      maxCommitDay = day;
    }
  });

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
  const stats = computeStats(data, commits);
  const container = d3.select('#stats').append('div').attr('class', 'summary');
  for (const [label, value] of Object.entries(stats)) {
    const stat = container.append('div').attr('class', 'stat');
    stat.append('div').attr('class', 'stat-label').text(label);
    stat.append('div').attr('class', 'stat-value').text(value);
  }
}

function setupTooltip() {
  let tooltip = document.getElementById('commit-tooltip');
  
  if (!tooltip) {
    tooltip = document.createElement('dl');
    tooltip.id = 'commit-tooltip';
    tooltip.className = 'info tooltip';
    tooltip.hidden = true;
    
    const dtCommit = document.createElement('dt');
    dtCommit.textContent = 'Commit';
    
    const ddCommit = document.createElement('dd');
    const commitLink = document.createElement('a');
    commitLink.id = 'commit-link';
    commitLink.target = '_blank';
    ddCommit.appendChild(commitLink);
    
    const dtDate = document.createElement('dt');
    dtDate.textContent = 'Date';
    
    const ddDate = document.createElement('dd');
    ddDate.id = 'commit-date';
    
    const dtTime = document.createElement('dt');
    dtTime.textContent = 'Time';
    
    const ddTime = document.createElement('dd');
    ddTime.id = 'commit-time';
    
    const dtAuthor = document.createElement('dt');
    dtAuthor.textContent = 'Author';
    
    const ddAuthor = document.createElement('dd');
    ddAuthor.id = 'commit-author';
    
    const dtLines = document.createElement('dt');
    dtLines.textContent = 'Lines edited';
    
    const ddLines = document.createElement('dd');
    ddLines.id = 'commit-lines';
    
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
      
      circle.selected {
        stroke: #ff6b35;
        stroke-width: 2;
      }
    `;
    
    document.head.appendChild(styleEl);
  }
  
  return tooltip;
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

function isCommitSelected(selection, commit) {
  if (!selection) return false;
  const [[x0, y0], [x1, y1]] = selection;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function renderSelectionCount(selection, commits) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];
  
  const countElement = document.querySelector('#selection-count');
  if (countElement) {
    countElement.textContent = `${selectedCommits.length} commits selected`;
  }
  
  return selectedCommits;
}

function renderLanguageBreakdown(selection, commits) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];
  const container = document.getElementById('language-breakdown');
  
  if (!container) return;
  
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
  const visibleCommits = allCommits.filter(d => {
    const circle = d3.select(`circle[data-commit="${d.id}"]`);
    return !circle.empty() && circle.style('display') !== 'none';
  });
  
  d3.selectAll('circle').classed('selected', (d) =>
    isCommitSelected(selection, d)
  );
  renderSelectionCount(selection, visibleCommits);
  renderLanguageBreakdown(selection, visibleCommits);
}

function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  
  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  // Add brush interaction
  const brush = d3.brush().on('start brush end', brushed);
  svg.append('g').attr('class', 'brush').call(brush);
    
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
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .attr('data-commit', d => d.id)
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
      
      d3.select(event.target)
        .classed('hover', false);
    })
    .on('click', (event, commit) => {
      window.open(commit.url, '_blank');
    });

  // Add legend
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

  // Raise the dots above the brush overlay so tooltips work
  svg.selectAll('.dots, .brush ~ *').raise();
}

let filteredCommits = allCommits;

function onTimeSliderChange() {
  const slider = document.getElementById('commit-progress');
  const timeDisplay = document.getElementById('commit-time');
  const anyTimeLabel = document.getElementById('any-time');

  if (!slider) return;

  commitProgress = +slider.value;

  if (timeScale) {
    commitMaxTime = timeScale.invert(commitProgress);

    if (commitProgress === 100) {
      if (anyTimeLabel) anyTimeLabel.style.display = 'block';
      if (timeDisplay) timeDisplay.textContent = '';
      // When showing all commits, use all commits
      filteredCommits = allCommits;
    } else {
      if (anyTimeLabel) anyTimeLabel.style.display = 'none';
      if (timeDisplay) {
        timeDisplay.textContent = commitMaxTime.toLocaleString(undefined, {
          dateStyle: 'long',
          timeStyle: 'short'
        });
      }
      // Filter the commits based on time
      filteredCommits = allCommits.filter(d => d.datetime <= commitMaxTime);
    }

    // Update circle visibility based on filtered commits
    d3.selectAll('circle')
      .style('display', d => {
        return d && filteredCommits.some(commit => commit.id === d.id) ? null : 'none';
      });
    
    // Clear selection when time changes
    d3.selectAll('circle').classed('selected', false);
    renderSelectionCount(null, filteredCommits);
    renderLanguageBreakdown(null, filteredCommits);
    updateFileDisplay(filteredCommits);
  }
  
}

async function init() {
  try {
    setupTooltip();
    
    const data = await loadData();
    const commits = processCommits(data);
    allCommits = commits;

    renderStats(data, commits);
    renderScatterPlot(data, commits);

    timeScale = d3.scaleTime()
      .domain(d3.extent(commits, d => d.datetime))
      .range([0, 100]);

    const slider = document.getElementById('commit-progress');
    if (slider) {
      slider.addEventListener('input', onTimeSliderChange);
      onTimeSliderChange();
    }
    updateFileDisplay(allCommits);
    
  } catch (error) {
    console.error("Error initializing:", error);
  }
}

document.addEventListener('DOMContentLoaded', init);


function updateFileDisplay(filteredCommits) {
  // lab 8 step 2
  // after initializing filteredCommits
  let lines = filteredCommits.flatMap((d) => d.lines);
  let files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => {
      return { name, lines };
    })
    .sort((a, b) => b.lines.length - a.lines.length);


    let filesContainer = d3
    .select('#files')
    .selectAll('div')
    .data(files, (d) => d.name)
    .join(
      // This code only runs when the div is initially rendered
      (enter) =>
        enter.append('div').call((div) => {
          div.append('dt').append('code');
          div.append('dd');
        }),
    );

  // This code updates the div info
  filesContainer.select('dt > code').text((d) => d.name);
  // filesContainer.select('dd').text((d) => `${d.lines.length} lines`);
  // Set the file name and line count in the <dt> with <code> and <small>
  filesContainer.select('dt').html(d =>
    `<code>${d.name}</code><small>${d.lines.length} lines</small>`
  );

  let colors = d3.scaleOrdinal(d3.schemeTableau10);
  // Render one <div class="loc"> per line in the <dd>
  filesContainer
    .select('dd')
    .selectAll('div')
    .data(d => d.lines)
    .join('div')
    .attr('class', 'loc')
    .attr('style', (d) => `--color: ${colors(d.type)}`);

        }


d3.select('#scatter-story')
  .selectAll('.step')
  .data(commits)
  .join('div')
  .attr('class', 'step')
  .html(
    (d, i) => `
		On ${d.datetime.toLocaleString('en', {
      dateStyle: 'full',
      timeStyle: 'short',
    })},
		I made <a href="${d.url}" target="_blank">${
      i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'
    }</a>.
		I edited ${d.totalLines} lines across ${
      d3.rollups(
        d.lines,
        (D) => D.length,
        (d) => d.file,
      ).length
    } files.
		Then I looked over all I had made, and I saw that it was very good.
	`,
  );



  function onStepEnter(response) {
    console.log(response.element.__data__.datetime);
  }
  
  const scroller = scrollama();
  scroller
    .setup({
      container: '#scrolly-1',
      step: '#scrolly-1 .step',
    })
    .onStepEnter(onStepEnter);

