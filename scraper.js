const os = require("os");
const fs = require("fs/promises");
const { load } = require("cheerio");
const cors = require("@fastify/cors");
const fastify = require("fastify")({ logger: true });

// Constants
const MAX_RESULTS = 50;

// CORS configuration
fastify.register(cors, {
	origin: ["https://localhost:5173", "https://localhost:4173", "https://localhost:8000"],
	methods: ["POST"],
	allowedHeaders: ["Content-Type"],
});

// Start the server
fastify.listen({ port: 3000 }, (err) => {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
});

// POST /scrape
fastify.post("/api/scrape", async function handler(request, reply) {
	const pagesUrls = request.body.pagesUrls;
	const baseUrl = getBaseUrl(pagesUrls[0]);

	const dataScraped = await scrapeSite(pagesUrls, baseUrl);
	const urlsArray = Array.from(dataScraped);

	reply.send({ urls: urlsArray });
});

// Scraper functions
async function scrapeSite(pagesToScrape, baseUrl) {
	const pagesScraped = [];
	const discoveredURLs = new Set();

	while (pagesToScrape.length !== 0 && discoveredURLs.size <= MAX_RESULTS) {
		const currentPage = pagesToScrape.pop();
		console.log(`Scraping page: ${currentPage}`);

		const pageDiscoveredURLs = await scrapePage(currentPage, baseUrl);
		pageDiscoveredURLs.forEach((url) => {
			discoveredURLs.add(url);
			if (!pagesScraped.includes(url) && url !== currentPage) {
				pagesToScrape.push(url);
			}
		});
		console.log(`${pageDiscoveredURLs.length} URLs found`);

		pagesScraped.push(currentPage);
		console.log(`${discoveredURLs.size} URLs discovered so far\n`);
	}

	const csvContent = [...discoveredURLs].join(os.EOL);
	await fs.writeFile("output/links.csv", csvContent);

	return discoveredURLs;
}

async function scrapePage(pageURL, rootUrl) {
	const response = await fetch(pageURL);
	const html = await response.text();
	const $ = load(html);

	const discoveredHTMLAElements = $("a[href]");

	const discoveredURLs = [];
	discoveredHTMLAElements.each((_, a) => {
		discoveredURLs.push($(a).attr("href"));
	});

	const filteredDiscoveredURLs = discoveredURLs.filter((url) => {
		return (
			url.startsWith(rootUrl) &&
			(!url.startsWith(`${rootUrl}/wp-admin`) || url === `${rootUrl}/wp-admin/admin-ajax.php`)
		);
	});

	return filteredDiscoveredURLs;
}

function getBaseUrl(url) {
	try {
		const parsedUrl = new URL(url);
		return `${parsedUrl.protocol}//${parsedUrl.host}/`;
	} catch (error) {
		console.error("Invalid URL:", error);
		return null;
	}
}
