const os = require("os");
const fs = require("fs/promises");
const { load } = require("cheerio");
const fastify = require("fastify")({ logger: true });

const DISC_URLS_MAX_SIZE = 100;

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

async function scrapeSite(pagesToScrape, baseUrl) {
	const pagesScraped = [];
	const discoveredURLs = new Set();

	while (pagesToScrape.length !== 0 && discoveredURLs.size <= DISC_URLS_MAX_SIZE) {
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

function getBaseUrl(url) {
	try {
		const parsedUrl = new URL(url);
		return `${parsedUrl.protocol}//${parsedUrl.host}/`;
	} catch (error) {
		console.error("Invalid URL:", error);
		return null;
	}
}

fastify.post("/scrape", async function handler(request, reply) {
	const pagesUrls = request.body.pagesUrls;
	const baseUrl = getBaseUrl(pagesUrls[0]);

	console.log(pagesUrls, baseUrl);

	const dataScraped = await scrapeSite(pagesUrls, baseUrl);
	const urlsArray = Array.from(dataScraped);

	reply.send({ urls: urlsArray });
});

fastify.listen({ port: 3000 }, (err) => {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
});
