/*! Copyright 2023 gnabgib MPL-2.0 */

import { StringBuilder } from "./StringBuilder.js";
import type { WindowStr } from "./WindowStr.js";
const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');

export interface MatchDetail {
    name?:string;
    value:WindowStr;
    components?:MatchDetail[];
}

export class MatchSuccess {
    readonly remain:WindowStr;
    readonly result:MatchDetail;

    constructor(remain:WindowStr,result:MatchDetail) {
        this.remain=remain;
        this.result=result;
    }

    readonly fail=false;

    formatDetail(sb:StringBuilder,d:MatchDetail,indent:string) {
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

    [consoleDebugSymbol](/*depth, options, inspect*/) {
		return this[Symbol.toPrimitive]();
	}
}

export class MatchFail {
    /**
     * Last matching position in the window that passed
     */
    readonly pos:number;
    readonly result:MatchSuccess|undefined;

    constructor(pos:number,result?:MatchSuccess) {
        this.pos=pos;
        this.result=result;
    }

    readonly fail=true;
}

export type MatchResult=MatchSuccess|MatchFail;