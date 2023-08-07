import { StringBuilder } from "../../primitive/StringBuilder.js";
import { IMatcher } from "./IMatcher.js";


export interface INode extends Iterable<INode> {
    addTransition(by: IMatcher, to: INode): void;
    addEpsilon(to: INode): void;
    transition(charCode: number): INode | undefined;
    get isEpsilon(): boolean;
    get isEnd(): boolean;
    debug(sb: StringBuilder): void;
    toString(): string;
}
