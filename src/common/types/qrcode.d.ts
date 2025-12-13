declare module 'qrcode' {
    export interface ToBufferOptions {
        type?: 'png' | 'svg';
        width?: number;
        margin?: number;
    }

    export function toBuffer(data: string, options?: ToBufferOptions): Promise<Buffer>;

    export function toDataURL(data: string, options?: object): Promise<string>;

    const _default: {
        toBuffer: typeof toBuffer;
        toDataURL: typeof toDataURL;
    };

    export default _default;
}
