/*! Copyright 2023 gnabgib MPL-2.0 */

import { StringBuilder } from "./StringBuilder.js";
import type { WindowStr } from "./WindowStr.js";
const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');

export interface IMatchDetail {
    name?:string;
    value:WindowStr;
    components?:IMatchDetail[];
}
export interface IMatchResult {
    /**
     * Successful match
     */
    get fail():boolean;
    /**
     * (optional) Remaining window
     */
    get remain():WindowStr|undefined;
    /**
     * (optional) Match detail
     */
    get result():IMatchDetail|undefined;
}

export class MatchSuccess implements IMatchResult {
    constructor(readonly remain:WindowStr,readonly result:IMatchDetail) {
    }

    readonly fail=false;

    formatDetail(sb:StringBuilder,d:IMatchDetail,indent:string) {
        const v=d.value.toString();
        //Only show a line if it has a name, or it has a value
        if (d.name!==undefined || v.length>0) {
            sb.append(indent);
            if (d.name!==undefined) {
                sb.append(d.name);
                sb.append('=');
            }
            sb.appendLine(v);
        }
        if (d.components!==undefined) {
            for(const c of d.components) {
                this.formatDetail(sb,c,indent+'  ');
            }
        }
    }

    [Symbol.toPrimitive](): string {
        const ret=new StringBuilder();
        ret.append('remain=');
        ret.append(this.remain.toString());
        ret.appendLine();
        this.formatDetail(ret,this.result,'');
        return ret.toString();
	}

    /* c8 ignore next 3 */
    [consoleDebugSymbol](/*depth, options, inspect*/) {
		return this[Symbol.toPrimitive]();
	}
}

export class MatchFail implements IMatchResult {
    constructor(
        /** Last matching position in the window that passed */        
        readonly pos:number,
        /** Match detail */
        readonly result:IMatchDetail|undefined=undefined) {
    }
    readonly remain=undefined;
    readonly fail=true;
}