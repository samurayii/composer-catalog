import { EventEmitter } from "events";
import { IFilePoint, IWatcher, IWatcherConfig } from "./interfaces";
import * as chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { ILogger } from "logger-flx";
import { FilePoint } from "./lib/file-point";

export * from "./interfaces";

const getYmlFilesList = async (folder: string, files_list: string[] = []) => {

    const files = await fs.promises.readdir(folder);

    for (const file_path of files) {

        const full_file_path = path.resolve(folder, file_path);
        const stat = await fs.promises.stat(full_file_path);

        if (stat.isFile()) {
            if (/\.(yml|yaml)$/.test(file_path)) {
                files_list.push(full_file_path);
            }
        } else {
            await getYmlFilesList(full_file_path, files_list);
        }

    }

    return files_list;

};

export class Watcher extends EventEmitter implements IWatcher {

    private _interval_id: ReturnType<typeof setTimeout>
    private readonly _full_folder_path: string
    private readonly _files_list: {
        [key: string]: IFilePoint
    }

    constructor (
        private readonly _config: IWatcherConfig,
        private readonly _logger: ILogger
    ) {
        super();

        this._files_list = {};
        this._full_folder_path = path.resolve(process.cwd(), this._config.path);

        if (fs.existsSync(this._full_folder_path) === false) {
            fs.mkdirSync(this._full_folder_path, {
                recursive: true
            });
            this._logger.log(`[Watcher] Catalog folder ${chalk.gray(this._full_folder_path)} created`);
        }

    }

    private async _gathering (): Promise<void> {

        const files = await getYmlFilesList(this._full_folder_path);
            
        for (const file_path of files) {

            const relative_path = file_path.replace(this._full_folder_path, "").replace(/(^\/|\/$|^\\|\\$)/i, "");

            if (this._files_list[file_path] === undefined) {

                const body = await fs.promises.readFile(file_path);
                const stat = await fs.promises.stat(file_path);
                const hash = crypto.createHash("md5").update(body).digest("hex");

                this._files_list[file_path] = new FilePoint(hash, file_path, {
                    atime_ms: stat.atimeMs,
                    mtime_ms: stat.mtimeMs,
                    ctime_ms: stat.ctimeMs
                });

                this._logger.log(`[Watcher] File ${chalk.gray(file_path)} detected`, "dev");

                this.emit("file", file_path, relative_path);

            } else {

                const stat = await fs.promises.stat(file_path);
                const file_point = this._files_list[file_path];

                if (file_point.isDeprecated({
                    atime_ms: stat.atimeMs,
                    mtime_ms: stat.mtimeMs,
                    ctime_ms: stat.ctimeMs
                }) === false) {
                    continue;
                }

                const body = await fs.promises.readFile(file_path);
                const hash = crypto.createHash("md5").update(body).digest("hex");

                if (hash === file_point.hash) {
                    continue;
                }

                this._files_list[file_path] = new FilePoint(hash, file_path, {
                    atime_ms: stat.atimeMs,
                    mtime_ms: stat.mtimeMs,
                    ctime_ms: stat.ctimeMs
                });

                this._logger.log(`[Watcher] File ${chalk.gray(file_path)} changed`, "dev");

                this.emit("file", file_path, relative_path);

            }

        }

    }

    private _update (): void {
        this._interval_id = setTimeout( async () => {

            await this._gathering();
           
            this._update();

        }, this._config.update_interval*1000);
    }

    async run (): Promise<void> {
        await this._gathering();
        this._update();
    }

    async stop (): Promise<void> {
        clearTimeout(this._interval_id);
    }

}