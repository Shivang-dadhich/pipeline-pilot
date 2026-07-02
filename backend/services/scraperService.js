import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Scrapes a public website URL and returns the clean text context.
 * @param {string} url - The target website URL.
 * @returns {Promise<string>} Clean text content from the site.
 */
export async function scrapeWebsite(url) {
  try {
    // Ensure the URL has a protocol
    const targetUrl = url.startsWith("http") ? url : `https://${url}`;

    // Fetch HTML with a realistic User-Agent to prevent basic blocks
    const { data } = await axios.get(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 8000, // 8-second timeout
    });

    const $ = cheerio.load(data);

    // Strip script, style, and nav tags to keep only core content
    $("script, style, nav, footer, header").remove();

    // Get text, collapse whitespace into clean single lines
    const cleanText = $("body").text().replace(/\s+/g, " ").trim();

    // Return the first 3000 characters to keep context clean and within optimal token limits
    return cleanText.substring(0, 3000);
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    // Return a fallback message so the agent can still try to infer from the URL if down
    return `Could not load website directly. URL provided: ${url}`;
  }
}
