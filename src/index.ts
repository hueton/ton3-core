import { 
    BOC,
    Slice,
    Cell,
    Builder
} from './boc'

//
// Wallet2
//

const createWallet2InitialData = function(publicKey: Uint8Array): string {
    const cell = new Builder()
        .storeUint(0, 32)
        .storeBytes(publicKey)
        .cell();
    return BOC.toHexStandard(cell);
};

const createWallet2TransferMessageBody = function(seqno: number, timeout: number, bounceable: boolean, address: Uint8Array, workchain: number, amount: number, message: string | null): string {
    const body = new Builder()
        .storeUint(timeout, 32) // valid until
        .storeUint(seqno, 32)

    const internalMessageBody = new Builder()
        .storeUint(0, 32)
    
    if (message !== null) {
        internalMessageBody.storeString(message)
    }

    const internalMessage = new MessageInternal({
        bounce: bounceable,
        srcAddress: null,
        destAddress: address,
        destWorkchain: workchain,
        value: amount
    }, internalMessageBody.cell())

    // 3: default message send mode
    body.storeUint(3, 8)
        .storeRef(internalMessage.cell())

    return BOC.toHexStandard(body.cell());
};

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

const createWallet3TransferMessageBody = function(subwalletID: number, seqno: number, timeout: number, bounceable: boolean, address: Uint8Array, workchain: number, amount: number, message: string | null): string {
    const body = new Builder()
        .storeUint(subwalletID, 32)
        .storeUint(timeout, 32) // valid until
        .storeUint(seqno, 32)

    const internalMessageBody = new Builder()
        .storeUint(0, 32)
    
    if (message !== null) {
        internalMessageBody.storeString(message)
    }

    const internalMessage = new MessageInternal({
        bounce: bounceable,
        srcAddress: null,
        destAddress: address,
        destWorkchain: workchain,
        value: amount
    }, internalMessageBody.cell())

    // 3: default message send mode
    body.storeUint(3, 8)
        .storeRef(internalMessage.cell())

    return BOC.toHexStandard(body.cell());
};

//
// Wallet4
//

const createWallet4InitialData = function(subwalletID: number, publicKey: Uint8Array): string {
    const cell = new Builder()
        .storeUint(0, 32)
        .storeUint(subwalletID, 32)
        .storeBytes(publicKey)
        .storeBit(0)
        .cell();
    return BOC.toHexStandard(cell);
};

const createWallet4TransferMessageBody = function(subwalletID: number, seqno: number, timeout: number, bounceable: boolean, address: Uint8Array, workchain: number, amount: number, message: string | null): string {
    const body = new Builder()
        .storeUint(subwalletID, 32)
        .storeUint(timeout, 32) // valid until
        .storeUint(seqno, 32)
        .storeUint(0, 8) // op

    const internalMessageBody = new Builder()
        .storeUint(0, 32)
    
    if (message !== null) {
        internalMessageBody.storeString(message)
    }

    const internalMessage = new MessageInternal({
        bounce: bounceable,
        srcAddress: null,
        destAddress: address,
        destWorkchain: workchain,
        value: amount
    }, internalMessageBody.cell())

    // 3: default message send mode
    body.storeUint(3, 8)
        .storeRef(internalMessage.cell())

    return BOC.toHexStandard(body.cell());
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

const getBOCRootCellData = function(boc: string): string {
    const cell = BOC.fromStandard(boc)
    return cell.data()
}

export { 
    createWallet2InitialData,
    createWallet2TransferMessageBody,

    createWallet3InitialData,
    createWallet3TransferMessageBody,

    createWallet4InitialData,
    createWallet4TransferMessageBody,

    createBOCHash,
    createBOCWithSignature,
    getBOCRootCellData
}

//
// ton3-core
//

class Message {

    private header: Cell
    private body: Cell
    private state: Cell

    constructor (header: Cell, body: Cell = null, state: Cell = null) {
        this.header = header
        this.body = body
        this.state = state
    }

    public cell (): Cell {
        const message = new Builder()
            .storeSlice(Slice.parse(this.header))

        if (this.state !== null) {
            message.storeBit(1)
            if (message.remainder >= this.state.bits.length + 1 && message.refs.length + this.state.refs.length <= 4) {
                message.storeBit(0).storeSlice(Slice.parse(this.state))
            } else {
                message.storeBit(1).storeRef(this.state)
            }
        } else {
            message.storeBit(0)
        }

        if (this.body !== null) {
            if (message.remainder >= this.body.bits.length && message.refs.length + this.body.refs.length <= 4) {
                message.storeBit(0).storeSlice(Slice.parse(this.body))
            } else {
                message.storeBit(1).storeRef(this.body)
            }
        } else {
            message.storeBit(0)
        }

        return message.cell()
    }
}

interface MessageInternalOptions {
    ihrDisabled?: boolean // optional, because it is not currently implemented in TON
    bounce: boolean // bounce flag
    bounced?: boolean

    srcAddress: Uint8Array | null
    srcWorkchain?: number

    destAddress: Uint8Array | null
    destWorkchain?: number

    value: number
    ihrFee?: number
    fwdFee?: number
    createdLt?: number
    createdAt?: number
}

// int_msg_info$0
class MessageInternal extends Message {

    constructor (options: MessageInternalOptions, body?: Cell, state?: Cell) {
        const builder = new Builder()
        const {
            ihrDisabled = true,
            bounce,
            bounced = false,
            srcAddress,
            srcWorkchain = 0,
            destAddress,
            destWorkchain = 0,
            value,
            ihrFee = 0,
            fwdFee = 0,
            createdLt = 0,
            createdAt = 0
        } = options

        const header = builder
            .storeBit(0) // int_msg_info$0
            .storeInt(ihrDisabled ? -1 : 0, 1) // ihr_disabled; true: -1
            .storeInt(bounce ? -1 : 0, 1)
            .storeInt(bounced ? -1 : 0, 1)
            .storeAddress(srcAddress, srcWorkchain)
            .storeAddress(destAddress, destWorkchain)
            .storeCoins(value)
            .storeBit(0) // empty ExtraCurrencyCollection dict is 0 bit
            .storeCoins(ihrFee)
            .storeCoins(fwdFee)
            .storeUint(createdLt, 64)
            .storeUint(createdAt, 32)
            .cell()

        super(header, body, state)
    }
}