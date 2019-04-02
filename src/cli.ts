#!/usr/bin/env node

import { migrator } from 'underbase';
import * as yargs from 'yargs';
import * as path from 'path';
import * as fs from 'fs';

// Enable ES6 module for ES2015
require = require("esm")(module)

interface configFile {
  collectionName?: string,
  backups?: boolean,
  backupsDir?: string,
  migrationsDir?: string,
  db: string,
  logs: boolean,
  logger: any,
  logIfLatest?: boolean,
};

const logger = (level: string, ...arg: Array<string>) => console.log(`[${level}]`, ...arg);

const argv = yargs
  .scriptName("underbase-cli")
  .usage('Usage: $0 <command> [OPTIONS]')
  .command('migrate <migration>', 'Execute migrations')
  // .command('create <version>', 'Create a new migration')
  .command('list', 'Show all migrations versions')
  .command('status', 'Show migrations status')
  // .command('restore', 'Restore a database backup')
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

let configFile = <configFile>{};
const workingDirectory = <string>argv.chdir || process.cwd();

if (argv.config) {
  configFile = require(path.join(<string>workingDirectory, <string>argv.config));
}

const config = <configFile>{
  // false disables logging
  logs: argv.logs || configFile.logs || true,
  // null or a function
  logger: logger,
  // enable/disable info log "already at latest."
  logIfLatest: true,
  // migrations collection name. Defaults to 'migrations'
  collectionName: argv.collectionName || configFile.collectionName || 'migrations',
  // mongdb url
  db: argv.db || configFile.db || null,
  // enable automatic backups
  backups: argv.backups || configFile.backups || false,
  // directory to save backups
  backupsDir: path.resolve(<string>argv.backupsDir || configFile.backupsDir || './migrations/backups'),
  migrationsDir: path.resolve(<string>argv.migrationsDir || configFile.migrationsDir || './migrations'),
};

(async () => {
  if (!argv._[0]) {
    yargs.help();
    process.exit();
  }

  if (!fs.existsSync(config.migrationsDir)) {
    fs.mkdirSync(config.migrationsDir);
    config.logger('info', 'Created migration directory.');
  }

  let versions = <any>fs.readdirSync(config.migrationsDir)
    .filter((v) => v.match(new RegExp(/^[\d].[\d]$/)));

  switch (argv._[0]) {
    case 'migrate':
      versions = versions.map((v: string) => parseFloat(v));

      if (argv.migration != 0 && versions.indexOf(parseFloat(<string>argv.migration)) < 0) {
        logger('error', 'This version does not exists.');
        process.exit();
      }

      versions = versions.map((v: number) => v.toFixed(1));

      await migrator.config(config); // Returns a promise

      versions.forEach(async (v: string) => {
        const migrationObj = await require(`${config.migrationsDir}/${v}`).default;
        await migrator.add(migrationObj);
      });

      if (config.backups) {
        logger('info', 'create backup')
      }

      if (argv.force) await migrator.migrateTo(`${argv.migration},rerun`);
      else await migrator.migrateTo(<string>argv.migration);

      break;
    case 'list':
      logger('info', 'Versions list based on folders')
      versions.forEach((v: string) => console.log(v));
      break;
    case 'status':
      await migrator.config(config); // Returns a promise

      const currentVersion = await migrator.getVersion();

      logger('info', `Current version is ${currentVersion}`);
      break;
    default:
      console.error('You should be doing', yargs.help())
      break;
  }

  process.exit();
})();
