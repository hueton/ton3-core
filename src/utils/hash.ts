import { TON3SHA256, TON3SHA512 } from 'swiftyjs'

const sha256 = (bytes: Uint8Array): string => {
    return TON3SHA256(bytes)
}

const sha512 = (bytes: Uint8Array): string => {
    return TON3SHA512(bytes)
}

export {
    sha256,
    sha512
}