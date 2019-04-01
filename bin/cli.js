"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const underbase_1 = require("underbase");
const yargs = require("yargs");
const path = require("path");
const fs = require("fs");
require = require("esm")(module);
;
const logger = (level, ...arg) => console.log(`[${level}]`, ...arg);
const argv = yargs
    .scriptName("underbase-cli")
    .usage('Usage: $0 <command> [OPTIONS]')
    .command('migrate <migration>', 'Execute migrations')
    .command('list', 'Show all migrations versions')
    .command('status', 'Show migrations status')
    .describe('db <url>', 'MongoDB connection URL')
    .describe('migrations-dir <dir>', 'Migrations versions directory')
    .describe('backups', 'Enable automatic backups')
    .describe('backups-dir <dir>', 'Backups directory')
    .describe('collection-name <name>', 'Migrations state collection')
    .describe('logs', 'Enable logs')
    .describe('force', 'Force migrations execution')
    .describe('chdir <dir>', 'Change the working directory')
    .describe('version', 'Show underbase-cli package version')
    .help('h', 'Show this help message')
    .alias('h', 'help')
    .locale('en_US')
    .parse();
let configFile = {};
const workingDirectory = argv.chdir || process.cwd();
if (argv.config) {
    configFile = require(path.join(workingDirectory, argv.config));
}
const config = {
    log: argv.logs || configFile.logs || true,
    logger: logger,
    logIfLatest: true,
    collectionName: argv.collectionName || configFile.collectionName || 'migrations',
    db: argv.db || configFile.db || null,
    backups: argv.backups || configFile.backups || false,
    backupsDir: path.resolve(argv.backupsDir || configFile.backupsDir || './migrations/backups'),
    migrationsDir: path.resolve(argv.migrationsDir || configFile.migrationsDir || './migrations'),
};
(() => __awaiter(this, void 0, void 0, function* () {
    if (!argv._[0]) {
        yargs.help();
        process.exit();
    }
    if (!fs.existsSync(config.migrationsDir)) {
        fs.mkdirSync(config.migrationsDir);
        config.logger('info', 'Created migration directory.');
    }
    let versions = fs.readdirSync(config.migrationsDir)
        .filter((v) => v.match(new RegExp(/^[\d].[\d]$/)));
    switch (argv._[0]) {
        case 'migrate':
            versions = versions.map((v) => parseFloat(v));
            if (argv.migration != 0 && versions.indexOf(parseFloat(argv.migration)) < 0) {
                logger('error', 'This version does not exists.');
                process.exit();
            }
            versions = versions.map((v) => v.toFixed(1));
            yield underbase_1.migrator.config(config);
            versions.forEach((v) => __awaiter(this, void 0, void 0, function* () {
                const migrationObj = yield require(`${config.migrationsDir}/${v}`).default;
                yield underbase_1.migrator.add(migrationObj);
            }));
            if (config.backups) {
                logger('info', 'create backup');
            }
            if (argv.force)
                yield underbase_1.migrator.migrateTo(`${argv.migration},rerun`);
            else
                yield underbase_1.migrator.migrateTo(argv.migration);
            break;
        case 'list':
            logger('info', 'Versions list based on folders');
            versions.forEach((v) => console.log(v));
            break;
        case 'status':
            yield underbase_1.migrator.config(config);
            const currentVersion = yield underbase_1.migrator.getVersion();
            logger('info', `Current version is ${currentVersion}`);
            break;
        default:
            console.error('You should be doing', yargs.help());
            break;
    }
    process.exit();
}))();
