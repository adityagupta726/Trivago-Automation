let puppeteer = require("puppeteer");
let credFile = process.argv[2];
let loc = process.argv[3];
// let minRating = process.argv[4];
// let maxPrice= process.argv[5];
let fs = require("fs");
(async function () {
    try {
        let data = await fs.promises.readFile(credFile);
        let {
            url,
            pwd,
            user
        } = JSON.parse(data);
        let browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ["--start-maximized", "--disable-notifications"],
            // --incognito
        });
        let tabs = await browser.pages();
        let tab = tabs[0];

        await tab.goto(url, {
            waitUntil: "networkidle0",
        });
        await tab.waitForSelector("input[type=email]");
        await tab.type("input[type=email]", user, {
            delay: 120
        });
        await Promise.all([tab.click("button[type=submit]"),
            tab.waitForNavigation({
                waitUntil: "networkidle0"
            })
        ])
        await tab.waitFor(1000);
        await tab.waitForSelector("input[type=password]");
        await tab.type("input[type=password]", pwd, {
            delay: 120
        });
        await Promise.all([tab.click("#login_submit"),
            tab.waitForNavigation({
                waitUntil: "networkidle0"
            })
        ])
        await tab.goto("https://www.trivago.co.uk/", {
            waitUntil: "networkidle0"
        });
        await tab.waitForSelector("#querytext", {
            visible: true
        })
        await tab.type("#querytext", loc, {
            delay: 100
        });
        await tab.waitFor(1000);
        await tab.keyboard.press("Enter");
        await tab.waitFor(1000);
        // tab.click(".btn.btn--primary.btn--regular.search-button.js-search-button");
        await Promise.all([tab.click(".btn.btn--primary.btn--regular.search-button.js-search-button"),
            tab.waitForNavigation({
                waitUntil: "networkidle0"
            })
        ])
        await tab.waitFor(3000);
        // aria-valuenow
        // await tab.waitForSelector(".select.icon-bg-icn_arrow-sml-down.dropdown-arrow js_itemlist_controls_sort",{visible:true})
        // await tab.select('select[name="mf-select-sortby"]','5');
        // hotelJson.Comment = hotelelement.querySelector("Strong.item__rating-number").innerText;

        let hotelsData = await tab.evaluate(() => {
            let hotels = [];
            let allHotels = document.querySelectorAll(".hotel-item.item-order__list-item.js_co_item");
            allHotels.forEach((hotelelement) => {

                try {
                    let hotelJson = {
                        HotelRating: hotelelement.querySelector("span[itemprop=ratingValue]").innerText,
                        HotelPrice: hotelelement.querySelector("Strong[data-qa=recommended-price]").innerText,
                        HotelName: hotelelement.querySelector("span.item-link.name__copytext").innerText,
                        HotelLocation: hotelelement.querySelector(".details-paragraph.details-paragraph--location.location-details").innerText,
                        WhereToBookFrom: hotelelement.querySelector("span[data-qa=recommended-price-partner]").innerText,
                        // Reviews : hotelelement.querySelector("span.details-paragraph.details-paragraph--rating").innerText
                        // item-components__pillValue--ddfc4 item-components__value-sm--6c692 item-components__pillValue--ddfc4
                        // span.accommodation-list__partner--f5f76
                        // accommodation-list__price--11c9c accommodation-list__flat--38f18 accommodation-list__allowBreak--4844f
                    }
                    hotels.push(hotelJson);
                } catch (error) {
                    console.log(error);
                }

            });
            return hotels
        });
        console.table(hotelsData);
        fs.writeFileSync("hotel.html", hotelsData);
        await tab.setViewport({
            width: 1200,
            height: 800
        });
        await tab.waitFor(2000);
        await autoScroll(tab);
        await tab.waitFor(1000);

        await tab.screenshot({
            path: './hotels.png',
            fullPage: true
        });
        await tab.waitFor(1000);
        await tab.close();
    } catch (err) {
        console.log(err);
    }


})();


async function autoScroll(tab) {
    await tab.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}