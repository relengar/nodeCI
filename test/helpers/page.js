const puppeteer = require("puppeteer");
const sessionFactory = require("../factories/sessionFactory");
const userFactory = require("../factories/userFactory");

class CustomPage {
    static async build() {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox']
        });

        const page = await browser.newPage();
        const customPage = new CustomPage(page);

        return new Proxy(customPage, {
            get: function (target, property) {
                return customPage[property] || browser[property] || page[property];
            }
        });
    }

    constructor(page) {
        this.page = page;
    }

    async login() {
        const user = await userFactory();
        const { session, sig } = sessionFactory(user);

        await this.page.setCookie({ name: "session", value: session });
        await this.page.setCookie({ name: "session.sig", value: sig });
        await this.page.goto("http://localhost:3000/blogs");
        await this.page.waitFor('a[href="/auth/logout"]');
    }

    async getContentsOf(selector) {
        return this.page.$eval(selector, el => el.innerHTML);
    }
    
    sendReq(path, data, method = 'GET') {
        return this.page.evaluate(
            (_path, _data, _method) => {
                return fetch(_path, {
                    method: _method,
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(_data)
                }).then(res => res.json());
            },
            path,
            data,
            method
        );
    }

    execRequests(actions) {
        return Promise.all(
            actions.map(({ method, path, data }) => {
                // return this[method](path, data); // funny way of calling function named the same as method
                return this.sendReq(path, data, method);
            })
        );
    }
}

module.exports = CustomPage;
