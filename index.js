import KupujemProdajem from "./kp-scraper.js";
import { saveToFolder } from "./utils/utils.js";

const run = async () => {
  const kp = new KupujemProdajem();
  await kp.init();

  const categories = await kp.getCategories();
  const tools = await categories.getCategory("Alati i oruđa");

  const listings = await tools.getListings();

  const url = "https://novi.kupujemprodajem.com/alati-i-orudja/elektricni/masina-za-sisanje-ovaca-ruska-800w-nova/oglas/150762602?filterId=2139960553"
  const listing = await listings.getListing(url);

  const images = await listing.getImages();
  saveToFolder(images, "json/images.json");

  await kp.close();
}

run();
