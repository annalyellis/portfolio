console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// //2.1
// navLinks = $$("nav a")

// //2.2
// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname,
// );

// //2.3
// currentLink.classList.add('current');
// currentLink?.classList.add('current');

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

  // nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);
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

