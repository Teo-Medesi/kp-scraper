import puppeteer from "puppeteer";
import { getCategoryId, transformString, extractPrice } from "./utils/utils.js";

class BaseScraper {
  browser;
  #page;

  async init() {
    try {
      this.browser = await puppeteer.launch();
      this.#page = await this.browser.newPage();
      this.#page.setDefaultNavigationTimeout(2 * 60 * 1000);
      await this.#page.goto("https://novi.kupujemprodajem.com")
    }
    catch (error) {
      console.error(`Error while during initilization, error: ${error}`);
      await this.browser?.close();
    }
  }

  async close() {
    await this.browser?.close();
  }

}

/**
 * base instance of KupujemProdajem scraper
 * @class
 */
class KupujemProdajem extends BaseScraper {

  constructor() {
    super();
  }

  /**
   * Retrieves a listing by url
   * @param {String} url the url of the listing you want to get
   * @returns instance of the Listing class
   */
  async getListing(url) {
    try {
      await this.page.goto(url);
      await this.page.waitForSelector(".Box_box__03Q3_.AdPage_adInfoBox__65MTf")

      const title = await this.page.$eval('h1.AdViewInfo_name__ShcRk', (element) => element.innerText.trim());
      const description = await this.page.$eval('.AdViewDescription_descriptionHolder__9hET7 div', (element) => element.innerText.trim());
      const price = await this.page.$eval('h2.AdViewInfo_price__RLvIy', (element) => element.innerText.trim());
      const location = await this.page.$eval('.UserSummary_userDetails__tNXN7 div div + div', (element) => element.innerText.trim());

      return new Listing({ title, description, price: extractPrice(price), location }, this.browser, this.page);

    }
    catch (error) {
      console.error(`Error while getting listing, error: ${error}`);
      await this.browser?.close();
    }
  }

  /**
   * Retrieves all categories of website
   * @returns instance of Categories class
   */
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
      console.error(`Error while getting categories, error: ${error}`);
      await this.browser?.close();
    }
  }

}

/**
 * @class
 */
class Categories {
  #categories;
  browser;
  #page;

  constructor(categories, browser, page) {
    this.#categories = categories;
    this.browser = browser;
    this.#page = page;
  }

  /**
   * @returns array of category objects with category name and url
   */
  getAllCategories() {
    return this.#categories;
  }

  /**
   * Retrieves category by name
   * @param {String} name exact name of category such as "Alati i Oruđa" 
   * @returns instance of Category class
   */
  async getCategory(name) {
    try {
      const category = this.#categories.find(category => category.name === name);
      if (!category) throw new Error("Invalid category name.");

      await this.#page.goto(category.url);
      await this.#page.waitForSelector(".CategoryBox_name__54eU9");

      const data = await this.#page.$$(".CategoryBox_name__54eU9");
      const subCategories = [];


      for (const subCategory of data) {
        const name = await subCategory.evaluate(subCategory => subCategory.textContent)
        const url = await subCategory.evaluate(subCategory => subCategory.href);

        subCategories.push({ name, url })
      }

      return new Category(category.name, category.url, subCategories, this.browser, this.#page);

    }
    catch (error) {
      console.error(`Error while getting categories, error: ${error}`);
      await this.browser?.close();
    }
  }
}

/**
 * @class
 */
class Category {
  name;
  url;
  subCategories;
  browser;
  #page;

  constructor(name, url, subCategories, browser, page) {
    this.name = name;
    this.url = url;
    this.subCategories = subCategories;
    this.browser = browser;
    this.#page = page;
  }

  /**
   * Retrieves all listings from the first page of a category
   * @returns instance of Listings class
   * @todo add pagination functionality (scrape page 2 and beyond)
   */
  async getListings() {
    try {
      const transformedName = transformString(this.name);
      const categoryId = getCategoryId(transformedName);

      await this.#page.goto(`https://novi.kupujemprodajem.com/${transformedName}/pretraga?categoryId=${categoryId}`);
      const data = await this.#page.$$(".AdItem_adHolder__NoNLJ");

      const listings = [];

      for (const listing of data) {
        const title = await listing?.$eval('.AdItem_name__RhGAZ', element => element.textContent);
        const url = await listing?.$eval('.AdItem_adTextHolder__Fmra9 a', element => element.href);
        const coverImage = await listing?.$eval('img', element => element.src);
        const description = await listing?.$eval('.AdItem_adTextHolder__Fmra9 p', element => element.textContent);
        const price = await listing?.$eval('.AdItem_price__jUgxi', element => element.textContent);
        const location = await listing?.$eval('.AdItem_originAndPromoLocation__HgtYj', element => element.textContent);

        listings.push({ title, description, price, location, coverImage, url });
      }

      return new Listings(listings, this.browser, this.#page)
    }
    catch (error) {
      console.error(`Error while getting listings, error: ${error}`);
      await this.browser?.close();
    }
  }
}

/**
 * @class
 */
class Listings {
  #listings;
  browser;
  #page;

  constructor(listings, browser, page) {
    this.#listings = listings;
    this.browser = browser;
    this.#page = page;
  }

  /**
   * @returns array of listing objects with the properties of title, description, price, location, coverImage and url
   */
  getAllListings() {
    return this.#listings;
  }

  /**
   * Retrieves a listing by url
   * @param {String} url url of listing
   * @returns instance of Listing class
   */
  async getListing(url) {
    try {
      await this.#page.goto(url);

      const listing = this.#listings.find(listing => listing.url === url);
      return new Listing(listing, this.browser, this.#page);
    }
    catch (error) {
      await this.browser?.close();
      throw new Error(`Error while getting listing, error: ${error}`);
    }
  }
}

/**
 * @class
 */
class Listing {
  title;
  description;
  price;
  location;
  url;
  coverImage;
  browser;
  #page;

  constructor(listing, browser, page) {
    this.title = listing?.title;
    this.price = listing?.price;
    this.location = listing?.location;
    this.url = listing?.url;
    this.description = listing?.description;
    this.coverImage = listing?.coverImage;
    this.#page = page;
    this.browser = browser;
  }

  /**
   * Retrieve all images related to listing
   * @returns array of image urls
   */
  async getImages() {
    try {
      await this.#page.waitForSelector(".GallerySlideItem_imageGalleryImage__2eGga");

      const data = await this.#page.$$(".GallerySlideItem_imageGalleryImage__2eGga");
      const images = [];

      for (const image of data) {
        const url = await image.evaluate(image => image.src);
        images.push(url);
      }

      return images;
    }
    catch (error) {
      console.error(`Error while getting images, error: ${error}`);
      await this.browser?.close();
    }
  }
}

export default KupujemProdajem;

