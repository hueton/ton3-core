import { 
    BOC,
    Slice,
    Cell,
    Builder
} from './boc'
import { TON3BytesToString } from 'swiftyjs'
import { hexToBytes, bytesToHex } from 'utils/helpers';

class Builder3 extends Builder {

    public storeBOCAsCellRef(boc: Uint8Array) {
        const hex = bytesToHex(boc)
        let cell = BOC.fromStandard(hex)
        this.storeRef(cell)
    }

    public boc(): string {
        const cell = this.cell()
        return BOC.toHexStandard(cell)
    }
}

const transfer = function(message: Uint8Array, workchain: number, address: Uint8Array, amount: number, bounceable: boolean, payload?: Uint8Array, state?: Uint8Array): string {
    const internalMessage = new MessageInternal({
        bounce: bounceable,
        srcAddress: null,
        destAddress: address,
        destWorkchain: workchain,
        value: amount
    }, internalMessagePayload(payload), internalMessageState(state))

    const externalMessage = new Builder()
        .fill(BOC.fromStandard(bytesToHex(message)))
        .storeRef(internalMessage.cell())
    
    return BOC.toHexStandard(externalMessage.cell())
}

const internalMessagePayload = function(payload?: Uint8Array): Cell | null {
    if (!payload) {
        return null;
    }

    let cell: Cell
    try {
        const hex = bytesToHex(payload)
        cell = BOC.fromStandard(hex)
    } catch {
        const string = TON3BytesToString(payload)

        const builder = new Builder()
        if (string) {
            cell = builder
            .storeUint(0, 32)
            .storeString(string)
            .cell()
        } else {
            cell = builder
            .storeBytes(payload)
            .cell()
        }
    }
    return cell
}

const internalMessageState = function(state?: Uint8Array): Cell | null {
    if (!state) {
        return null;
    }
    
    const hex = bytesToHex(state)
    return BOC.fromStandard(hex)
}

const initialConditionData = function(data: Uint8Array, code: Uint8Array): string {
    const builder = new Builder()
    builder.storeBit(0)
    builder.storeBit(0)
    builder.storeBit(1)
    builder.storeBit(1)
    builder.storeBit(0)

    const codeHEX = bytesToHex(code)
    builder.storeRef(BOC.fromStandard(codeHEX))

    const dataHEX = bytesToHex(data)
    builder.storeRef(BOC.fromStandard(dataHEX))

    return builder.cell().hash()
}

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
    Builder3,
    transfer,

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