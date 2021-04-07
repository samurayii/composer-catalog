import config from "./lib/entry";
import { Logger } from "logger-flx";
import { Singleton } from "di-ts-decorators";
import { KoaD } from "koa-ts-decorators";
import { Authorization } from "./lib/authorization";
import * as chalk from "chalk";
import { Watcher } from "./lib/watcher";
import { Catalog } from "./lib/catalog";

//console.log(JSON.stringify(config, null, 4));

import "./http";

const logger = new Logger(config.logger);
const authorization = new Authorization(config.authorization);
const watcher = new Watcher(config.catalog, logger);
const catalog = new Catalog(watcher, logger);

Singleton("config", config);
Singleton(Logger.name, logger);
Singleton(Catalog.name, catalog);

const api_server = new KoaD(config.api, "api-server");

const bootstrap = async () => {

    try {

        api_server.context.authorization = authorization;

        watcher.run();

        await api_server.listen( () => {
            logger.info(`[api-server] listening on network interface ${chalk.gray(`${api_server.config.listening}${api_server.prefix}`)}`);
        });

    } catch (error) {
        logger.error(error.message);
        logger.log(error.stack);
        process.exit(1);
    }

};

bootstrap();

process.on("SIGTERM", async () => {
    logger.log("Termination signal received");
    await watcher.stop();
    process.exit();
});