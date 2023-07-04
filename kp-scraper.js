import puppeteer from "puppeteer";
import dotenv from "dotenv"
import { getCategoryId, transformString } from "./utils/utils.js";

class BaseScraper {
  browser;
  page;

  async init() {
    try {
      this.browser = await puppeteer.launch();
      this.page = await this.browser.newPage();
      this.page.setDefaultNavigationTimeout(2 * 60 * 1000);
      await this.page.goto("https://novi.kupujemprodajem.com")
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
    const transformedName = transformString(this.name);
    const categoryId = getCategoryId(transformedName);

    console.log("🚀 ~ file: kp-scraper.js:116 ~ Category ~ getListings ~ transformedName:", transformedName);

    await this.page.goto(`https://novi.kupujemprodajem.com/${transformedName}/pretraga?categoryId=${categoryId}`);
    const data = await this.page.$$(".AdItem_adHolder__NoNLJ");

    console.log("🚀 ~ file: kp-scraper.js:119 ~ Category ~ getListings ~ `https://novi.kupujemprodajem.com/${transformedName}/pretraga`:", `https://novi.kupujemprodajem.com/${transformedName}/pretraga`);
    console.log("🚀 ~ file: kp-scraper.js:118 ~ Category ~ getListings ~ data:", data);

    const listings = [];

    for (const listing of data) {

      console.log("🚀 ~ file: kp-scraper.js:123 ~ Category ~ getListings ~ listing:", listing);

      const titleElement = await listing?.$(".AdItem_name__RhGAZ");
      const title = await titleElement?.evaluate(element => element.textContent);

      const urlElemement = await listing?.$(".AdItem_adTextHolder__Fmra9 a");
      const url = await urlElemement?.evaluate(element => element.href);

      const imageElement = await listing?.$("img");
      const coverImage = await imageElement?.evaluate(element => element.src);

      const descriptionElement = await listing?.$(".AdItem_adTextHolder__Fmra9 p");
      const description = await descriptionElement?.evaluate(element => element.textContent);

      const priceElement = await listing?.$(".AdItem_price__jUgxi");
      const price = await priceElement?.evaluate(element => element.textContent);

      const locationElement = await listing?.$(".AdItem_originAndPromoLocation__HgtYj");
      const location = await locationElement?.evaluate(element => element.textContent);

      listings.push({ title, description, price, location, coverImage, url });
    }

    return new Listings(listings, this.browser, this.page)
  }
}

class Listings {
  #listings;
  browser;
  page;

  constructor(listings, browser, page) {
    this.#listings = listings;
    this.browser = browser;
    this.page = page;
  }

  getAllListings() {
    return this.#listings;
  }

  async getListing(url) {
    await this.page.goto(url);
  }
}

class Listing {
  title;
  description;
  price;
  location;
  url;
  coverImage;

  constructor(title, price, location, url, description) {
    this.title = title;
    this.price = price;
    this.location = location;
    this.url = url;
    this.description = description;
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

