import { Bit } from './types/bit'
import { BOC, Cell, Slice, Builder, Hashmap, HashmapE } from './boc'
import * as Utils from './utils'
import { bytesToHex, bytesToString, stringToBytes } from 'utils/helpers'

const accountV3_initial_data = function(subwalletID: number, publicKey: Uint8Array): string {
    const cell = new Builder()
        .storeUint(0, 32)
        .storeUint(subwalletID, 32)
        .storeBytes(publicKey)
        .cell();
    return BOC.toHexStandard(cell);
};

const accountV3_deploy_message = function(subwalletID: number, publicKey: Uint8Array): string {
    const cell = new Builder()
        .storeUint(this.subwalletId, 32)
        .storeInt(-1, 32) // valid until
        .storeUint(0, 32) // seqno
        .cell();
    return BOC.toHexStandard(cell);
};

const accountV3_address = function(code: string, data: string): string {
    const cell = new Builder()
        .storeBits([ 0, 0, 1, 1, 0 ])
        .storeRef(BOC.fromStandard(code))
        .storeRef(BOC.fromStandard(data))
        .cell();
    return `${cell.hash()}`;
};

export { 
    accountV3_initial_data,
    accountV3_deploy_message,
    accountV3_address
}
