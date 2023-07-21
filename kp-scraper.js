import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import { getCategoryId, transformString, extractPrice, getSubcategoryFromURL } from "./utils/utils.js";

class BaseScraper {
  browser;
  page;

  /**
   * initialize the scraper, must be called before using any of the KupujemProdajem methods
   * @async
   */
  async init() {
    try {
      this.browser = await puppeteer.launch();
      this.page = await this.browser.newPage();
      this.page.setDefaultNavigationTimeout(2 * 60 * 1000);
      await this.page.goto("https://novi.kupujemprodajem.com")

      puppeteer.use(StealthPlugin())
    }
    catch (error) {
      console.error(`Error during initilization, error: ${error}`);
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
   * Retrieves latest listings
   * @returns instance of the Listing class
   * @async
   */
  async getLatestListings() {
    try {
      await this.page.goto("https://novi.kupujemprodajem.com/najnoviji/1")
      await this.page.waitForSelector(".Box_box__03Q3_.AdPage_adInfoBox__65MTf")

      const title = await this.page.$eval('h1.AdViewInfo_name__ShcRk', (element) => element.innerText.trim());
      const description = await this.page.$eval('.AdViewDescription_descriptionHolder__9hET7 div', (element) => element.innerText.trim());
      const price = await this.page.$eval('h2.AdViewInfo_price__RLvIy', (element) => element.innerText.trim());
      const location = await this.page.$eval('.UserSummary_userDetails__tNXN7 div div + div', (element) => element.innerText.trim());

      return new Listing({ title, description, price: extractPrice(price), location }, this.browser, this.page);

    }
    catch (error) {
      console.error(`Error while getting listing, error: ${error}`);
      return null
    }
  }


  /**
   * Retrieves a listing by url
   * @param {String} url the url of the listing you want to get
   * @returns instance of the Listing class
   * @async
   */
  async getListingByUrl(url) {
    try {
      await this.page.goto(url);
      await this.page.waitForSelector(".Box_box__03Q3_.AdPage_adInfoBox__65MTf")

      const title = await this.page.$eval('h1.AdViewInfo_name__ShcRk', (element) => element.innerText.trim());
      const description = await this.page.$eval('.AdViewDescription_descriptionHolder__9hET7 div', (element) => element.innerText.trim());
      const price = await this.page.$eval('h2.AdViewInfo_price__RLvIy', (element) => element.innerText.trim());
      const location = await this.page.$eval('.UserSummary_userDetails__tNXN7 div div + div', (element) => element.innerText.trim());

      return new Listing({ title, description, price: extractPrice(price), location, url }, this.browser, this.page);

    }
    catch (error) {
      console.error(`Error while getting listing, error: ${error}`);
      return null
    }
  }


  /**
   * Retrieves listings from the first page that matches the keywords query
   * @param {String} keywords keywords to find listing in search 
   * @returns instance of Listings class
   * @async
   */
  async getListingsBySearch(keywords) {
    try {
      await this.page.goto(`https://novi.kupujemprodajem.com/pretraga?keywords=${encodeURIComponent(keywords)}`);

      const data = await this.page.$$(".AdItem_adHolder__NoNLJ");

      const listings = [];

      for (const listing of data) {
        const title = await listing?.$eval('.AdItem_name__RhGAZ', element => element.textContent).catch(() => { });
        const url = await listing?.$eval('.AdItem_adTextHolder__Fmra9 a', element => element.href).catch(() => { });
        const coverImage = await listing?.$eval('img', element => element.src).catch(() => { });
        const description = await listing?.$eval('.AdItem_adTextHolder__Fmra9 p', element => element.textContent).catch(() => { });
        const price = await listing?.$eval('.AdItem_price__jUgxi', element => element.textContent).catch(() => { });
        const location = await listing?.$eval('.AdItem_originAndPromoLocation__HgtYj', element => element.textContent).catch(() => { });

        listings.push({ title, description, price, location, coverImage, url });
      }

      return new Listings(listings, this.browser, this.page)

    }
    catch (error) {
      console.error(`Error while searching for listings, error: ${error}`);
      return null
    }
  }

  /**
   * Retrieves all categories of website
   * @returns instance of Categories class
   * @async
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
        categories.push({ name: transformString(name), url });
      }

      return new Categories(categories, this.browser, this.page);
    }
    catch (error) {
      console.error(`Error while getting categories, error: ${error}`);
      return null
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
   * @param {String} name wrriten in lowercase with no white space and no special characters, e.g "alati-i-orudja" 
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
      return null
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
   * Retrieves all listings from the specified page of a category (by default page 1)
   * @param {Object} [options] 
   * @param {Number} [options.page] the page to scrape
   * @returns instance of Listings class
   * @async
   */
  async getListings(options = {page: 1}) {
    try {
      await this.#page.screenshot({path: "screenshot.png"})

      const transformedName = transformString(this.name);
      const categoryId = getCategoryId(transformedName);

      await this.#page.goto(`https://novi.kupujemprodajem.com/${transformedName}/pretraga?categoryId=${categoryId}&page=${options.page}`);
      const data = await this.#page.$$(".AdItem_adHolder__NoNLJ");

      const listings = [];

      for (const listing of data) {
        const title = await listing?.$eval('.AdItem_name__RhGAZ', element => element.textContent).catch(() => { });
        const url = await listing?.$eval('.AdItem_adTextHolder__Fmra9 a', element => element.href).catch(( ) => { });
        const coverImage = await listing?.$eval('img', element => element.src).catch(( ) => { });
        const description = await listing?.$eval('.AdItem_adTextHolder__Fmra9 p', element => element.textContent).catch(() => { });
        const price = await listing?.$eval('.AdItem_price__jUgxi', element => element.textContent).catch(( ) => { });
        const location = await listing?.$eval('.AdItem_originAndPromoLocation__HgtYj', element => element.textContent).catch(( ) => { });

        listings.push({ title, description, price, location, coverImage, url });
      }

      return new Listings(listings, this.browser, this.#page)
    }
    catch (error) {
      console.error(`Error while getting listings, error: ${error}`);
      return null
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
   * @async
   */
  async getListing(url) {
    try {
      const listing = this.#listings.find(listing => listing.url === url);
      return new Listing(listing, this.browser, this.#page);
    }
    catch (error) {
      console.error(`Error while getting listing, error: ${error}`);
      return null
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
  * retrieves which subcategory or category the listing belongs to
  * @returns string
  */
  getSubCategory() {
    return getSubcategoryFromURL(this.url);
  }

  async getFullDescription() {
    try {
      if (!this.url) return;

      await this.#page.goto(this.url);
      await this.#page.waitForSelector(".AdViewDescription_descriptionHolder__9hET7");
      
      const description = await this.#page.$eval(".AdViewDescription_descriptionHolder__9hET7", element => element.textContent);
  
      return description;
    }
    catch (error) {
      console.error(`Error while getting full description, error: ${error}`);
      return "";
    }
  }

  /**
   * Retrieve all images related to listing
   * @returns array of image urls
   * @async
   */
  async getImages() {
    try {
      if (!this.url) return;

      await this.#page.goto(this.url);

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
      return []
    }
  }
}

export default KupujemProdajem;

