import KupujemProdajem from "./kp-scraper.js";

const example = async () => {
  const kp = new KupujemProdajem();
  await kp.init();

  // run code here

  await kp.close();
}

example();
