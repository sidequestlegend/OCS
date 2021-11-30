import {QUEST_HMD_TYPE, ScrapeData, ScrapeDataItem} from "./scrape";
import * as sqlite3 from "sqlite3"
import {Database} from "sqlite3";

const DATABASE_NAME = ":memory:"; // data_storage or :memory:

export interface ProcessedData{
    new_apps: ScrapeDataItem[],
    updated_apps: ScrapeDataItem[]
}
export class Process{
    db: Database;
    constructor() {
        this.db = new sqlite3.Database(DATABASE_NAME);
        this.db.run(`CREATE TABLE IF NOT EXISTS oculus_quest_store 
            (
                id INTEGER NOT NULL PRIMARY KEY, 
                display_name TEXT, 
                canonical_name TEXT, 
                release_date TEXT, 
                cover_square_image TEXT, 
                viewer_has_preorder BOOLEAN, 
                is_concept BOOLEAN, 
                price TEXT,
                price_reduction TEXT,
                current_offer_end_time TEXT,
                cross_buy_price TEXT,
                cross_buy_price_reduction TEXT,
                cross_buy_current_offer_end_time TEXT,
                hmd_type TEXT                
            );`);
        console.log("Creating data tables if they dont exist...");
    }
    async run(data: ScrapeData):Promise<ProcessedData>{
        return new Promise((resolve, reject)=>{
            this.db.all("SELECT id, display_name, canonical_name, price FROM oculus_quest_store;",
                (err, rows)=> {
                    console.log("Existing apps: ", rows.length);
                    console.log("Scraped apps: ", data.data.node.all_items.edges.length);
                    let new_apps: ScrapeDataItem[] = [], updated_apps: ScrapeDataItem[] = [];
                    let now = Math.round(Date.now() / 1000);
                    data.data.node.all_items.edges.forEach(item=>{
                        if(item.node.viewer_has_preorder){
                            console.log("has_preorder", item.node.display_name, item.node.id);
                        }
                        let existing_item = null;
                        rows.forEach( (row)=> {
                            if(Number(item.node.id) === row.id) {
                                existing_item = row;
                            }
                        });
                        if(existing_item) {
                            let lowerPrice = Number(existing_item.price) >
                                Number(item.node.current_offer.price.offset_amount);
                            let lowerPriceCrossBuy = item.rift_cross_buy &&
                                Number(existing_item.cross_buy_price) >
                                Number(item.rift_cross_buy.node.current_offer.price.offset_amount);
                            if(existing_item.viewer_has_preorder && item.node.release_date !> now){
                                item.node.viewer_had_preorder = true;
                                new_apps.push(item);
                            }else if(lowerPrice || lowerPriceCrossBuy){
                                if(lowerPriceCrossBuy){
                                    item.node.cross_buy_sale = true;
                                }
                                updated_apps.push(item);
                            }
                        } else {
                            if(item.node.release_date > now) {
                                item.node.viewer_has_preorder = true;
                            }
                            new_apps.push(item);
                        }
                    });
                    console.log("New apps: ", new_apps.length);
                    console.log("Updated apps: ", updated_apps.length);
                    if(new_apps.length){
                        this.dbQry(`INSERT INTO oculus_quest_store 
                        (
                            id, 
                            display_name, 
                            canonical_name, 
                            is_concept, 
                            release_date, 
                            viewer_has_preorder, 
                            cover_square_image, 
                            price, 
                            price_reduction, 
                            current_offer_end_time, 
                            cross_buy_price,
                            cross_buy_price_reduction,
                            cross_buy_current_offer_end_time,
                            hmd_type
                        )
                        VALUES
                        (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, new_apps.map(d=>{
                            let offer = d.node.current_offer;
                            let riftOffer = d.rift_cross_buy ? d.rift_cross_buy.node.current_offer: null;
                            return [
                                d.node.id,
                                d.node.display_name,
                                d.node.canonicalName,
                                d.node.is_concept,
                                d.node.release_date,
                                d.node.viewer_has_preorder,
                                d.node.cover_square_image.uri,
                                offer.price.offset_amount,
                                offer.promo_benefit,
                                offer.end_time,
                                riftOffer ? riftOffer.price.offset_amount : null,
                                riftOffer ? riftOffer.promo_benefit : null,
                                riftOffer ? riftOffer.end_time : null,
                                QUEST_HMD_TYPE
                                // Need to look at how I can also store other device types but for now I
                                // am at least storing the HMD Type
                            ]
                        }))
                    }
                    if(updated_apps.length){
                        this.dbQry(
                            `UPDATE oculus_quest_store 
                                SET 
                                    price = ?, 
                                    price_reduction = ?, 
                                    current_offer_end_time = ?,
                                    cross_buy_price = ?,
                                    cross_buy_price_reduction = ?,
                                    cross_buy_current_offer_end_time = ?
                                WHERE id = ?`,
                            updated_apps.map(d=>{
                                let offer = d.node.current_offer;
                                let riftOffer = d.rift_cross_buy ? d.rift_cross_buy.node.current_offer: null;
                                return [
                                    offer.price.offset_amount,
                                    offer.promo_benefit,
                                    offer.end_time,
                                    riftOffer ? riftOffer.price.offset_amount : null,
                                    riftOffer ? riftOffer.promo_benefit : null,
                                    riftOffer ? riftOffer.end_time : null,
                                    Number(d.node.id)
                                ]
                            })
                        );
                    }
                    resolve({new_apps, updated_apps})
                });
        });
    }

    dbQry(qry: string, data: any[]){
        let stmt = this.db.prepare(qry, err=>this.logError(err));
        data.forEach(d=>{
            stmt.run(d, err=>this.logError(err));
        });
        stmt.finalize(err=>this.logError(err));
    }

    logError(err){
        if(err){
            console.log(err);
        }
    }
}
