import KupujemProdajem from "./kp-scraper.js";

const run = async () => {
  const kp = new KupujemProdajem();
  await kp.init();

  const categories = await kp.getCategories();
  const alati = await categories.getCategory("Alati i oruđa");
  console.log(alati.subCategories);

  await kp.close();
}

run();
