import {ProcessedData} from "./process";
import {PlatformInterface} from "./platform-interface";
import {ScrapeDataItem} from "./scrape";
import fetch from "node-fetch";
import * as config from "./config.json";

const TELEGRAM_API_KEY = config.TELEGRAM_API_KEY;
const TELEGRAM_CHANNEL_ID = config.TELEGRAM_CHANNEL_ID;

export class Telegram implements PlatformInterface{
    async post(item: ScrapeDataItem, message: string){
        return fetch("https://api.telegram.org/bot" +
            TELEGRAM_API_KEY +
            "/sendMessage?text=" +
            encodeURIComponent(message) +
            "&chat_id=" +
            TELEGRAM_CHANNEL_ID +
            "&parse_mode=HTML&disable_web_page_preview=True");
    }

    postCrossBuySale(data: ScrapeDataItem): void {
    }

    postNew(data: ScrapeDataItem): void {
    }

    postPreorder(data: ScrapeDataItem): void {
    }

    postSale(data: ScrapeDataItem): void {
    }

    postPreorderReleased(data: ScrapeDataItem) {
    }

}
