#!/usr/bin/env node

import axiosRoot from 'axios';
import cheerio from 'cheerio';
import { wrapper as cookieJarWrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '/app/.env' });

const jar = new CookieJar();
const axios = cookieJarWrapper(axiosRoot.create({ jar }));

let authenticityToken = "";

const COMMON_HEADERS = {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'en-US,en;q=0.9',
    'cache-control': 'max-age=0',
    'sec-ch-ua': '"Not A;Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
}

const client = new MongoClient(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
await client.connect();
const db = client.db('wadaily');
const daysCollection = db.collection('days');

const start = new Date();
const end = new Date();
end.setDate(start.getDate() + 15);

const scheduleDays = await getScheduleDays(start, end);

const pendingUpdates = await Promise.allSettled(Object.entries(scheduleDays).map(async ([date, schedule]) => {
    return daysCollection.updateOne({ date }, { $set: { schedule } }, { upsert: true });
}))

pendingUpdates.forEach(e => {
    if (e.status != 'fulfilled') {
        console.error(e)
    }
})
client.close()

console.log(`Closed connection to MongoDB after updating ${pendingUpdates.filter(e => e.status == "fulfilled").length} records. Exiting...`)

function formatDateAsVeracross(date) {
    //return date like MM/DD/YYYY
    //example changes
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

function formatDateAsWADaily(date) {
    //return date like MM-DD-YY
    return `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear().toString().slice(2)}`;
}

async function getScheduleDays(start, end) {    
    await login(process.env.VERACROSS_USERNAME, process.env.VERACROSS_PASSWORD)
    
    const calendarEvents = await axios.get('https://portals.veracross.com/woodward/parent/calendar/household/events', {
        headers: {
            ...COMMON_HEADERS,
            "x-csrf-token": authenticityToken,
            "x-requested-with": "XMLHttpRequest",
        },
        params: {
            begin_date: formatDateAsVeracross(start),
            end_date: formatDateAsVeracross(end),
        }
    });
    
    const relevantScheduleEvents = calendarEvents.data.filter(e => e.link_style === 'color: black')
    
    const scheduleDays = {}
    
    for (const event of relevantScheduleEvents) {
        const date = new Date(event.start_date);
        const dateKey = formatDateAsWADaily(date);
        
        if (event.description.indexOf('A Day') != -1) {
            scheduleDays[dateKey] = 'ABLK';
        } else if (event.description.indexOf('B Day') != -1) {
            scheduleDays[dateKey] = 'BBLK';
        } else if (event.description.indexOf('X Day') != -1) {
            scheduleDays[dateKey] = 'XDAY';
        } else {
            const day = /Day (\d)/.exec(event.description)[1];
            scheduleDays[dateKey] = `DAY${day}`;
        }
    }

    return scheduleDays;
}

async function login(user, pass) {
    //if there's already a veracross session (_veracross_session) in the jar, return
    if (jar.getCookiesSync('https://portals.veracross.com/woodward/session').includes('_veracross_session')) return;

    const homepageRequest = await axios.get('https://accounts.veracross.com/woodward/portals/login/password', {
        params: {
            username: user,
        }
    });
    const $homepage = cheerio.load(homepageRequest.data);
    
    authenticityToken = $homepage('meta[name="csrf-token"]').attr('content');
    
    const loginRequest = await axios({
        method: 'post',
        url: 'https://accounts.veracross.com/woodward/portals/login/password',
        headers: {
            ...COMMON_HEADERS,
            'authority': 'accounts.veracross.com',
            'content-type': 'application/x-www-form-urlencoded',
            'origin': 'https://accounts.veracross.com',
            'referer': 'https://accounts.veracross.com/woodward/portals/login/password?username=doctorsambrown%40hotmail.com',
        },
        data: new URLSearchParams({
            'utf8': '✓',
            'username': user,
            'password': pass,
            'authenticity_token': authenticityToken,
            'commit': 'Log In'
        })
    })
    
    const $login = cheerio.load(loginRequest.data);
    authenticityToken = $login('meta[name="csrf-token"]').attr('content');
    
    const accountToken = $login('input[name="account"]').attr('value');
    
    const sessionRequest = await axios({
        method: 'post',
        url: 'https://portals.veracross.com/woodward/session',
        headers: {
            ...COMMON_HEADERS,
            'content-type': 'application/x-www-form-urlencoded',
        },
        data: new URLSearchParams({
            'utf8': '✓',
            'account': accountToken,
            'authenticity_token': authenticityToken,
        })
    })
    
    const $session = cheerio.load(sessionRequest.data);
    authenticityToken = $session('meta[name="csrf-token"]').attr('content');
}