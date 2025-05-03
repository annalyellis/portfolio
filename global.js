console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}


let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'cv/', title: 'Resume'},
  { url: 'contact/', title: 'Contact'},
  { url: 'https://github.com/annalyellis', title: 'GitHub'}
];

let nav = document.createElement('nav');
document.body.prepend(nav);

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                  
  : "/portfolio/";         

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  url = !url.startsWith('http') ? BASE_PATH + url : url;

  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;

  if (url.startsWith("http")) {
    a.target = "_blank";
    a.rel = "noopener noreferrer"; 
  }

  nav.append(a);

}

$$("nav a").forEach((a) => {
  a.classList.toggle(
    "current",
    a.host === location.host && a.pathname === location.pathname
  );
});


document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme">
    Theme:
    <select id="theme-select">
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);


const select = document.querySelector('#theme-select');

if ("colorScheme" in localStorage) {
  document.documentElement.style.setProperty('color-scheme', localStorage.colorScheme);
  select.value = localStorage.colorScheme;
}


select.addEventListener('input', function (event) {
  const newScheme = event.target.value;
  console.log('color scheme changed to', newScheme);

  document.documentElement.style.setProperty('color-scheme', newScheme);

  localStorage.colorScheme = newScheme;
});


// importing project data
export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    console.log(response)
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}


// creating a renderProjects function
// export function renderProjects(projects, containerElement, headingLevel = 'h2') {
//   // Your code will go here
//   containerElement.innerHTML = '';
//   projects.forEach(project => {
//     const article = document.createElement('article');
//     article.innerHTML = `
//       <${headingLevel}>${project.title}</${headingLevel}>
//       <img src="${project.image}" alt="${project.title}">
//       <p>${project.description}</p>
//     `;
//     containerElement.appendChild(article);
//   });

// }

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  containerElement.innerHTML = '';
  projects.forEach(project => {
    const article = document.createElement('article');
    article.classList.add('project-item'); // Add a class for potential styling
    article.innerHTML = `
      <${headingLevel} class="project-title">${project.title}</${headingLevel}>
      <img src="${project.image}" alt="${project.title}" class="project-image">
      <div class="project-details">
        <p class="project-description">${project.description}</p>
        <p class="project-year">Year: ${project.year}</p>
      </div>
    `;
    containerElement.appendChild(article);
  });
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}



