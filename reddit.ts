import {PlatformInterface} from "./platform-interface";
import {ScrapeDataItem} from "./scrape";
import fetch from "node-fetch";
import * as config from "./config.json";

const REDDIT_SECRET = config.REDDIT_SECRET;
const REDDIT_CLIENTID = config.REDDIT_CLIENTID;
const REDDIT_USERNAME = config.REDDIT_USERNAME;
const REDDIT_PASSWORD = config.REDDIT_PASSWORD;

const REDDIT_ACCESS_TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
const REDDIT_SUBMIT_URL = "https://oauth.reddit.com/api/submit";

export class Reddit implements PlatformInterface{
    access_token: string;
    async postCrossBuySale(data: ScrapeDataItem) {
        let name = data.node.display_name;
        let offer = data.rift_cross_buy.node.current_offer;
        let message = `[Sale][Rift-Cross-Buy] ${name} (${offer.price.formatted}/${offer.promo_benefit}) until ${new Date(offer.end_time*1000)}`;
        await this.post(data, message);
    }

    async postPreorderReleased(data: ScrapeDataItem) {
        let name = data.node.display_name;
        let offer = data.node.current_offer;
        let message = `[Now Available][Quest] ${name} (${offer.price.formatted})`;
        await this.post(data, message);
    }

    async postNew(data: ScrapeDataItem) {
        let name = data.node.display_name;
        let offer = data.node.current_offer;
        let message = `[New][Quest] ${name} (${offer.price.formatted})`;
        await this.post(data, message);
    }

    async postPreorder(data: ScrapeDataItem) {
        let name = data.node.display_name;
        let offer = data.node.current_offer;
        let message = `[PreOrder][Quest] ${name} (${offer.price.formatted}/${offer.promo_benefit}) available on ${new Date(data.node.release_date*1000)}`;
        await this.post(data, message);
    }

    async postSale(data: ScrapeDataItem) {
        let name = data.node.display_name;
        let offer = data.node.current_offer;
        let message = `[Sale][Quest] ${name} (${offer.price.formatted}/${offer.promo_benefit}) until ${new Date(offer.end_time*1000)}`;
        await this.post(data, message);
    }

    async getAccessToken() {
        let headers = {
            "Authorization":"Basic " + Buffer.from(REDDIT_CLIENTID + ":" + REDDIT_SECRET).toString('base64'),
            "user_agent":"Web:QuestStoreScraper:v0.2 (by /u/weathon & /u/shakamone)",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        let body = "grant_type=password&username=" + REDDIT_USERNAME + "&password=" + REDDIT_PASSWORD;

        let options = {
            method: "POST",
            headers,
            body
        }

        let response = await fetch(REDDIT_ACCESS_TOKEN_URL, options);
        let jsonData, data = await response.text();
        try{
            jsonData = JSON.parse(data);
            return jsonData['access_token'];
        }catch(e){
            console.log("Reddit response:", data);
            console.log(e);
            return null;
        }
    }

    async post(item: ScrapeDataItem, message: string){
        if(!this.access_token){
            this.access_token = await this.getAccessToken();
            if(!this.access_token){
                console.log("Could not get an access token from reddit, are they rate limiting? Skipping...");
                return;
            }
        }
        let headers = {
            "authorization": "Bearer " + this.access_token,
            "Content-type": "application/x-www-form-urlencoded",
        };
        let body = this.encodeUriParams({
            "kind": "link",
            "sr" : "metaqueststore",
            "url" : "https://www.oculus.com/experiences/quest/" + item.node.id,
            "title" : message,
            "resubmit" : true
        });
        let options = {
            method: "POST",
            headers,
            body
        };
       let response = await fetch(REDDIT_SUBMIT_URL, options);
       let data = await response.text();
    }
    encodeUriParams(params){
        return encodeURI(Object.keys(params).map(key => key + '=' + params[key]).join('&'))
    }

}
