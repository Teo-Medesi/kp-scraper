import puppeteer from "puppeteer-extra";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker"
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
      puppeteer.use(AdblockerPlugin());

      this.browser = await puppeteer.launch();
      this.page = await this.browser.newPage();
      this.page.setDefaultNavigationTimeout(2 * 60 * 1000);
      await this.page.goto("https://novi.kupujemprodajem.com")
    }
    catch (error) {
      console.error(`Error during initilization, error: ${error}`);
      await this.browser?.close();
    }
  }

  /**
   * The maximum time that the scraper will wait for an operation to complete. If the operation takes longer than the specified time, the scraper will throw an error.
   * @param {Integer} timeout how long to wait for an operation to complete, expressed in miliseconds 
   */
  setDefaultTimeout(timeout) {
    this.page.setDefaultTimeout(timeout);
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
      if (!url) throw new Error("url is undefined");

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
   * Retrieves a vehicle listing by url
   * @param {String} url the url of the listing you want to get
   * @returns instance of the VehicleListing class
   * @async
   */
  async getVehicleListingByUrl(url) {
    try {
      if (!url) throw new Error("url is undefined");

      await this.page.goto(url);
      await this.page.waitForSelector(".Box_box__03Q3_.AdPage_adInfoBox__65MTf")

      const title = await this.page.$eval('h1.AdViewInfo_name__ShcRk', (element) => element.innerText.trim());
      const description = await this.page.$eval('.AdViewDescription_descriptionHolder__9hET7 div', (element) => element.innerText.trim());
      const price = await this.page.$eval('h2.AdViewInfo_price__RLvIy', (element) => element.innerText.trim());
      const location = await this.page.$eval('.UserSummary_userDetails__tNXN7 div div + div', (element) => element.innerText.trim());

      return new VehicleListing({ title, description, price: extractPrice(price), location, url }, this.browser, this.page);

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
   * @async
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
      console.error(`Error while getting category, error: ${error}`);
      return null
    }
  }


  /**
   * Retrieves the "automobili" category
   * @returns instance of VehicleCategory class
   * @async
  */
  async getVehicleCatetegory() {
    try {
      await this.#page.goto("https://novi.kupujemprodajem.com/automobili/kategorija/2013");
      await this.#page.waitForSelector(".CategoryBox_name__54eU9");

      const data = await this.#page.$$(".CategoryBox_name__54eU9");
      const subCategories = [];

      for (const subCategory of data) {
        const name = await subCategory.evaluate(subCategory => subCategory.textContent)
        const url = await subCategory.evaluate(subCategory => subCategory.href);

        subCategories.push({ name, url })
      }

      return new VehicleCategory("automobili", "https://novi.kupujemprodajem.com/automobili/kategorija/2013", subCategories, this.browser, this.#page);

    }
    catch (error) {
      console.error(`Error while getting category, error: ${error}`);
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
   * Retrieves a shallow representation of all listings from the specified page of a category (by default page 1). If you wish to get all listings in detail, see `getDetailedListings()`.
   * @param {Object} [options] 
   * @param {Number} [options.page] the page to scrape
   * @param {Boolean} [options.outputTimestamps] whether or not to output the time it takes to retrieve each listing to the console
   * @returns instance of Listings class
   * @async
   */
  async getListings(options = { page: 1, outputTimestamps: false }) {
    try {
      const transformedName = transformString(this.name);
      const categoryId = getCategoryId(transformedName);

      await this.#page.goto(`https://novi.kupujemprodajem.com/${transformedName}/pretraga?categoryId=${categoryId}&page=${options.page}`);
      const data = await this.#page.$$(".AdItem_adHolder__NoNLJ");

      const listings = [];

      for (const [index, listing] of data.entries()) {
        options.outputTimestamps && console.time(`Listing ${index} Time`);

        const title = await listing?.$eval('.AdItem_name__RhGAZ', element => element.textContent).catch(() => { });
        const url = await listing?.$eval('.AdItem_adTextHolder__Fmra9 a', element => element.href).catch(() => { });
        const coverImage = await listing?.$eval('img', element => element.src).catch(() => { });
        const description = await listing?.$eval('.AdItem_adTextHolder__Fmra9 p', element => element.textContent).catch(() => { });
        const price = await listing?.$eval('.AdItem_price__jUgxi', element => element.textContent).catch(() => { });
        const location = await listing?.$eval('.AdItem_originAndPromoLocation__HgtYj', element => element.textContent).catch(() => { });

        // if the url is undefined then the listing doesn't exist
        if (!url) continue;

        listings.push({ title, description, price, location, coverImage, url });

        options.outputTimestamps && console.timeEnd(`Listing ${index} Time`);
      }

      return new Listings(listings, this.browser, this.#page)
    }
    catch (error) {
      console.error(`Error while getting listings, error: ${error}`);
      return null
    }
  }

  /**
   * Retrieves a detailed representation of all listings from the specified page of a category (by default page 1). If you wish for a less time-consuming alternative, see `getListings()`.
   * @param {Object} [options] 
   * @param {Number} [options.page] the page to scrape
   * @param {Boolean} [options.outputTimestamps] whether or not to output the time it takes to retrieve each listing to the console
   * @returns instance of Listings class
   * @async
  */
  async getDetailedListings(options = { page: 1, outputTimestamps: false }) {
    try {
      const transformedName = transformString(this.name);
      const categoryId = getCategoryId(transformedName);

      await this.#page.goto(`https://novi.kupujemprodajem.com/${transformedName}/pretraga?categoryId=${categoryId}&page=${options.page}`);
      const data = await this.#page.$$(".AdItem_adHolder__NoNLJ");

      const listings = [];
      for (const [index, listing] of data.entries()) {
        try {
          options.outputTimestamps && console.time(`Listing ${index} Time`);

          const title = await listing?.$eval('.AdItem_name__RhGAZ', element => element.textContent).catch(() => { });
          const url = await listing?.$eval('.AdItem_adTextHolder__Fmra9 a', element => element.href).catch(() => { });
          const coverImage = await listing?.$eval('img', element => element.src).catch(() => { });
          const description = await listing?.$eval('.AdItem_adTextHolder__Fmra9 p', element => element.textContent).catch(() => { });
          const price = await listing?.$eval('.AdItem_price__jUgxi', element => element.textContent).catch(() => { });
          const location = await listing?.$eval('.AdItem_originAndPromoLocation__HgtYj', element => element.textContent).catch(() => { });


          // note to self, you can not evaluate element handles while not being on the page where they exist!
          const newPage = await this.browser.newPage();
          const listingHandle = new Listing({ url }, this.browser, newPage);
          const subcategory = listingHandle.getSubCategory();
          const images = await listingHandle.getImages();
          const fullDescription = await listingHandle.getFullDescription();

          await newPage.close();

          options.outputTimestamps && console.timeEnd(`Listing ${index} Time`);

          // if the url is undefined then the listing doesn't exist
          if (!url) continue;

          listings.push({ title, description, price, location, coverImage, url, subcategory, images, fullDescription });

        }
        catch (error) {
          console.error(`Error while getting listing, error: ${error}`);
          continue;
        }
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
class VehicleCategory extends Category {
  #page;

  constructor(name, url, subCategories, browser, page) {
    super(name, url, subCategories, browser, page);
    this.#page = page;
  }

  /**
  * Retrieves a detailed representation of all listings from the specified page of the vehicles category (by default page 1). If you wish for a less time-consuming alternative, see `getListings()`.
  * @param {Object} [options] 
  * @param {Number} [options.page] the page to scrape
  * @param {Boolean} [options.outputTimestamps] whether or not to output the time it takes to retrieve each listing to the console
  * @returns instance of Listings class
  * @async
  */
  async getDetailedListings(options = { page: 1, outputTimestamps: false }) {
    try {
      const transformedName = transformString(this.name);
      const categoryId = getCategoryId(transformedName);

      await this.#page.goto(`https://novi.kupujemprodajem.com/${transformedName}/pretraga?categoryId=${categoryId}&page=${options.page}`);
      const data = await this.#page.$$(".AdItem_adHolder__NoNLJ");

      const listings = [];

      for (const [index, listing] of data.entries()) {
        try {
          options.outputTimestamps && console.time(`Listing ${index} Time`);

          const title = await listing?.$eval('.AdItem_name__RhGAZ', element => element.textContent).catch(() => { });
          const url = await listing?.$eval('.AdItem_adTextHolder__Fmra9 a', element => element.href).catch(() => { });
          const coverImage = await listing?.$eval('img', element => element.src).catch(() => { });
          const description = await listing?.$eval('.AdItem_adTextHolder__Fmra9 p', element => element.textContent).catch(() => { });
          const price = await listing?.$eval('.AdItem_price__jUgxi', element => element.textContent).catch(() => { });
          const location = await listing?.$eval('.AdItem_originAndPromoLocation__HgtYj', element => element.textContent).catch(() => { });


          // note to self, you can not evaluate element handles while not being on the page where they exist!
          const newPage = await this.browser.newPage();
          const listingHandle = new VehicleListing({ url }, this.browser, newPage);
          const subcategory = listingHandle.getSubCategory();
          const images = await listingHandle.getImages();
          const fullDescription = await listingHandle.getFullDescription();
          const characteristics = await listingHandle.getCharacteristics();
          const vehicleInformation = await listingHandle.getVehicleInformation();

          await newPage.close();

          options.outputTimestamps && console.timeEnd(`Listing ${index} Time`);

          // if the url is undefined then the listing doesn't exist
          if (!url) continue;

          listings.push({ title, description, price, location, coverImage, url, subcategory, images, fullDescription, vehicleInformation, characteristics });

        }
        catch (error) {
          console.error(`Error while getting listing, error: ${error}`);
          continue;
        }
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
   * Retrieve array of all listings
   * @returns array representation of listing objects
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
      if (!url) throw new Error("url is undefined");

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
  images;
  fullDescription;
  #page;

  constructor(listing, browser, page) {
    this.title = listing?.title;
    this.price = listing?.price;
    this.location = listing?.location;
    this.url = listing?.url;
    this.description = listing?.description;
    this.coverImage = listing?.coverImage;
    this.fullDescription = listing?.fullDescription;
    this.images = listing?.images;
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

  /**
   * Retrieves the full description of a listing.
   * @returns String
   * @async
   */

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

/**
 * @class
 */
class VehicleListing extends Listing {
  #page;

  constructor(listing, browser, page) {
    super(listing, browser, page);
    this.#page = page;
  }


  /**
   * Retrieves all of the vehicles characteristics and properties such as the make, date of production, color...
   * @returns array of objects containing key and value pairs
   * @async
   */
  async getCharacteristics() {
    try {
      if (!this.url) throw new Error("url is undefined");

      await this.#page.goto(this.url);

      const data = await this.#page.$$("body td");
      const characteristics = [];

      for (let i = 0; i < data.length; i += 2) {
        try {
          const key = await data[i]?.evaluate(element => element.textContent.trim());
          const value = await data[i + 1]?.evaluate(element => element.textContent.trim());

          characteristics.push({ key, value });
        }
        catch (error) {
          console.error(`Error while getting characteristics, error: ${error}`);
          continue;
        }
      }

      return characteristics;
    }
    catch (error) {
      console.error(`Error while getting characteristics, Error: ${error}`);
      return [];
    }

  }


  /**
   * Retrieves additional information specified by the seller
   * @returns object containing the properties "gear" and "warnings"
   * @async
   */
  async getVehicleInformation() {
    try {
      if (!this.url) throw new Error("url is undefined");

      await this.#page.goto(this.url);

      const data = await this.#page.$$(".AdViewDescription_section__feRKM");

      const gear = await data[1]?.$$eval("ul li", elements => {
        return elements.map(element => element.textContent.trim());
      })

      const warnings = await data[2]?.$$eval("ul li", elements => {
        return elements.map(element => element.textContent.trim());
      })

      return { gear, warnings };
    }
    catch (error) {
      console.error(`Error while getting car information, Error: ${error}`);
      return {};
    }

  }
}



export default KupujemProdajem;

