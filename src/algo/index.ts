// algo barrel file
export type { IMatcher } from './interfaces/IMatcher.js';
export type { INode } from './interfaces/INode.js';
export type { IRandSrc } from './interfaces/IRandSrc.js';

export { nextPow2 } from './nextPow2.js';
export { Nfa } from './nfa/Nfa.js';
export { CharMatch, InsensitiveMatch, RangeMatch } from './nfa/matchers.js';
export { RandTk } from './RandTk.js';
