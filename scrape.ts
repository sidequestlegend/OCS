import fetch from "node-fetch";
import * as cheerio from "cheerio"
import * as FormData from "form-data"

const SECTION_URL = "https://www.oculus.com/experiences/quest/section/1888816384764129/";
const SECTION_LIST_URL = "https://graph.oculus.com/graphql?forced_locale=en_US";
const SCRIPT_URL_START = "https://static.xx.fbcdn.net/rsrc.php/";
const DOC_ID = "3923820374412278";

export const QUEST_HMD_TYPE = "HOLLYWOOD";
const QUEST_SECTION_ID = "1888816384764129";
const QUEST_CROSS_BUY_SECTION_ID = "2335732183153590";
const RIFT_HMD_TYPE = "RIFT";
const RIFT_SECTION_ID = "1736210353282450";
const RIFT_CROSS_BUY_SECTION_ID = "2336123376469541";

export interface ScrapeDataItem{
    node?:{
        canonicalName: string;
        id: string;
        current_offer?: {
            end_time: number;
            offer_type: string;
            price: {
                currency: string;
                offset_amount: string;
                formatted: string;
            },
            promo_benefit: string;
        },
        release_date: number;
        viewer_has_preorder: boolean;
        viewer_had_preorder?: boolean;
        cross_buy_sale?: boolean;
        display_name: string;
        is_concept: boolean;
        cover_square_image: {
            uri: string;
        }
    }
    rift_cross_buy?: ScrapeDataItem;
    cursor?:string;
}
export interface ScrapeData{
    data?:{
        node:{
            all_items: {
                edges: ScrapeDataItem[],
                page_info: {
                    has_next_page: boolean;
                    end_cursor: string;
                }
            }
        }
    }
    error?: string;
}
export class Scrape{
    constructor() {

    }
    async run():Promise<ScrapeData>{
        let accessToken = await this.accessToken();
        if(!accessToken) return {error: "access_token was null"};
        let quest_apps = <ScrapeData>(await this.getAppList(accessToken, QUEST_HMD_TYPE, QUEST_SECTION_ID));
        let quest_cross_buy_apps = <ScrapeData>(await this.getAppList(accessToken, QUEST_HMD_TYPE, QUEST_CROSS_BUY_SECTION_ID));
        let rift_cross_buy_apps = <ScrapeData>(await this.getAppList(accessToken, RIFT_HMD_TYPE, RIFT_CROSS_BUY_SECTION_ID));

        quest_apps.data.node.all_items.edges.forEach(q=>{
            rift_cross_buy_apps.data.node.all_items.edges.forEach(r=>{
                // Check if there is a rift cross buy app that matches the same name
                if(r.node.display_name === q.node.display_name){
                    // Check if that match is also listed as a quest cross buy
                    quest_cross_buy_apps.data.node.all_items.edges.forEach(qc=>{
                        if(qc.node.id === q.node.id){
                            q.rift_cross_buy = r;
                        }
                    });
                }
            });
        });
        console.log("Found", quest_apps.data.node.all_items.edges.filter(d=>d.rift_cross_buy).length, "apps with cross-buy between quest and rift.");
        return quest_apps;
    }

    async accessToken(): Promise<string>{
        let pageHtml = await (await fetch(SECTION_URL)).text();
        console.log("Loading \"Browse All\" page");
        let dom = cheerio.load(pageHtml);
        let scriptTags = dom("link[rel=\"preload\"]");
        for(let i = 0; i < scriptTags.length; i++){
            let scriptUrl = (<any>scriptTags[i]).attribs.href;
            if(scriptUrl.startsWith(SCRIPT_URL_START)){
                console.log("Found preload script. Checking for access token: ", scriptUrl);
                let scriptSrc = await (await fetch(scriptUrl)).text();
                if(scriptSrc.indexOf("SKYLINE_WEB:\"") > -1){
                    let accessToken = scriptSrc.split("SKYLINE_WEB:\"")[1].split("\"")[0];
                    console.log("Found access_token:", accessToken);
                    return accessToken;
                }
            }
        }
        return null;
    }

    async getAppList(accessToken: string, hmdType: string, sectionId: string, currentList?: ScrapeData, index?: number):Promise<ScrapeData|ScrapeDataItem[]>{
        let pageParams = {
            "sectionId":sectionId,
            "sortOrder":null,
            "sectionItemCount":24,
            "sectionCursor":currentList?currentList.data.node.all_items.page_info.end_cursor : null,
            "hmdType":hmdType
        };
        index = index || 1;
        console.log("Loading", hmdType, "apps page: ", index);
        let body = new FormData();
        body.append("access_token","OC|" + accessToken + "|");
        body.append("doc_id", DOC_ID);
        body.append("variables",JSON.stringify(pageParams));
        let response: ScrapeData = await (await fetch(SECTION_LIST_URL, {method: "POST", body})).json();
        console.log("Found " + response.data.node.all_items.edges.length + " apps");
        if(response.data.node.all_items.page_info.has_next_page){
            response.data.node.all_items.edges = response.data.node.all_items.edges
                .concat(<ScrapeDataItem[]>(await this.getAppList(accessToken, hmdType, sectionId, response, ++index)));
        }
        if(currentList) {
            return response.data.node.all_items.edges;
        }
        console.log("Finished loading", hmdType, "apps page. Loaded", response.data.node.all_items.edges.length, "apps.");
        return response;
    }
}
