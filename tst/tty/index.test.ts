/* eslint-disable no-control-regex */
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {Underline,Weight,LetterStyle,Blink,tty, reset, Color,demo, Ctrl, BgColor, Invert, Hide, StrikeThrough, Overline} from '../../src/tty/index';


const tsts = suite('TTY');

const ctrlTests:[string,string][]=[
    [
        tty`Hi${Ctrl.up()}there`,
        'Hi\\e[Athere'],
    [
        tty`Hi${Ctrl.up(3)}there`,
        'Hi\\e[3Athere'],
    [
        tty`Hi${Ctrl.down()}there`,
        'Hi\\e[Bthere'],
    [
        tty`Hi${Ctrl.down(3)}there`,
        'Hi\\e[3Bthere'],
    [
        tty`Hi${Ctrl.left()}there`,
        'Hi\\e[Dthere'],
    [
        tty`Hi${Ctrl.left(3)}there`,
        'Hi\\e[3Dthere'],
    [
        tty`Hi${Ctrl.right()}there`,
        'Hi\\e[Cthere'],
    [
        tty`Hi${Ctrl.right(3)}there`,
        'Hi\\e[3Cthere'],
    [
        tty`Hi${Ctrl.jump(2,2)}there`,
        'Hi\\e[2;2Hthere'],
    [
        tty`Hi${Ctrl.clearScreen_toEnd}there`,
        'Hi\\e[Jthere'],
    [
        tty`Hi${Ctrl.clearScreen_toStart}there`,
        'Hi\\e[1Jthere'],
    [
        tty`Hi${Ctrl.clearScreen_all}there`,
        'Hi\\e[2Jthere'],
    [
        tty`Hi${Ctrl.clearScreen_allAndScroll}there`,
        'Hi\\e[3Jthere'],
    [
        tty`Hi${Ctrl.clearLine_toEnd}there`,
        'Hi\\e[Kthere'],
    [
        tty`Hi${Ctrl.clearLine_toStart}there`,
        'Hi\\e[1Kthere'],
    [
        tty`Hi${Ctrl.clearLine_all}there`,
        'Hi\\e[2Kthere'],
];
let count=0;
for(const [tty,expect] of ctrlTests) {
    //Replace the output escape char with.. an escape of the escape (which is escape.. you with me?)
    tsts(`ctrl[${count++}]`,()=>{
        assert.equal(tty.replace(/\x1b/g,'\\e'),expect);
    })
}

const styleTests:[string,string][]=[
    // STYLES -- --
    //Underline is automatically removed at the end
    [
        tty`Hi ${Underline.single}bud${Underline.off} doing ${Underline.double}ok?`,
        'Hi \\e[4mbud\\e[24m doing \\e[21mok?\\e[24m'],
    //Since weight is set and removed, no extra end clearing required
    [
        tty`Hello my ${Weight.bold}good${Weight.regular} friend`,
        'Hello my \\e[1mgood\\e[22m friend'],
    // Foreground Color -- --
    //Set color to a grey
    [
        tty`I'm ${Color.grey24(12)} grey text`,
        'I\'m \\e[38;5;244m grey text\\e[39m'],
    //Set color to a rgb6
    [
        tty`I'm ${Color.rgb6(5,0,0)} red${Color.default} text`,
        'I\'m \\e[38;5;196m red\\e[39m text'],
    //Set color to a rgb
    [
        tty`I'm ${Color.rgb(0xff,0,0)} red text`,
        'I\'m \\e[38;2;255;0;0m red text\\e[39m'],
    // Background Color -- --
    //Set bgcolor to a grey
    [
        tty`I have a ${BgColor.grey24(12)} grey background`,
        'I have a \\e[48;5;244m grey background\\e[49m'],
    //Set bgcolor to a rgb6
    [
        tty`I had a ${BgColor.rgb6(5,0,0)}red background${BgColor.default}, briefly`,
        'I had a \\e[48;5;196mred background\\e[49m, briefly'],
    //Set bgcolor to a rgb
    [
        tty`I have a ${BgColor.rgb(123,0,0)} red background`,
        'I have a \\e[48;2;123;0;0m red background\\e[49m'],
    //Compound
    [
        tty`${LetterStyle.italic}It${LetterStyle.regular} was a ${Blink.slow}distracting${Blink.none} ${Invert.on}day${Invert.off} because ${Hide.on}James${Hide.off} ${StrikeThrough.on}ran${StrikeThrough.off}walked f${Overline.on}a${Overline.off}r.`,
        '\\e[3mIt\\e[23m was a \\e[5mdistracting\\e[25m \\e[7mday\\e[27m because \\e[8mJames\\e[28m \\e[9mran\\e[29mwalked f\\e[53ma\\e[55mr.'],
    // Reset -- --
    [
        `Style ${reset()} reset`,
        'Style \\e[0m reset'],
    // Ignore other expressions
    [
        tty`I ${'will'} be ignored ${3.14} ${true} ${5}`,
        'I will be ignored 3.14 true 5'],
]
count=0;
for(const [tty,expect] of styleTests) {
    //Replace the output escape char with.. an escape of the escape (which is escape.. you with me?)
    tsts(`style[${count++}]`,()=>{
        assert.equal(tty.replace(/\x1b/g,'\\e'),expect);
    })
}

tsts(`coverage`,()=>{
    const c=demo();
    //console.log(c);
    assert.is(c.length>0,true);
});

tsts.run();