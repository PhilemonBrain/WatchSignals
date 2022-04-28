import puppetter from "puppeteer";
import fs from "fs";

const hamBurgerMenuElement =
  "#b2a7e6ee-93a3-413c-acae-8da3926ba0c0 > div.mobileheader > div.mobileheader__bar.mobileheader__closed--open.mobileheader__shadow > div.hamburgermenu__wrapper > div.hamburgermenu";
const changeLocationButton =
  "#b2a7e6ee-93a3-413c-acae-8da3926ba0c0 > div.mobileheader > div.overlay-mobile.overlay-mobile--open > div > nav > div.nav-footer > div.nav-footer__language-switcher > div > div.language-switcher__detail > div > button";
const selectDropDown =
  "#b2a7e6ee-93a3-413c-acae-8da3926ba0c0 > div.modal-wrapper.language-switcher-modal > div.modal.overlay-mobile__wrapper > div > div.modal__content.overlay-mobile__content > div > div > div";
const refNoSelector = ".product-tile__reference";
const conditionSelector = ".condition-with-icon__text";
const priceSelector = ".price";
const nameSelector = ".product-tile__brand";
const discountSelector = ".product-tile__banner-text";
const productListSelector = ".product-list";
const productTileSelector = ".product-tile";
const paginationSelector = ".pagination__list";
const scrollDownLevelSelector = "#descriptive-content";
const noProductListing = ".c-product-listing-notfound";
const saveModalSelector = ".language-switcher-footer__buttons--save-btn";
const nextPageElement =
  "#aad39aa7-ddd4-4ea6-932d-7f7826522cd5 > nav > ul > li.pagination__item.pagination__item--next";
const baseUrl = "https://www.chronext.com";
let results = [];

const writeStream = await fs.createWriteStream("output.csv");
const browser = await puppetter.launch({ headless: false });
let page = await browser.newPage();

async function start() {
  await page
    .goto(baseUrl + "/mens-watches")
    .catch(() => console.log("server side, timeout or resource load error"));

  // its important to note that when accessing this particular page, visitors from a region not specified
  // gets a different page. So i will try to handle that use case with a simple conditional
  const unknownCountry = await page.$(noProductListing);
  unknownCountry && (await switchCountry());

  await page.waitForSelector(productListSelector);
  await scrollDown();

  const pdList = await page.$$(productTileSelector);
  await getProductsAndDetails(pdList);

  //after getting the contents of the first page
  // run a while loop that takes u to new page, gets the contents of the page product list
  await nextPages();
}

async function scrollDown() {
  // this function scrolls down to the navigation section of the page
  // this ensures that all the contents towards the bottom loads before
  // each page scraping starts
  await page.$eval(scrollDownLevelSelector, (e) => {
    e.scrollIntoView({ behavior: "smooth", block: "start", inline: "start" });
  });
  await page.waitForTimeout(5000);
}

async function switchCountry() {
  // this function can also be extended to select different regions and get the discounts for the various regions
  // and probably this info can be used to make market analysis

  const hamBurgerMenu = await page.waitForSelector(hamBurgerMenuElement);
  await hamBurgerMenu.evaluate((b) => b.click());

  const changeCountryDropDown = await page.waitForSelector(
    changeLocationButton
  );
  await changeCountryDropDown.evaluate((b) => b.click());

  const selectDropDownElement = await page.waitForSelector(selectDropDown);
  await page.waitForTimeout(2000);
  await selectDropDownElement.click();

  await page.keyboard.press("Enter");
  const btn = await page.waitForSelector(saveModalSelector);
  await btn.click();
}

async function nextPages() {
  const nextPageLink = await page
    .waitForSelector(nextPageElement)
    .catch(() => false);
  while (nextPageLink) {
    await Promise.all([page.waitForNavigation(), nextPageLink.click()]);
    await page.waitForTimeout(5000);
    await page.waitForSelector(productListSelector);
    await page.waitForSelector(paginationSelector);
    await scrollDown();

    const pdList = await page.$$(productTileSelector);
    await getProductsAndDetails(pdList);
  }
  await browser.close();
}

async function getProductsAndDetails(productListElement) {
  for (let ele of productListElement) {
    let item = {};
    item.productReferenceNo = (await ele.$(refNoSelector))
      ? await (await ele.$(refNoSelector)).evaluate((node) => node.innerHTML)
      : "No Reference found";

    item.productCondition = (await ele.$(conditionSelector))
      ? await (
          await ele.$(conditionSelector)
        ).evaluate((node) => node.innerHTML)
      : "No Condition found";

    item.productPrice = (await ele.$(priceSelector))
      ? await (
          await ele.$(priceSelector)
        ).evaluate((node) => node.innerHTML.replace("&nbsp;", " "))
      : "No Price found";

    item.productName = (await ele.$(nameSelector))
      ? await (
          await ele.$(nameSelector)
        ).evaluate((node) => node.innerHTML.replace("&amp;", "and"))
      : "No Product Name found";

    item.productLink = (await ele.$("a"))
      ? baseUrl +
        (await (await ele.$("a")).evaluate((node) => node.getAttribute("href")))
      : "No Product Link found";

    item.productDiscountPrice = (await ele.$(discountSelector))
      ? await (
          await ele.$(discountSelector)
        ).evaluate((node) => node.innerHTML.replace("&nbsp;", " ").slice(1))
      : "No Discount found";
    results.push(item);
    writeToCsv(item);
  }
  console.log(results.length);
  return true;
}

async function writeToCsv(item) {
  const overHead = writeStream.write(JSON.stringify(item) + "\n");

  if (!overHead) {
    await new Promise((resolve) => {
      writeStream.once("drain", resolve);
    });
  }
}

start().catch((e) => console.log(e));
