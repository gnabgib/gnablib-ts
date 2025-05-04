import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {expect} from '../../src/test/compile';

const tsts = suite('expect');

//We can't actually test these because the compiler catches them, not the runtime
//Works, catches 1!=string
// expect<string>(1)
//Works, catches "Hi"!=number 
// expect<number>("Hi");
//works, catches 1!=bool 
// expect<boolean>(1);
//fails because not string/number/boolean 
// expect<undefined>(22);
// expect<any>(2);
//works, catches 1!=never
// expect<never>(1);

tsts.run();