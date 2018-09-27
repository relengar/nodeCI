const Page = require('./helpers/page');

let page;

beforeEach(async () => {
    page = await Page.build();
    await page.goto("http://localhost:3000");
});

afterEach(async () => {
    await page.close();
});

test("Correct header text", async () => {
    const text = await page.getContentsOf("a.brand-logo");
    expect(text).toEqual("Blogster");
});

test("Click login to start oauth flow", async () => {
    await page.click(".right a");
    const url = await page.url();
    expect(url).toMatch(/accounts\.google\.com/);
});

test("Sign in the application and show logout button", async () => {
    await page.login();
    const text = await page.$eval('a[href="/auth/logout"]', el => el.innerHTML);
    expect(text).toEqual('Logout');
});
