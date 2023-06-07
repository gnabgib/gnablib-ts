import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { escape } from '../src/RegExp';

const tsts = suite('RegExp');

const tests:[string,string][]=[
    [
        'All of these should be escaped: \\ ^ $ * + ? . ( ) | { } [ ]',
        'All of these should be escaped: \\\\ \\^ \\$ \\* \\+ \\? \\. \\( \\) \\| \\{ \\} \\[ \\]'
    ],
    [
        'Canadian $100 bills feature Robert Borden',
        'Canadian \\$100 bills feature Robert Borden',
    ]
]
for (const [start,expect] of tests) {
    tsts(`escape(${start})`,()=>{
        const actual=escape(start);
        assert.is(actual,expect);
    });
}

tsts.run();