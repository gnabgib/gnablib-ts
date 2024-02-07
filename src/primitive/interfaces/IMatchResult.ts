/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { IMatchDetail } from "./IMatchDetail.js";
import type { WindowStr } from "../WindowStr.js";

export interface IMatchResult {
    /**
     * Successful match
     */
    get fail(): boolean;
    /**
     * (optional) Remaining window
     */
    get remain(): WindowStr | undefined;
    /**
     * (optional) Match detail
     */
    get result(): IMatchDetail | undefined;
}
