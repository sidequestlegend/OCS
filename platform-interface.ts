import {ScrapeDataItem} from "./scrape";
import {ProcessedData} from "./process";

export interface PlatformInterface{
    run(data: ProcessedData); // Receives an object with two properties, new_apps and updated_apps. This method
    // should decide which of the other methods to run.
    postSale(data: ScrapeDataItem);
    postCrossBuySale(data: ScrapeDataItem);
    postPreorder(data: ScrapeDataItem);
    postPreorderReleased(data: ScrapeDataItem);
    postNew(data: ScrapeDataItem);
}
