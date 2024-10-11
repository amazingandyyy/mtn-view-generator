#! /usr/bin/env node

const playwright = require('playwright');
const axios = require('axios');
const users = require('./users.js')
const cheerio = require('cheerio');
let targetTimestamp = 0;
const DELAY_SECONDS = 0.5;
const api = axios.create({
  baseURL: "https://www.tycs.com.tw",
  withCredentials: true,
  headers: {
      "Content-type": "application/json",
  },
});

async function getContext() {
  const browser = await playwright['chromium'].launch({
    headless: true,
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://www.tycs.com.tw/login');
  const response = await context.cookies();
  const cookies1 = response[0].name + '=' + response[0].value;

  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  await page2.goto('https://www.tycs.com.tw/login');
  const response2 = await context2.cookies();
  const cookies2 = response2[0].name + '=' + response2[0].value;

  browser.close();
  return [cookies1, cookies2];
}

async function getLoginCode(cookie, user) {
  const FormData = require('form-data');
  let data = new FormData();
  data.append('action', 'login');
  data.append('Account', user.account);
  data.append('Password', user.password);
  data.append('code', '9999');
  data.append('remember', 'false');

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://www.tycs.com.tw/AJAX/account_AJAX.ashx',
    headers: { 
      'Cookie': cookie, 
      ...data.getHeaders()
    },
    data : data
  };
  const response = await api.request(config)
  return response.data
}

async function loginUser(cookie, code, user) {
  console.log(new Date().toLocaleString(), user.name, '登入')
  const FormData = require('form-data');
  let data = new FormData();
  data.append('action', 'login');
  data.append('Account', user.account);
  data.append('Password', user.password);
  data.append('code', code);
  data.append('remember', 'false');

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://www.tycs.com.tw/AJAX/account_AJAX.ashx',
    headers: { 
      'Cookie': cookie, 
      ...data.getHeaders()
    },
    data : data
  };
  const response = await api.request(config)
  return response.data
}

// const txtPlaces = ["16", "21", "17", "19"]
// const txtPlacesText = {
//   16:  "中壢藝術館",
//   21:  "平鎮圖書館",
//   22:  "自行前往",
//   17:  "平鎮區公所",
//   19:  "中壢健保局"
// }
const txtPlaces = ["16", "21", "22", "17", "19"]
const txtPlacesText = {
  16:  "中壢藝術館",
  21:  "平鎮圖書館",
  22:  "自行前往",
  17:  "平鎮區公所",
  19:  "中壢健保局",
}
async function signUpEvent(opts) {
  let {cookie, eventNumber, viewState, viewStateGenerator, txtPlaceIndex} = opts;
  txtPlaceIndex = txtPlaceIndex || 0
  if (!txtPlaces[txtPlaceIndex]) return console.log(new Date().toLocaleString(), "報名地點全部失敗", txtPlaceIndex)

  console.log(new Date().toLocaleString(), '報名活動', eventNumber)
  const eventPage = `https://www.tycs.com.tw/event/${eventNumber}`

  const FormData = require('form-data');
  let data = new FormData();
  data.append('__VIEWSTATE', viewState);
  data.append('__VIEWSTATEGENERATOR', viewStateGenerator);
  data.append('foods', '0');
  data.append('txtRoom', '');
  // 16 -> 中壢藝術館
  // 21 -> 平鎮圖書館
  // 17 -> 平鎮區公所
  // 19 -> 中壢健保局
  console.log(new Date().toLocaleString(), "報名地點", txtPlacesText[txtPlaces[txtPlaceIndex]])
  data.append('txtPlace', txtPlaces[txtPlaceIndex]);
  // data.append('txtPlace', '16');
  data.append('TextContactName', '陳文華');
  data.append('TextContactMobile', '0933775311');
  data.append('TextLegalNote', '');
  data.append('debug', '');

  let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: eventPage,
  headers: { 
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7', 
      'Accept-Language': 'en-US,en;q=0.9,zh-TW;q=0.8,zh;q=0.7', 
      'Cache-Control': 'max-age=0', 
      'Connection': 'keep-alive', 
      // 'Cookie': 'ASP.NET_SessionId=sasbbkpdb52johv0kyka51q0; _gid=GA1.3.180998747.1692507919; _ga_J5W6ZZ5HB6=GS1.1.1692584205.3.1.1692587817.0.0.0; _ga=GA1.3.1353187623.1692507919; ASP.NET_SessionId=sasbbkpdb52johv0kyka51q0', 
      'Cookie': cookie,
      'Origin': 'https://www.tycs.com.tw', 
      'Referer': `https://www.tycs.com.tw/event/${eventNumber}`, 
      'Sec-Fetch-Dest': 'document', 
      'Sec-Fetch-Mode': 'navigate', 
      'Sec-Fetch-Site': 'same-origin', 
      'Sec-Fetch-User': '?1', 
      'Upgrade-Insecure-Requests': '1', 
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.203', 
      'sec-ch-ua': '"Not/A)Brand";v="99", "Microsoft Edge";v="115", "Chromium";v="115"', 
      'sec-ch-ua-mobile': '?0', 
      'sec-ch-ua-platform': '"macOS"', 
      ...data.getHeaders()
    },
    data : data
  };

  axios.request(config)
  .then(async () => {
    console.log(new Date().toLocaleString(), '完成報名', eventNumber)
    await checkSignUpStatus(opts)
  })
  .catch((err)=>{
    console.error(err)
  });
}

function checkSignUpStatus(opts) {
  const {cookie, eventNumber, viewState, viewStateGenerator, txtPlaceIndex} = opts;
  const eventPage = `https://www.tycs.com.tw/event/${eventNumber}`
  const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: eventPage,
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7', 
      'Accept-Language': 'en-US,en;q=0.9,zh-TW;q=0.8,zh;q=0.7', 
      'Cache-Control': 'max-age=0', 
      'Connection': 'keep-alive', 
      // 'Cookie': 'ASP.NET_SessionId=sasbbkpdb52johv0kyka51q0; _gid=GA1.3.180998747.1692507919; _ga_J5W6ZZ5HB6=GS1.1.1692584205.3.1.1692587817.0.0.0; _ga=GA1.3.1353187623.1692507919; ASP.NET_SessionId=sasbbkpdb52johv0kyka51q0', 
      'Cookie': cookie,
      'Origin': 'https://www.tycs.com.tw', 
      'Referer': `https://www.tycs.com.tw/event/${eventNumber}`, 
      'Sec-Fetch-Dest': 'document', 
      'Sec-Fetch-Mode': 'navigate', 
      'Sec-Fetch-Site': 'same-origin', 
      'Sec-Fetch-User': '?1', 
      'Upgrade-Insecure-Requests': '1', 
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.203', 
      'sec-ch-ua': '"Not/A)Brand";v="99", "Microsoft Edge";v="115", "Chromium";v="115"', 
      'sec-ch-ua-mobile': '?0', 
      'sec-ch-ua-platform': '"macOS"', 
    }
  }
  axios.request(config)
  .then(async (response) => {
    const html = response.data
    const $ = cheerio.load(html);
    const success = $('.applied-info').text()
    console.log(success)
    if(!success) {
      console.log(new Date().toLocaleString(), '報名失敗，再次報名')
      return await signUpEvent({cookie, eventNumber, viewState, viewStateGenerator, txtPlaceIndex: txtPlaceIndex+1})
    }
    console.log(new Date().toLocaleString(), success, "🎉🎉🎉🎉🎉")
    console.log(new Date().toLocaleString(), "前往報名紀錄查看：https://www.tycs.com.tw/OrderList")
  })
  .catch(console.error);
}

async function execUser(cookie, user, eventNumber) {
  const {code2} = await getLoginCode(cookie, user);
  await loginUser(cookie, code2, user);
  
  // new function to count down while waiting for the target time by using set interval
  const interval = setInterval(() => {
    let now = Date.now();
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`倒數計時: ${(targetTimestamp - now)/1000}秒`);
  }, 100);

  const html = await api.get(`https://www.tycs.com.tw/event/${eventNumber}`)
  const $ = cheerio.load(html.data);
  const viewState = $('input[name=__VIEWSTATE]').val()
  const viewStateGenerator = $('input[name=__VIEWSTATEGENERATOR]').val()

  const timeOut = targetTimestamp - Date.now() + DELAY_SECONDS * 1000;

  setTimeout(async function() {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    clearInterval(interval);
    console.log(new Date().toLocaleString(), '')
    console.log(new Date().toLocaleString(), user.name, '開始搶票')
    return await signUpEvent({cookie, eventNumber, viewState, viewStateGenerator, txtPlaceIndex: 0});
  }, timeOut);
  return true;
}

async function main() {
  console.log(new Date().toLocaleString(), "DEBUG", ...process.argv)
  const [cookie1, cookie2] = await getContext();

  const user1 = users[0]
  const user2 = users[1]
  const eventNumber = process.argv[2];
  Promise.all([
    execUser(cookie1, user1, eventNumber),
    execUser(cookie2, user2, eventNumber)
  ]).catch(console.error);
}

if(!process.argv[2] || !process.argv[3] || !process.argv[4]) {
  console.log(new Date().toLocaleString(), '請使用 https://amazingandyyy.com/mtn-view-generator')
  console.log(new Date().toLocaleString(), '產生正確指令!')
  process.exit(1);
}

const eventNumber = process.argv[2];
var date = new Date(`${process.argv[3]} ${process.argv[4]}`);
targetTimestamp = date.getTime(); // override the global targetTimestamp in milliseconds  
console.log(new Date().toLocaleString(), '初始化... v2.1.0')
console.log(new Date().toLocaleString(), '搶位活動: ', `https://www.tycs.com.tw/event/${eventNumber}`)
console.log(new Date().toLocaleString(), `搶位時間: ${date.toLocaleString()}`)

main()
