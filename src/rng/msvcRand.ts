/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe } from "../safe/index.js";

/**
 * Build a [MSVC](https://orlp.net/blog/when-random-isnt/) 
 * [Linear congruential generator](https://en.wikipedia.org/wiki/Linear_congruential_generator)
 * rand()
 * 
 * *NOT cryptographically secure*
 * @param seed Starting state - valid integer
 */
export const msvcRand =(seed=1):() => number=>{
    superSafe.int.is(seed);
    let s=seed>>>0;//cast to u32
    return () => {
        s=(s*214013 + 2531011) >>>0;
        return (s>>>16) & 0x7fff;
    }
}

