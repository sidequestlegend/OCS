import {ProcessedData} from "./process";
import {PlatformInterface} from "./platform-interface";
import {ScrapeDataItem} from "./scrape";

export class Telegram implements PlatformInterface{
    async post(item: ScrapeDataItem, message: string){

    }

    postCrossBuySale(data: ScrapeDataItem): void {
    }

    postNew(data: ScrapeDataItem): void {
    }

    postPreorder(data: ScrapeDataItem): void {
    }

    postSale(data: ScrapeDataItem): void {
    }

    run(data: ProcessedData) {
    }

    postPreorderReleased(data: ScrapeDataItem) {
    }

}
