/*! Copyright 2023 gnabgib MPL-2.0 */

import { safety } from "../../primitive/Safety.js";
import { asciiCased, printable } from "../../primitive/Utf.js";
const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');

// Nondeterministic Finite Automata (NFA) + Thompson solver
// [Programming Techniques: Regular expression search algorithm](https://dl.acm.org/doi/10.1145/363347.363387)
// [Regular Expression Matching Can Be Simple And Fast](https://swtch.com/~rsc/regexp/regexp1.html)

interface IMatcher {
    match(charCode:number):boolean;
    toString():string;
}

/**
 * A single character (control, numeric, or case-sensitive)
 */
export class CharMatch implements IMatcher {
    private readonly _code:number;
    
    constructor(code:number|string) {
        if (typeof code === 'string') {
            safety.lenGte(code,1,'code');
            this._code=code.charCodeAt(0);
        } else {
            this._code=code;
        }
    }

    match(charCode: number): boolean {
        return this._code===charCode;
    }

    toString(): string {
        return printable(this._code)?"'"+String.fromCharCode(this._code)+"'" : '\\d'+this._code;
    }

    /* c8 ignore next 3 */
    [consoleDebugSymbol](/*depth, options, inspect*/) {
        return this.toString();
	}    
}

/**
 * A single character of it's case variant
 */
export class InsensitiveMatch implements IMatcher {
    private readonly _code:number;

    constructor(code:number|string) {
        if (typeof code === 'string') {
            safety.lenGte(code,1,'code');
            code=code.charCodeAt(0);
        }
        if (asciiCased(code)) {
            this._code=code|0x20;
        } else {
            this._code=code;
        }
    }

    match(charCode: number): boolean {
        return this._code===(charCode|0x20);
    }

    toString(): string {
        return this._code+'/i';    
    }

    /* c8 ignore next 3 */
    [consoleDebugSymbol](/*depth, options, inspect*/) {
        return this.toString();
	}    

}

export class RangeMatch implements IMatcher {
    private readonly _low:number;
    private readonly _high:number;
    
    constructor(low:number,high:number) {
        this._low=low;
        this._high=high;
    }

    match(charCode: number): boolean {
        if (charCode<this._low) return false;
        if (charCode>this._high) return false;
        return true;
    }

    toString():string {
        return this._low+'-'+this._high;
    }
}
