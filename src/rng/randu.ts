/*! Copyright 2024 the gnablib contributors MPL-1.1 */
import { superSafe } from "../safe/index.js";

export const randu = (seed = 1): () => number => {
    superSafe.int.is(seed);
    let s = seed;
    //a= 65539 c=0
    /** Get the next random number */
    return () => {
        s = (s * 65539) & 2147483647;
        return s;
    };
};
