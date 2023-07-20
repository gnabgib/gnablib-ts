/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { safety } from "../../primitive/Safety.js";
import { StringBuilder } from "../../primitive/StringBuilder.js";
import type { WindowStr } from "../../primitive/WindowStr.js";
const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');

// Nondeterministic Finite Automata (NFA) + Thompson solver
// [Programming Techniques: Regular expression search algorithm](https://dl.acm.org/doi/10.1145/363347.363387)
// [Regular Expression Matching Can Be Simple And Fast](https://swtch.com/~rsc/regexp/regexp1.html)

export interface IMatcher {
    match(charCode:number):boolean;
    toString():string;
}

export interface INode extends Iterable<INode> {
    addTransition(by:IMatcher,to:INode):void;
    addEpsilon(to:INode):void;
    transition(charCode:number):INode|undefined;
    get isEpsilon():boolean;
    get isEnd():boolean;
    debug(sb:StringBuilder):void;
    toString():string;
}

class Node implements INode{
    //State in original article
    private _by:IMatcher|undefined;
    private _dests:Node[]=[];

    addTransition(by:IMatcher,to:Node) {
        if (this._dests.length>0) throw new Error('Destinations already defined');
        this._by=by;
        this._dests.push(to);
    }

    addEpsilon(to:Node) {
        if (this._by!==undefined) throw new Error('Destination is already by match');
        //In theory the spec said you can only have two.. is that true?
        this._dests.push(to);
    }

    transition(charCode:number,debug=false):Node|undefined {
        if (this._by===undefined) {
            return undefined;
        }
        if (this._by.match(charCode)) {
            if (debug) console.log(`${charCode}==${this._by.toString()}`);
            return this._dests[0];
        }
        if (debug) console.log(`${charCode}!=${this._by.toString()}`);
        return undefined;
    }

    get isEpsilon():boolean {
        return this._dests.length>0 && this._by===undefined;
    }

    get isEnd():boolean {
        return this._dests.length===0;
    }

    [Symbol.iterator](): Iterator<Node> {
        return this._dests[Symbol.iterator]();
	}

    debug(sb:StringBuilder,child=false) {
        if (this.isEnd) {
            sb.append('⊞');
            return;
        }
        if (!child) {
            sb.append('⊡-');
        } else {
            sb.append('>()-');
        }
        if (this.isEpsilon) {
            sb.append('ε');
            if (this._dests.length>1) sb.append(':'+this._dests.length.toString());
        } else {
            sb.append(this._by?.toString()??'');
        }
        sb.append('-');
        this._dests[0].debug(sb,true);
    }

    toString():string {
        return this[consoleDebugSymbol]();
    }

    [consoleDebugSymbol](/*depth, options, inspect*/) {
        const sb=new StringBuilder();
        sb.append('Node');
        this.debug(sb);
        return sb.toString();
	} 
}

export class Nfa {
    debug=false;
    private _start:INode;
    private _end:INode;
    
    constructor() {
        const start=new Node();
        this._start=start;
        this._end=start;
    }

    get start():INode {
        return this._start;
    }

    get end():INode {
        return this._end;
    }

    concat(...by:(IMatcher|Nfa)[]):Nfa {
        // ()->()-> ..
        for(const b of by) {
            const newEnd=new Node();
            if (b instanceof Nfa){
                this._end.addEpsilon(b._start);
                b._end.addEpsilon(newEnd);
            } else {
                this._end.addTransition(b,newEnd);
            }
            this._end=newEnd;
        }
        return this;
    }

    union(...across:(IMatcher|Nfa)[]):Nfa {
        // ()->
        //  \->
        const newEnd=new Node();
        for(const a of across) {
            if (a instanceof Nfa) {
                this._end.addEpsilon(a.start);
                a.end.addEpsilon(newEnd);
            } else {
                const e=new Node();
                this._end.addEpsilon(e);
                e.addTransition(a,newEnd);
            }
        }
        this._end=newEnd;
        return this;  
    }

    repeat(what:IMatcher,min:number,max?:number):Nfa {
        // [x]->[x]->..(min) ->()->[x]->()->[x]->()..(max)
        //                      \        \_________//^
        //                       \________________/
        safety.intGte(min,0,'min');
        if (max===undefined) {
            max=min;
        } else {
            safety.intGte(max,min,'max');
        }

        //Add required nodes
        let i=0;
        for (;i<min;i++) {
            const newEnd=new Node();
            this._end.addTransition(what,newEnd);
            this._end=newEnd;
        }
        //Add optional nodes
        if (max>min) {
            const finalEnd=new Node();
            for (;i<max;i++) {
                const newEnd=new Node();
                const subStart=new Node();
                this._end.addEpsilon(subStart);
                this._end.addEpsilon(finalEnd);
                subStart.addTransition(what,newEnd);
                this._end=newEnd;
            }
            this._end.addEpsilon(finalEnd);
            this._end=finalEnd;
        }

        return this;
    }

    zeroOrMore():Nfa {
        // ()->()-[X]->()->()
        //  \   ^\____/  /^
        //   \__________/
        const newStart:INode=new Node();
        const newEnd:INode=new Node();
        //Add into (1+ times)
        newStart.addEpsilon(this._start);
        //Add bypass (zero times)
        newStart.addEpsilon(newEnd);
        //out to new end
        this._end.addEpsilon(newEnd);
        //Or back to start (repeat)
        this._end.addEpsilon(this._start);

        //Update network
        this._start=newStart;
        this._end=newEnd;
        return this;
    }

    zeroOrOne():Nfa {
        // ()->[x]->()
        //  \_____/^
        const newStart:INode=new Node();
        const newEnd:INode=new Node();
        //One time
        newStart.addEpsilon(this._start);
        //Zero times
        newStart.addEpsilon(newEnd);
        this._end.addEpsilon(newEnd);
        
        //Update network
        this._start=newStart;
        this._end=newEnd;
        return this;
    }

    oneOrMore():Nfa {
        // ()->[x]->()
        //  ^\_____/
        const newStart:INode=new Node();
        const newEnd:INode=new Node();
        //Wrap the current network
        newStart.addEpsilon(this._start);
        this._end.addEpsilon(newEnd);
        //Add the loop
        this._end.addEpsilon(this._start);
        
        //Update network
        this._start=newStart;
        this._end=newEnd;
        return this;
    }
    
    private addNextState(n:INode,nextStates:INode[],visited:INode[]) {
        if (n.isEpsilon) {
            for(const e of n) {
                if (!visited.find(v=>v===e)) {
                    visited.push(e);
                    this.addNextState(e,nextStates,visited);
                }
            }
        } else {
            nextStates.push(n);
        }
    }

    /**
     * Thompson Search
     * @param str 
     * @returns 
     */
    search(str:WindowStr):number {
        let currentStates:Node[]=[];
        let i=0;
        let sawExit=-1;
        this.addNextState(this._start,currentStates,[]);

        for (;i<str.length;i++) {
            const nextStates:Node[]=[];
            for(const s of currentStates) {
                const next=s.transition(str.charCodeAt(i),this.debug);
                if (next) {
                    this.addNextState(next,nextStates,[]);
                }
                if (s.isEnd) sawExit=i;
            }
            currentStates=nextStates;
            if (this.debug) {
                console.log(currentStates);
                console.log(`eating char ${i}`);
            }
        }
        if (this.debug) console.log(currentStates);
        
        if (currentStates.find(n=>n.isEnd) !==undefined) {
            //If we consumed everything (have an exit node), return that
            return i;
        } else if (sawExit>=0) {
            //If we saw an exit in the past, return that
            return sawExit;
        }
        //Otherwise fail
        return -1;
    }
    
    [consoleDebugSymbol](/*depth, options, inspect*/) {
        const sb=new StringBuilder();
        sb.append("NFA ");
        this._start.debug(sb);

        return sb.toString();
	}
}

export {CharMatch,InsensitiveMatch,RangeMatch} from './matchers.js'