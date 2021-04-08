import * as chalk from "chalk";
import { ILogger } from "logger-flx";
import * as fs from "fs";
import { ICatalogNode, ICatalogNodeJson } from "../interfaces";

const packageWeight = (version: string): number => {

    if (/[0-9]+\.[0-9]+\.[0-9]+(-.+|)/i.test(version) === false) {
        return 0;
    }

    const args = version.match(/([0-9]+)\.([0-9]+)\.([0-9]+)(-.+|)/i);

    if (args === null) {
        return 0;
    }

    const weight_1 = parseInt(args[1]) * 1000000000;
    const weight_2 = parseInt(args[2]) * 1000000;
    const weight_3 = parseInt(args[3]);

    return weight_1 + weight_2 + weight_3;
};

export class CatalogNode implements ICatalogNode {

    private readonly _versions_list: {
        [key: string]: {
            version: string
            path: string
        }
    }

    constructor (
        private readonly _id: string,
        private readonly _logger: ILogger
    ) {

        this._versions_list = {};

        this._logger.log(`[Catalog] Node ${chalk.gray(this._id)} created`, "dev");
    }

    get id (): string {
        return this._id;
    }

    get json (): ICatalogNodeJson {
        return {
            id: this._id,
            list: Object.keys(this._versions_list)
        };
    }

    get versions (): string[] {
        return Object.keys(this._versions_list);
    }

    addPackage (new_version: string, package_path: string): void {

        this._versions_list[new_version] = {
            version: new_version,
            path: package_path
        };

        this._logger.log(`[Catalog] Package version ${chalk.gray(new_version)} updated/added to ${chalk.gray(this._id)} node`, "dev");

        if (this._versions_list["latest"] === undefined) {
            this._versions_list["latest"] = {
                version: new_version,
                path: package_path
            };
            return;
        }

        const latest_version = this._versions_list["latest"].version;

        if (packageWeight(new_version) <= packageWeight(latest_version)) {
            return;
        }

        this._versions_list["latest"] = {
            version: new_version,
            path: package_path
        };

        this._logger.log(`[Catalog] Defined ${chalk.gray("latest")} version from ${chalk.gray(new_version)} package of ${chalk.gray(this._id)} node`, "dev");

    }

    existPackage (version: string): boolean {
        if (this._versions_list[version] === undefined) {
            return false;
        }
        return true;
    }

    async getPackage (version: string): Promise<string> {
        if (this._versions_list[version] === undefined) {
            return;
        }
        const body = await fs.promises.readFile(this._versions_list[version].path);
        return body.toString();
    }

}