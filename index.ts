import {Scrape, ScrapeData} from "./scrape";
import {Process, ProcessedData} from "./process";
import {Reddit} from "./reddit";
import {Telegram} from "./telegram";
import {PlatformInterface} from "./platform-interface";

let scrape = new Scrape();
let process = new Process();
let posters: PlatformInterface[] = [new Reddit(), new Telegram()];

let run = async () => {
    let data: ScrapeData = await scrape.run();
    let processedData: ProcessedData = await process.run(data);
    for(let i =0; i < posters.length; i++){
        await posters[i].run(processedData);
    }
}

setInterval(run, 1000 * 60 * 60 * 24); // run once a day?

run(); // run once at the start
