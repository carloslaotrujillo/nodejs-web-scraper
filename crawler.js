const { load } = require("cheerio");
const fs = require("fs/promises");
const os = require("os");

const BASE_URL = "https://scrapeme.live/"
const PAGES_TO_CRAWL = ["https://scrapeme.live/shop"]

// link discovery function
async function crawlPage(pageURL) {
  // parse the HTML document returned by the server
  const response = await fetch(pageURL);
  const html = await response.text();
  const $ = load(html);

  // extract all link HTML elements from the page
  const discoveredHTMLAElements = $("a[href]");

  // get the discovered page URLs
  const discoveredURLs = [];
  discoveredHTMLAElements.each((_, a) => {
    discoveredURLs.push($(a).attr("href"));
  });

  // filter out the undesired URLs
  const baseURL = BASE_URL;
  const filteredDiscoveredURLs = discoveredURLs.filter((url) => {
    return (
      url.startsWith(baseURL) &&
      (!url.startsWith(`${baseURL}/wp-admin`) ||
        url === `${baseURL}/wp-admin/admin-ajax.php`)
    );
  });

  return filteredDiscoveredURLs;
}

async function crawlSite() {
  // define the supporting data structures  
  const pagesToCrawl = PAGES_TO_CRAWL;
  const pagesCrawled = [];
  const discoveredURLs = new Set();

  // implement the crawling logic
  while (pagesToCrawl.length !== 0 && discoveredURLs.size <= 300) {
    const currentPage = pagesToCrawl.pop();
    console.log(`Crawling page: ${currentPage}`);

    const pageDiscoveredURLs = await crawlPage(currentPage);
    pageDiscoveredURLs.forEach((url) => {
      discoveredURLs.add(url);
      if (!pagesCrawled.includes(url) && url !== currentPage) {
        pagesToCrawl.push(url);
      }
    });
    console.log(`${pageDiscoveredURLs.length} URLs found`);

    pagesCrawled.push(currentPage);
    console.log(`${discoveredURLs.size} URLs discovered so far`);
  }

  // convert the set to an array and join its values
  // to generate CSV content
  const csvContent = [...discoveredURLs].join(os.EOL);

  // export the CSV string to an output file
  await fs.writeFile("output.csv", csvContent);
}

crawlSite();
