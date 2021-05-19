import * as chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import Ajv from "ajv";
import jtomler from "jtomler";
import * as package_schema from "./lib/package_schema.json";
import { IWatcher, Watcher } from "../watcher";
import { ICatalog, ICatalogConfig, ICatalogNode, IPackage } from "./interfaces";
import { ILogger } from "logger-flx";
import { CatalogNode } from "./lib/catalog-node";

export * from "./interfaces";

export class Catalog implements ICatalog {

    private readonly _watcher: IWatcher

    private readonly _nodes_list: {
        [key: string]: ICatalogNode
    }

    constructor (
        private readonly _config: ICatalogConfig,
        private readonly _logger: ILogger
    ) {

        this._nodes_list = {};

        this._watcher = new Watcher({
            path: this._config.path,
            update_interval: this._config.update_interval
        }, this._logger);

        this._watcher.on("file", (file_path: string, relative_path: string) => {
            this._load(file_path, relative_path);
        });

    }

    private async _load (file_path: string, relative_path: string) {

        try {

            const ajv = new Ajv({
                strict: false
            });
    
            const body = await fs.promises.readFile(file_path);
            const package_config: IPackage = <IPackage>jtomler(body.toString(), false);
            const validate = ajv.compile(package_schema);
                    
            if (validate(package_config) === false) {
                this._logger.warn(`[Catalog] Package parsing error. Schema errors:\n${JSON.stringify(validate.errors, null, 2)}`);
                return;
            }

            const id = path.dirname(relative_path.replace(/\.(yml|yaml)$/i, "").replace(/\\/ig,"/"));
            
            if (id === "" || id === "." || typeof id !== "string") {
                this._logger.warn(`[Catalog] Package version ${chalk.yellow(package_config["x-package"].version)} doesn't have ID`);
                return;
            } 

            if (this._nodes_list[id] === undefined) {
                this._nodes_list[id] = new CatalogNode(id, this._logger);
            }

            this._nodes_list[id].addPackage(package_config["x-package"].version, file_path);

        } catch (error) {
            this._logger.warn(`[Catalog] Package parsing error. ${error}`);
            this._logger.log(error.stack, "debug");
            return;
        }

    }

    get nodes (): string[] {
        return Object.keys(this._nodes_list);
    }

    existNode (id_node: string): boolean {
        if (this._nodes_list[id_node] === undefined) {
            return false;
        }
        return true;
    }

    getNode (id_node: string): ICatalogNode {

        if (this._nodes_list[id_node] === undefined && this._config.subtree_package === true) {
            return this._getSubNode(id_node);
        }

        return this._nodes_list[id_node];
    }

    private _getSubNode (id_node: string): ICatalogNode {

        if (id_node === "") {
            return;
        }

        const arg_id = id_node.split("/");

        arg_id.splice(arg_id.length-1, 1);

        const sub_id = arg_id.join("/");

        if (this.existNode(sub_id) === true) {
            return this.getNode(sub_id);
        }

        return this._getSubNode(sub_id);

    }

    async run (): Promise<void> {
        await this._watcher.run();
    }

    async stop (): Promise<void> {
        await this._watcher.stop();
    }

}