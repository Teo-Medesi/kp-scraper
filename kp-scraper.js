import puppeteer from "puppeteer";
import dotenv from "dotenv"

class BaseScraper {
  browser;
  page;

  async init() {
    try {
      this.browser = await puppeteer.launch();
      this.page = await this.browser.newPage();
      this.page.setDefaultNavigationTimeout(2 * 60 * 1000);
      await this.page.goto("https://kupujemprodajem.com")
    }
    catch (error) {
      console.error(error);
      await this.browser?.close();
    }
  }

  async close() {
    await this.browser?.close();
  }

}

class KupujemProdajem extends BaseScraper {

  constructor() {
    super();
    dotenv.config();
  }

  async getCategories() {
    try {
      await this.page.waitForSelector(".CategoryList_list__a7SOH")
      const container = await this.page.$(".CategoryList_list__a7SOH");


      let data = await container.$$(".CategoryList_name__ES_NA")
      let categories = [];


      for (const category of data) {
        const name = await category.evaluate(element => element.textContent);
        const url = await category.evaluate(element => element.href)
        categories.push({ name, url });
      }

      return new Categories(categories, this.browser, this.page);
    }
    catch (error) {
      console.error(error);
      await this.browser?.close();
    }
  }

}

class Categories {
  #categories;
  browser;
  page;

  constructor(categories, browser, page) {
    this.#categories = categories;
    this.browser = browser;
    this.page = page;
  }

  getList() {
    return this.#categories;
  }

  async getCategory(name) {
    const category = this.#categories.find(category => category.name === name);
    if (!category) throw new Error("Invalid category name.");

    await this.page.goto(category.url);
    await this.page.waitForSelector(".CategoryBox_name__54eU9");

    const data = await this.page.$$(".CategoryBox_name__54eU9");
    const subCategories = [];


    for (const subCategory of data) {
      const name = await subCategory.evaluate(subCategory => subCategory.textContent)
      const url = await subCategory.evaluate(subCategory => subCategory.href);

      subCategories.push({ name, url })
    }

    return new Category(category.name, category.url, subCategories, this.browser, this.page);

  }
}

class Category {
  name;
  url;
  subCategories;
  browser;
  page;

  constructor(name, url, subCategories, browser, page) {
    this.name = name;
    this.url = url;
    this.subCategories = subCategories;
    this.browser = browser;
    this.page = page;
  }

  async getListings() {

  }
}

class Listings {
  #listings;

  constructor(listings) {
    this.#listings = listings;
  }

  getAllListings() {
    return this.#listings;
  }

  getListing() {

  }
}

class Listing {
  title;
  price;
  location;
  url;
  description;
  author;

  constructor(title, price, location, url, description, author) {
    this.title = title;
    this.price = price;
    this.location = location;
    this.url = url;
    this.description = description;
    this.author = author;
  }

  async getImages() {

  }
}

const getListings = async (category) => {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(2 * 60 * 1000);

    await page.goto(`https://novi.kupujemprodajem.com/${category}/pretraga`);

    await page.waitForSelector('.AdItem_adHolder__NoNLJ', { timeout: 0 });

    // Extract the listings
    const listings = await page.$$('.AdItem_adHolder__NoNLJ');

    const data = [];

    // Iterate over the listings and extract the desired information
    for (const listing of listings) {
      const title = await listing.$eval('.AdItem_name__RhGAZ', (element) => element.textContent);
      const description = await listing.$eval('.AdItem_descriptionHolder__kffJU p', (element) => element.textContent);
      const image = await listing.$eval('.AdItem_imageHolder__LZaKa img', (element) => element.src);
      const price = await listing.$eval('.AdItem_price__jUgxi', (element) => element.textContent);
      const url = await listing.$eval('.AdItem_adTextHolder__Fmra9 a', (element) => element.href);

      data.push({ title, description, image, price, url });
    }

    console.log(data)

    await browser.close();
  }
  catch (error) {
    console.error(error)
    await browser?.close();
  }
}

export default KupujemProdajem;

