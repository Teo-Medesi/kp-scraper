import KupujemProdajem from "./kp-scraper.js";

const run = async () => {
  const kp = new KupujemProdajem();
  await kp.init();

  const categories = await kp.getCategories();
  const tools = await categories.getCategory("Alati i oruđa");
  const listings = await tools.getListings();
  console.log(listings.getAllListings())

  await kp.close();
}

run();
