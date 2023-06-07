import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Hex } from '../../src/encoding/Hex';
import { ArrayBufferWindow } from '../../src/encoding/ArrayBufferWindow';
import { Uint64 } from '../../src/primitive/Uint64';
import { Int64 } from '../../src/primitive/Int64';

const tsts = suite('matchers');
tsts.run();
