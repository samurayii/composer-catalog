import { IFilePoint, IFilePointStat } from "../interfaces";

export class FilePoint implements IFilePoint {

    constructor (
        private _hash: string,
        private readonly _path: string,
        private _stat: IFilePointStat
    ) {}

    get hash (): string {
        return this._hash;
    }

    get path (): string {
        return this._path;
    }

    isDeprecated (stat: IFilePointStat): boolean {
        if (this._stat.atime_ms !== stat.atime_ms || this._stat.ctime_ms !== stat.ctime_ms || this._stat.mtime_ms !== stat.mtime_ms) {
            return true;
        }
        return false;
    }

}