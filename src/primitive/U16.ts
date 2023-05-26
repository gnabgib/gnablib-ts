const sizeBytes=2;
const sizeBits=16;
const i16Mask=0xffff;
const rotMask=0x0f;

/**
 * Treat i16 as a signed/unsigned 16bit number, and rotate left
 * @param i16 uint16/int16, if larger than 16 bits it'll be truncated
 * @param by amount to rotate 0-15 (%16 if oversized)
 * @returns Left rotated number
 */
export function rol16(i16:number,by:number):number {
    //Truncate input (with 32 we get this step for free because bitwise is only 32bit)
    i16&=i16Mask;
    by&=rotMask;
    return ((i16 << by) | (i16 >>> (sizeBits - by)))&i16Mask;
}

/**
 * Treat i16 as a signed/unsigned 16bit number, and rotate right
 * @param i16 uint16/int16, if larger than 16 bits it'll be truncated
 * @param by amount to rotate 0-15 (%16 if oversized)
 * @returns Right rotated number
 */
export function ror16(i16:number,by:number):number {
    //Truncate input (with 32 we get this step for free because bitwise is only 32bit)
    i16&=i16Mask;
    by&=rotMask;
    return ((i16 >>> by) | (i16 << (sizeBits - by)))&i16Mask;
}