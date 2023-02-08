import { Uint64 } from '../primitive/Uint64.js';

export { iv512 as iv } from './_Sha2.js';
export { sigmas } from './_blake.js';

export const fanOutUnlimited = 0;
export const fanOutSequential = 1;
export const maxDepthUnlimited = 255;
export const maxDepthSequential = 1;
export const leafMaxLenUnlimited = 0;
export const leafMaxLenSequential = 0;
export const nodeOffsetSequential = new Uint64(0);
export const nodeDepthIsLeaf = 0;
export const nodeDepthSequential = 0;
export const innerLenSequential = 0;
