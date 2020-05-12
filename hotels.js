let puppeteer = require("puppeteer");
let credFile = process.argv[2];
let loc = process.argv[3];
let fs = require("fs");
(async function () {
    try {
        //Read credential File
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
        });
        //creating tab
        let tabs = await browser.pages();
        let tab = tabs[0];

        await tab.goto(url, {
            waitUntil: "networkidle0",
        });
        //input email
        await tab.waitForSelector("input[type=email]");
        await tab.type("input[type=email]", user, {
            delay: 120
        });
        //submit
        await Promise.all([tab.click("button[type=submit]"),
            tab.waitForNavigation({
                waitUntil: "networkidle0"
            })
        ])
        //input password
        await tab.waitFor(1000);
        await tab.waitForSelector("input[type=password]");
        await tab.type("input[type=password]", pwd, {
            delay: 120
        });
        //submit
        await Promise.all([tab.click("#login_submit"),
            tab.waitForNavigation({
                waitUntil: "networkidle0"
            })
        ])
        //site
        await tab.goto("https://www.trivago.co.uk/", {
            waitUntil: "networkidle0"
        });
        await tab.waitForSelector("#querytext", {
            visible: true
        })
        //Enter location
        await tab.type("#querytext", loc, {
            delay: 100
        });
        await tab.waitFor(1000);
        await tab.keyboard.press("Enter");
        await tab.waitFor(1000);
      // search Hotels
        await Promise.all([tab.click(".btn.btn--primary.btn--regular.search-button.js-search-button"),
            tab.waitForNavigation({
                waitUntil: "networkidle0"
            })
        ])
        await tab.waitFor(3000);

        let hotelsData = await tab.evaluate(() => {
            //hotels array
            let hotels = [];
            let allHotels = document.querySelectorAll(".hotel-item.item-order__list-item.js_co_item");
            allHotels.forEach((hotelelement) => {

                try {
                    //hotel object
                    let hotelJson = {
                        HotelRating: hotelelement.querySelector("span[itemprop=ratingValue]").innerText,
                        HotelPrice: hotelelement.querySelector("Strong[data-qa=recommended-price]").innerText,
                        HotelName: hotelelement.querySelector("span.item-link.name__copytext").innerText,
                        HotelLocation: hotelelement.querySelector(".details-paragraph.details-paragraph--location.location-details").innerText,
                        WhereToBookFrom: hotelelement.querySelector("span[data-qa=recommended-price-partner]").innerText,
                        
                    }
                    hotels.push(hotelJson);
                } catch (error) {
                    console.log(error);
                }

            });
            return hotels
        });
        //printing hotels data
        console.table(hotelsData);
        fs.writeFileSync("hotel.html", hotelsData);
        await tab.setViewport({
            width: 1200,
            height: 800
        });
        await tab.waitFor(2000);
        await autoScroll(tab);
        await tab.waitFor(1000);
        
        //take screenshot
        await tab.screenshot({
            path: './hotels.png',
            fullPage: true
        });
        await tab.waitFor(1000);
        //close tab
        await tab.close();
    } catch (err) {
        console.log(err);
    }


})();

//autoscroll function
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
