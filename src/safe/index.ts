/*! Copyright 2024 the gnablib contributors MPL-1.1 */

/*

somewhatSafe - Does range checks, but not type checks
superSafe - Does range and type checks
safe - Defaults to superSafe, but can be switched by setting safe.super=false;

if (safe.super) will throw on bad types

safe.super:boolean
safe.int.is(test:unknown) //May throw TypeError
safe.int.inRangeInclusive(test:number,low:number,high:number) //May throw RangeError

*/

import { InclusiveRangeError } from "../primitive/error/InclusiveRangeError.js";
import { LengthError } from "../primitive/error/LengthError.js";
import { ILengther } from "../primitive/interfaces/ILengther.js";

function noTest(test:unknown) {}

/** Integer safety checks */
export interface ISafeInt {
    /** May throw if $test is not an integer */
    is(test:unknown): void;
    /** May throw if $test <$lowIn or >highInc  */
    inRangeInc(test: number,lowInc: number,highInc: number): void;
    /** Coerce $input into an integer :: that will fit in $bytes bytes */
    coerce(input:unknown):number;
}

export interface ISafeFloat {
    is(test:unknown):void;
    coerce(input:unknown):number;
}

/** String safety checks */
export interface ISafeStr {
    /** May throw if $test is not a string */
    is(test:unknown):void;
    /** Null/undefined or empty string are converted to undefined, other values are coerced to string and returned */
    nullEmpty(v:unknown):string|undefined;
}

export interface ISafe {
    int:ISafeInt;
    float:ISafeFloat;
    string:ISafeStr;
    /** Make sure that $test is at least $need elements in size */
    lengthAtLeast(test:ILengther,need:number):void;
}

/** Performs range checks, but not type checks */
export const somewhatSafe:ISafe= {
    int:{
        is:noTest,
        inRangeInc: function(test:number,lowInc:number,highInc:number) {
            if (test<lowInc || test>highInc)
                throw new InclusiveRangeError(test,lowInc,highInc);
        },
        coerce(input:unknown):number {
            //todo: byte concern?
            // if (bytes) this.inRangeInc(bytes,0,6);//JS supports 53 bit ints max, in terms of bytes 2^48 is the max
            // else bytes=6;
            return (input as number)|0;
        },
    },
    float:{
        is: noTest,
        coerce: function (input: unknown): number {
            return +(input as number);
        }
    },
    string: {
        is:noTest,
        nullEmpty: function(v:unknown):string|undefined {
            if (v===null || v===undefined) return undefined;
            //Coerce to string
            const str=""+v;
            if (str.length===0) return undefined;
            return str;
        }
    },
    lengthAtLeast(test:ILengther,need:number) {
        if (test.length<need) throw new LengthError(need,test.length);
    },
};

/** Performs range and type checks */
export const superSafe:ISafe = {
    int: {
        is: function(test:unknown) {
            if (!Number.isSafeInteger(test)) throw new TypeError(`Not an integer: ${test}`);
        },
        inRangeInc: function(test:number,lowInc:number,highInc:number) {
            superSafe.int.is(test);
            somewhatSafe.int.inRangeInc(test,lowInc,highInc);
        },
        coerce:somewhatSafe.int.coerce
    },
    float: {
        is: function (test: unknown): void {
            if (!(typeof test === "number")) throw new TypeError(`Not a float: ${test}`);
        },
        coerce: somewhatSafe.float.coerce
    },
    string: {
        is:function(test:unknown) {
            if (typeof test !== "string") throw new TypeError(`Not a string: ${test}`);
        },
        nullEmpty:somewhatSafe.string.nullEmpty
    },
    lengthAtLeast:somewhatSafe.lengthAtLeast
}

// export const safe:ISafe=superSafe;
// safe.