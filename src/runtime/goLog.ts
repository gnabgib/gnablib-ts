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

export function uLog64(u: U64MutArray,name='') {
    let line=' ';
    console.log(`${name} = [`);
    const safeLen=Math.floor(u.length/4)*4;
    let i=0;
	for (; i < safeLen; ) {
        console.log(
            line +
            ' '+u.at(i++).toString().toLowerCase() +
            ' '+u.at(i++).toString().toLowerCase() +
            ' '+u.at(i++).toString().toLowerCase() +
            ' '+u.at(i++).toString().toLowerCase()
        );
        line=' ';
    }
    if (i!=u.length) {
        for(;i<u.length;) {
            line+=' '+u.at(i++).toString().toLowerCase();
        }
        console.log(line);
    }
    console.log(']');
}

/* c8 ignore stop */