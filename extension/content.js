// Questo script gira sulla pagina di LinkedIn/Indeed
console.log("JobPilot Clipper attivo!");

function scrapeJobData() {
  let job = {
    title: "",
    company: "",
    description: "",
    url: window.location.href,
    source: window.location.hostname,
  };

  // --- LOGICA PER LINKEDIN ---
  if (window.location.hostname.includes("linkedin.com")) {
    // Titolo (cerca selettori comuni di LinkedIn)
    const titleEl =
      document.querySelector(".job-details-jobs-unified-top-card__job-title") ||
      document.querySelector("h1");
    if (titleEl) job.title = titleEl.innerText.trim();

    // Azienda
    const companyEl =
      document.querySelector(
        ".job-details-jobs-unified-top-card__company-name",
      ) || document.querySelector(".topcard__org-name-link");
    if (companyEl) job.company = companyEl.innerText.trim();

    // Descrizione
    const descEl =
      document.querySelector("#job-details") ||
      document.querySelector(".jobs-description");
    if (descEl) job.description = descEl.innerText.trim();
  }

  // --- LOGICA PER INDEED ---
  else if (window.location.hostname.includes("indeed.com")) {
    const titleEl = document.querySelector(".jobsearch-JobInfoHeader-title");
    if (titleEl) job.title = titleEl.innerText.trim();

    const companyEl = document.querySelector('[data-company-name="true"]');
    if (companyEl) job.company = companyEl.innerText.trim();

    const descEl = document.querySelector("#jobDescriptionText");
    if (descEl) job.description = descEl.innerText.trim();
  }

  // Fallback generico
  if (!job.title) job.title = document.title;

  return job;
}

// Ascolta messaggi dal popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SCRAPE") {
    const data = scrapeJobData();
    sendResponse(data);
  }
});
