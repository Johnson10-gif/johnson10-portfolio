const GITHUB_USERNAME = "johnson10-gif";
const PROJECTS_ENDPOINT = `https://api.github.com/users/${GITHUB_USERNAME}/repos`;
const projectGrid = document.querySelector("#project-grid");
const projectMessage = document.querySelector("#project-message");
const projectNote = document.querySelector("#project-note");

function safeWebUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function formatUpdatedDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" }).format(date);
}

function createProjectCard(repo) {
  const card = document.createElement("article");
  card.className = "project-card";
  const websiteUrl = safeWebUrl(repo.homepage);
  const repositoryUrl = safeWebUrl(repo.html_url);
  const primaryUrl = websiteUrl || repositoryUrl;
  const tags = [repo.language, ...(repo.topics || []).slice(0, 2)].filter(Boolean);

  const top = document.createElement("div");
  top.className = "project-card-top";
  top.innerHTML = '<span class="project-folder" aria-hidden="true">▱</span><span>PROJECT</span>';

  const title = document.createElement("h3");
  title.textContent = repo.name || "Project";

  const description = document.createElement("p");
  description.className = "project-description";
  description.textContent = repo.description || "No description provided for this project yet.";

  const tagList = document.createElement("div");
  tagList.className = "project-tags";
  for (const tag of tags) {
    const item = document.createElement("span");
    item.textContent = tag;
    tagList.append(item);
  }

  const footer = document.createElement("div");
  footer.className = "project-card-footer";
  const updated = document.createElement("span");
  updated.textContent = `Updated ${formatUpdatedDate(repo.updated_at)}`;
  footer.append(updated);

  const links = document.createElement("span");
  links.className = "project-links";
  if (primaryUrl) {
    const primaryLink = document.createElement("a");
    primaryLink.href = primaryUrl;
    primaryLink.target = "_blank";
    primaryLink.rel = "noopener noreferrer";
    primaryLink.textContent = websiteUrl ? "Live site ↗" : "View repo ↗";
    links.append(primaryLink);
  }
  if (websiteUrl && repositoryUrl) {
    const sourceLink = document.createElement("a");
    sourceLink.href = repositoryUrl;
    sourceLink.target = "_blank";
    sourceLink.rel = "noopener noreferrer";
    sourceLink.textContent = "Code";
    links.append(sourceLink);
  }
  footer.append(links);

  card.append(top, title, description, tagList, footer);
  return card;
}

function showMessage(message, className) {
  projectMessage.className = `project-message ${className}`;
  projectMessage.textContent = message;
  projectGrid.replaceChildren(projectMessage);
}

async function loadProjects() {
  try {
    const repos = [];
    let page = 1;
    let currentPage;
    do {
      const response = await fetch(`${PROJECTS_ENDPOINT}?per_page=100&page=${page}&sort=updated`, {
        headers: { Accept: "application/vnd.github+json" },
        cache: "force-cache"
      });
      if (!response.ok) {
        throw new Error(`GitHub API returned status ${response.status}.`);
      }
      currentPage = await response.json();
      if (!Array.isArray(currentPage)) {
        throw new Error("GitHub returned an unexpected response.");
      }
      repos.push(...currentPage);
      page += 1;
    } while (currentPage.length === 100);

    if (repos.length === 0) {
      showMessage("", "is-empty");
      projectMessage.textContent = "";
      const message = document.createElement("p");
      message.append("There are no public repositories on GitHub for ");
      const profile = document.createElement("a");
      profile.href = `https://github.com/${GITHUB_USERNAME}`;
      profile.target = "_blank";
      profile.rel = "noopener noreferrer";
      profile.textContent = GITHUB_USERNAME;
      message.append(profile, ". Projects will appear here when repositories are made public.");
      projectMessage.append(message);
      return;
    }
    const publicRepos = repos.filter((repo) => !repo.private && !repo.fork);
    const cards = publicRepos.map(createProjectCard);
    if (cards.length === 0) {
      showMessage("No public original repositories are available yet.", "is-empty");
      return;
    }
    projectGrid.replaceChildren(...cards);
    projectNote.hidden = false;
  } catch (error) {
    showMessage("", "is-error");
    projectMessage.textContent = "";
    const message = document.createElement("p");
    message.append("Unable to load GitHub projects. Please ");
    const profile = document.createElement("a");
    profile.href = `https://github.com/${GITHUB_USERNAME}?tab=repositories`;
    profile.target = "_blank";
    profile.rel = "noopener noreferrer";
    profile.textContent = "view the repositories directly on GitHub";
    message.append(profile, ". ");
    const details = document.createElement("span");
    details.textContent = error instanceof Error ? error.message : "Please try again later.";
    message.append(details);
    projectMessage.append(message);
  }
}

const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector("#nav-links");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    navLinks.classList.toggle("is-open", !isExpanded);
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menuToggle.setAttribute("aria-expanded", "false");
      navLinks.classList.remove("is-open");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      menuToggle.setAttribute("aria-expanded", "false");
      navLinks.classList.remove("is-open");
      menuToggle.focus();
    }
  });
}

loadProjects();
