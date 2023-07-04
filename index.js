import KupujemProdajem from "./kp-scraper.js";
import { saveToFolder } from "./utils/utils.js";

const run = async () => {
  const kp = new KupujemProdajem();
  await kp.init();

  const categories = await kp.getCategories();
  const tools = await categories.getCategory("Alati i oruđa");

  let listings = await tools.getListings();
  listings = await listings.getAllListings();

  saveToFolder(listings, "json/listings.json");


  await kp.close();
}

run();
