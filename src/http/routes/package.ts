import { Catalog } from "di-ts-decorators";
import { Context, Controller, Get } from "koa-ts-decorators";
import { ILogger, Logger } from "logger-flx";
import * as chalk from "chalk";
import { ICatalog, Catalog as PackageCatalog } from "../../lib/catalog";

@Controller("/v1/package", "api-server")
export class ApiPackage {

    constructor (
        private readonly _app_id: string,
        private readonly _name: string,
        private readonly _prefix: string,
        private readonly _logger: ILogger = <ILogger>Catalog(Logger),
        private readonly _catalog: ICatalog = <ICatalog>Catalog(PackageCatalog)
    )  {
        this._logger.info(`[${this._app_id}] Controller ${chalk.gray(this._name)} assigned to application with prefix ${chalk.gray(this._prefix)}`, "dev");
    }  

    @Get("/:id", "api-server")
    async info (ctx: Context): Promise<void> {

        const id = ctx.params.id;
        const list = this._catalog.nodes;

        if (list.includes(id) === false) {
            ctx.body = { 
                status: "fail",
                message: `Source "${id}" not found`
            };
        } else {
            ctx.body = { 
                status: "success",
                data: this._catalog.getNode(id).json
            };
        }

        ctx.status = 200;
        
    }

    @Get("/:id/:version/raw", "api-server")
    async get_version_raw (ctx: Context): Promise<void> {

        const id = ctx.params.id;
        const version = ctx.params.version;

        if (this._catalog.existNode(id) === false) {
            ctx.body = "Not found";
            ctx.status = 404;
            return;
        }

        const node = this._catalog.getNode(id);

        if (node.existPackage(version) === false) {
            ctx.body = "Not found";
            ctx.status = 404;
            return;
        }

        const package_config = await node.getPackage(version);

        ctx.body = package_config;
        ctx.status = 200;
        
    }

    @Get("/:id/:version", "api-server")
    async get_version (ctx: Context): Promise<void> {

        const id = ctx.params.id;
        const version = ctx.params.version;

        if (this._catalog.existNode(id) === false) {
            ctx.body = { 
                status: "fail",
                message: `Node "${id}" not found`
            };
            ctx.status = 200;
            return;
        }

        const node = this._catalog.getNode(id);

        if (node.existPackage(version) === false) {
            ctx.body = { 
                status: "fail",
                message: `Version "${version}" for node "${id}" not found`
            };
            ctx.status = 200;
            return;
        }

        const package_config = await node.getPackage(version);

        ctx.body = { 
            status: "success",
            data: package_config
        };
        ctx.status = 200;
        
    }

}