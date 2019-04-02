#!/usr/bin/env node
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
const child_process_1 = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const underbase_1 = require("underbase");
const yargs = require("yargs");
require = require('esm')(module);
const logger = (level, ...arg) => console.log(`[${level}]`, ...arg);
const createBackup = (version) => new Promise((resolve, reject) => {
    logger('info', 'Creating backup...');
    const host = 'localhost:27017';
    const database = 'underbase_test';
    const backupFile = [
        version.toFixed(1),
        `${Date.now()}.gz`,
    ].join('_');
    const cmd = [
        config.mongodumpBinary,
        `--host ${host}`,
        `--archive=${config.backupsDir}/${backupFile}`,
        `--gzip --db ${database}`,
    ].join(' ');
    child_process_1.exec(cmd, (error, stdout, stderr) => {
        if (error) {
            logger('error', 'An error occured while creating backup... Cancelling.');
            console.error(error);
            process.exit();
        }
        logger('success', 'Backup created : ' + backupFile);
        return resolve();
    });
});
const argv = yargs
    .scriptName('underbase-cli')
    .usage('Usage: $0 <command> [OPTIONS]')
    .command('migrate <migration>', 'Execute migrations')
    .command('list', 'Show all migrations versions')
    .command('status', 'Show migrations status')
    .describe('db <url>', 'MongoDB connection URL')
    .describe('migrations-dir <dir>', 'Migrations versions directory')
    .describe('backup', 'Enable automatic backups')
    .describe('backups-dir <dir>', 'Backups directory')
    .describe('collection-name <name>', 'Migrations state collection')
    .describe('logs', 'Enable logs')
    .describe('rerun', 'Force migrations execution')
    .describe('chdir <dir>', 'Change the working directory')
    .describe('version', 'Show underbase-cli package version')
    .describe('mongodumpBinary <bin>', 'Binary file for mongodump (it can be a docker exec command)')
    .help('h', 'Show this help message')
    .alias('h', 'help')
    .locale('en_US')
    .parse();
let configFile = {};
let workingDirectory = argv.chdir || process.cwd();
if (argv.config) {
    configFile = require(path.resolve(path.join(workingDirectory, argv.config)));
}
if (configFile.chdir) {
    workingDirectory = configFile.chdir;
}
const config = {
    logs: argv.logs || configFile.logs || true,
    logger: logger,
    logIfLatest: true,
    collectionName: argv.collectionName || configFile.collectionName || 'migrations',
    db: argv.db || configFile.db || null,
    backup: argv.backup || configFile.backup || false,
    backupsDir: path.resolve(path.join(workingDirectory, argv.backupsDir || configFile.backupsDir || './migrations/backups')),
    migrationsDir: path.resolve(path.join(workingDirectory, argv.migrationsDir || configFile.migrationsDir || './migrations')),
    mongodumpBinary: argv.mongodumpBinary || configFile.mongodumpBinary || 'mongodump',
};
(() => __awaiter(this, void 0, void 0, function* () {
    if (!argv._[0]) {
        logger('error', 'Invalid command. Type --help to show available commands.');
        process.exit();
    }
    if (!fs.existsSync(config.migrationsDir)) {
        fs.mkdirpSync(config.migrationsDir);
        config.logger('info', 'Created migration directory.');
    }
    if (!fs.existsSync(config.backupsDir)) {
        fs.mkdirpSync(config.backupsDir);
        config.logger('info', 'Created backup directory.');
    }
    let versions = fs.readdirSync(config.migrationsDir)
        .filter((v) => v.match(new RegExp(/^[\d].[\d]$/)));
    switch (argv._[0]) {
        case 'migrate': {
            const versionsArray = versions.map((v) => parseFloat(v));
            if (argv.migration !== 0 && versionsArray.indexOf(parseFloat(argv.migration)) < 0) {
                logger('error', 'This version does not exists.');
                process.exit();
            }
            versions = versionsArray.map((v) => v.toFixed(1));
            yield underbase_1.migrator.config(config);
            versions.forEach((v) => __awaiter(this, void 0, void 0, function* () {
                const migrationObj = yield require(`${config.migrationsDir}/${v}`).default;
                yield underbase_1.migrator.add(migrationObj);
            }));
            if (config.backup) {
                const currentVersion = yield underbase_1.migrator.getVersion();
                yield createBackup(currentVersion);
            }
            if (argv.rerun) {
                yield underbase_1.migrator.migrateTo(`${argv.migration},rerun`);
            }
            else {
                yield underbase_1.migrator.migrateTo(argv.migration);
            }
            break;
        }
        case 'list': {
            logger('info', 'Versions list based on folders');
            versions.forEach((v) => console.log(v));
            break;
        }
        case 'status': {
            yield underbase_1.migrator.config(config);
            const currentVersion = yield underbase_1.migrator.getVersion();
            logger('info', `Current version is ${currentVersion}`);
            break;
        }
        default: {
            logger('error', 'Invalid command. Type --help to show available commands.');
            break;
        }
    }
    process.exit();
}))();
