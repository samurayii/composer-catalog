import * as chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import Ajv from "ajv";
import jtomler from "jtomler";
import * as package_schema from "./lib/package_schema.json";
import * as healthcheck_http_schema from "./lib/healthcheck-http.json";
import { IWatcher } from "../watcher";
import { ICatalog, ICatalogNode, IPackage } from "./interfaces";
import { ILogger } from "logger-flx";
import { CatalogNode } from "./lib/catalog-node";

export * from "./interfaces";

export class Catalog implements ICatalog {

    private readonly _nodes_list: {
        [key: string]: ICatalogNode
    }

    constructor (
        private readonly _watcher: IWatcher,
        private readonly _logger: ILogger
    ) {

        this._nodes_list = {};

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

            for (const service_name in package_config.services) {

                const service = package_config.services[service_name];

                if (service["x-healthcheck"] !== undefined) {

                    const healthcheck = service["x-healthcheck"];

                    if (healthcheck.type === undefined) {
                        this._logger.warn(`[Catalog] Package parsing error. Healthcheck does not contain ${chalk.red("type")} key`);
                        return;
                    }

                    const ajv_healthcheck = new Ajv({
                        strict: false
                    });

                    let validate_healthcheck;

                    if (healthcheck.type === "http") {
                        validate_healthcheck = ajv_healthcheck.compile(healthcheck_http_schema);
                    }

                    if (validate_healthcheck === undefined) {
                        this._logger.warn(`[Catalog] Package parsing error. Healthcheck type ${chalk.red(healthcheck.type)} not support`);
                        return;
                    }

                    if (validate_healthcheck(healthcheck) === false) {
                        this._logger.warn(`[Catalog] Package parsing error. Schema errors:\n${JSON.stringify(validate_healthcheck.errors, null, 2)}`);
                        return;
                    }

                }

            }

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
        return this._nodes_list[id_node];
    }

}