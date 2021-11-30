import {Scrape, ScrapeData} from "./scrape";
import {Process, ProcessedData} from "./process";
import {Reddit} from "./reddit";
import {Telegram} from "./telegram";
import {PlatformInterface} from "./platform-interface";

let scrape = new Scrape();
let process = new Process();
let platforms: PlatformInterface[] = [new Reddit(), new Telegram()];

let run = async () => {
    let data: ScrapeData = await scrape.run();
    let processedData: ProcessedData = await process.run(data);
    // An object with two properties, new_apps and updated_apps. This next bit
    // should decide how to interpret the new and updated apps  and make posts to
    // all the platforms ( telegram, reddit ).
    for(let i =0; i < platforms.length; i++){
        for(let i = 0; i < processedData.updated_apps.length; i++){
            if(processedData.updated_apps[i].node.cross_buy_sale){
                await platforms[i].postCrossBuySale(processedData.updated_apps[i])
            }else{
                await platforms[i].postSale(processedData.updated_apps[i]);
            }
        }
        for(let i = 0; i < (processedData.new_apps.length > 1 ? 1 : processedData.new_apps.length); i++){
            if(processedData.new_apps[i].node.viewer_had_preorder){
                await platforms[i].postPreorderReleased(processedData.new_apps[i]);
                console.log("Posting new Preorder Release to reddit for ", processedData.new_apps[i].node.display_name);
            }else if(processedData.new_apps[i].node.viewer_has_preorder){
                await platforms[i].postPreorder(processedData.new_apps[i]);
                console.log("Posting new Preorder to reddit for ", processedData.new_apps[i].node.display_name);
            }else{
                await platforms[i].postNew(processedData.new_apps[i]);
                console.log("Posting new app to reddit for ", processedData.new_apps[i].node.display_name);
            }
        }
        // await platforms[i].run(processedData);
    }
}

setInterval(run, 1000 * 60 * 60 * 24); // run once a day?

run(); // run once at the start
