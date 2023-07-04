import KupujemProdajem from "./kp-scraper.js";

const run = async () => {
  const kp = new KupujemProdajem();
  await kp.init();

  // run code here

  await kp.close();
}

run();
