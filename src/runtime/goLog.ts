/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { hex } from "../codec/Hex.js";
import { U64MutArray } from "../primitive/number/U64.js";

/* c8 ignore start - testing this without making noise is tricky */

/**
 * A series of logging tools that are close to golang's style of 
 * logging to aid in cross-lang comparisons
 */

export function uLog32(u: Uint32Array) {
    let line='';

    const safeLen=Math.floor(u.length/4)*4;
    let i=0;
	for (; i < safeLen; ) {
        line += hex.fromI32(u[i++]).toLowerCase() + ' ';
        line += hex.fromI32(u[i++]).toLowerCase() + ' ';
        line += hex.fromI32(u[i++]).toLowerCase() + ' ';
        console.log(line+hex.fromI32(u[i++]).toLowerCase() + ' ');
        line='';
    }
    if (i==u.length) return;
    for(;i<u.length;i++) 
        line += hex.fromI32(u[i++]).toLowerCase() + ' ';
    console.log(line);
}
export function uLog64(u: U64MutArray) {
    let line='';

    const safeLen=Math.floor(u.length/2)*2;
    let i=0;
	for (; i < safeLen; ) {
        line += u.at(i++).toString().toLowerCase() + ' ';
        console.log(line+u.at(i++).toString().toLowerCase() + ' ');
        line='';
    }
    if (i==u.length) return;
    //Can only be off by one
    console.log(u.at(i++).toString().toLowerCase() + ' ');
}

/* c8 ignore stop */