/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import type { WindowStr } from "../WindowStr.js";

export interface IMatchDetail {
    name?: string;
    value: WindowStr;
    components?: IMatchDetail[];
}
