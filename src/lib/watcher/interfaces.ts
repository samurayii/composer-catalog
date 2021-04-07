import { EventEmitter } from "events";

export interface IWatcher extends EventEmitter {
    run: () => Promise<void>
    stop: () => Promise<void>
}

export interface IFilePointStat {
    atime_ms: number
    mtime_ms: number
    ctime_ms: number
}

export interface IFilePoint {
    readonly hash: string
    readonly path: string
    isDeprecated: (stat: IFilePointStat) => boolean
}

export interface IWatcherConfig {
    path: string
    update_interval: number
}