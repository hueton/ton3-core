import { 
    BOC,
    Slice,
    Builder
} from './boc'

//
// Wallet3
//

const createWallet3InitialData = function(subwalletID: number, publicKey: Uint8Array): string {
    const cell = new Builder()
        .storeUint(0, 32)
        .storeUint(subwalletID, 32)
        .storeBytes(publicKey)
        .cell();
    return BOC.toHexStandard(cell);
};

const createWallet3DeployMessageBody = function(subwalletID: number): string {
    const body = new Builder()
        .storeUint(subwalletID, 32)
        .storeInt(-1, 32) // valid until
        .storeUint(0, 32) // seqno
        .cell()

    return BOC.toHexStandard(body);
};

// 
// BOC
//

const createBOCHash = function(boc: string): string {
    const cell = BOC.fromStandard(boc)
    return cell.hash()
} 

const createBOCWithSignature = function(boc: string, signature: Uint8Array): string {
    const cell = BOC.fromStandard(boc)
    const signed = new Builder()
        .storeBytes(signature)
        .storeSlice(Slice.parse(cell))
        .cell()
    return BOC.toHexStandard(signed);
}

export { 
    createWallet3InitialData,
    createWallet3DeployMessageBody,

    createBOCHash,
    createBOCWithSignature
}
