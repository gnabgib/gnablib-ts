/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from "../../safe/index.js";
import { BitReader } from "../BitReader.js";
import { BitWriter } from "../BitWriter.js";
import { stringExt } from "../StringExt.js";
import { Hour } from "./Hour.js";
import { Minute } from "./Minute.js";
import { Second } from "./Second.js";

const u8MemSize=6;

// /** 
//  * Time of day in microsecond resolution (h:m:s.000000) 
//  * Range 0:0:0.000000 - 23:59:59.999999 (no leap second support) */
// export class TimeOnly {
//     static readonly serialBits=37;
//     readonly hour:Hour;
//     readonly minute:Minute;
//     readonly second:Second;
//     r
// }