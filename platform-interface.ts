import {ScrapeDataItem} from "./scrape";

export interface PlatformInterface{
    postSale(data: ScrapeDataItem);
    postCrossBuySale(data: ScrapeDataItem);
    postPreorder(data: ScrapeDataItem);
    postPreorderReleased(data: ScrapeDataItem);
    postNew(data: ScrapeDataItem);
}
