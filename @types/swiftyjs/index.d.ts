export as namespace ton3swift;

export function TON3StringToBytes(value: string): Uint8Array
export function TON3BytesToString(value: Uint8Array): string

export function TON3SHA256(value: Uint8Array): string
export function TON3SHA512(value: Uint8Array): string