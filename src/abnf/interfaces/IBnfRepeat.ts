import { IBnf } from "./IBnf.js";


export interface IBnfRepeat extends IBnf {
    get rule(): IBnf;
}
