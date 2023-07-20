/*! Copyright 2023 the gnablib contributors MPL-1.1 */

export class StringBuilder {
    private readonly _nl:string;
    private readonly _parts:string[]=[];

    constructor(newline='\n') {
        this._nl=newline;
    }

    /**
     * Length of the content (warning: calculated)
     */
    get length():number {
        let ret=0;
        for(const p of this._parts)
            ret+=p.length;
        return ret;
    }

    /**
     * Append content to the builder
     * @param content 
     */
    append(content:string) {
        this._parts.push(content);
    }

    /**
     * Append the given content (if defined) and then a newline marker
     */
    appendLine(content?:string) {
        if (content!==undefined) this._parts.push(content);
        this._parts.push(this._nl);
    }

    /**
     * Clear the content of the builder
     */
    clear() {
        this._parts.splice(0,this._parts.length);
    }

    /**
     * Remove `num` characters from the end of the builder
     * @param num 
     * @returns The removed characters
     */
    cutLast(num=1):string {
        let ret='';
        while(num>0) {
            const p=this._parts[this._parts.length-1];
            if (p.length>num) {
                const end=p.length-num;
                this._parts[this._parts.length-1]=p.substring(0,end);                
                return p.substring(end);
            } else {
                this._parts.splice(this._parts.length-1,1);
                ret+=p;
                num-=p.length;
            }
        }
        return ret;
    }

    [Symbol.toPrimitive](): string {
        return this._parts.join('');   
	}

    /**
     * Collapse back into a string
     * @returns 
     */
    toString():string {
        return this._parts.join('');   
    }
}