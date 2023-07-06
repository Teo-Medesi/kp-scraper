
# kp-scraper
kp-scraper is a JavaScript library that provides scraping functionality for the KupujemProdajem website. It leverages Puppeteer, a Node.js library for automating browser actions, to scrape and extract data from the website.

## Installation
To use kp-scraper in your project, you can install it via npm:
 
    npm install kp-scraper

## Usage
Here is an example of how to use kp-scraper:

    import KupujemProdajem from 'kp-scraper';

    // Create an instance of KupujemProdajem scraper
    const scraper = new KupujemProdajem();

    // Initialize the scraper
    await scraper.init();

    // Get listings by search keywords
    const listings = await scraper.getListingsBySearch('laptop');

    // Print all the listings
    listings.getAllListings().forEach((listing) => {
      console.log(listing.title);
      console.log(listing.description);
      console.log(listing.price);
      console.log(listing.location);
    });

    // Get a specific listing by URL
    const listingUrl = 'https://novi.kupujemprodajem.com/listing/12345';
    const listing = await scraper.getListingByUrl(listingUrl);

    // Print the listing details
    console.log(listing.title);
    console.log(listing.description);
    console.log(listing.price);
    console.log(listing.location);

    // Close the scraper  
    await scraper.close();

# API

## `init()`

Initialize the scraper. This method must be called before using any of the KupujemProdajem methods. It launches a Puppeteer browser instance and sets up the page.

## `close()`

Close the scraper. This method closes the Puppeteer browser instance.

## `getListingByUrl(url)`

Retrieve a listing by its URL. This method navigates to the provided URL and extracts the listing details such as title, description, price, and location.

- `url` (String): The URL of the listing.

Returns an instance of the `Listing` class.

## `getListingsBySearch(keywords)`

Retrieve listings from the first page that match the provided search keywords. This method performs a search on the KupujemProdajem website using the keywords and extracts the listings' details.

- `keywords` (String): The search keywords to find listings.

Returns an instance of the `Listings` class.

## `getCategories()`

Retrieve all categories from the KupujemProdajem website.

Returns an instance of the `Categories` class.

---

## `Categories` class

Represents a collection of categories on the KupujemProdajem website.

### `getAllCategories()`

Get all categories.

Returns an array of category objects with the properties `name` and `url`.

### `getCategory(name)`

Get a specific category by its name.

- `name` (String): The name of the category.

Returns an instance of the `Category` class.

---

## `Category` class

Represents a category on the KupujemProdajem website.

### `getListings()`

Retrieve all listings from the first page of the category.

Returns an instance of the `Listings` class.

---

## `Listings` class

Represents a collection of listings.

### `getAllListings()`

Get all listings.

Returns an array of listing objects with the properties `title`, `description`, `price`, `location`, `coverImage`, and `url`.

### `getListing(url)`

Get a specific listing by its URL.

- `url` (String): The URL of the listing.

---

## `Listing` class

Represents a listing on the KupujemProdajem website.

### `getImages()`

Retrieve all images associated with the listing.

Returns an array of image URLs.