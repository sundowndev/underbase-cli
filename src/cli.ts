#!/usr/bin/env node
// tslint:disable:no-var-requires
// tslint:disable:no-console

import * as fs from 'fs';
import * as path from 'path';
import { migrator } from 'underbase';
import * as yargs from 'yargs';

// Enable ES6 module for ES2015
require = require('esm')(module);

interface IConfigFile {
  collectionName?: string;
  backups?: boolean;
  backupsDir?: string;
  migrationsDir?: string;
  db: string;
  logs: boolean;
  logger: any;
  logIfLatest?: boolean;
}

const logger = (level: string, ...arg: string[]) => console.log(`[${level}]`, ...arg);

const argv = yargs
  .scriptName('underbase-cli')
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
  .describe('rerun', 'Force migrations execution')
  .describe('chdir <dir>', 'Change the working directory')
  .describe('version', 'Show underbase-cli package version')
  .help('h', 'Show this help message')
  .alias('h', 'help')
  .locale('en_US')
  .parse();

let configFile = {} as IConfigFile;
const workingDirectory = argv.chdir as string || process.cwd();

if (argv.config) {
  configFile = require(path.join(workingDirectory as string, argv.config as string));
}

const config = {
  // False disables logging
  logs: argv.logs as boolean || configFile.logs as boolean || true,
  // Null or a function
  logger: logger as any,
  // Enable/disable info log "already at latest."
  logIfLatest: true,
  // Migrations collection name. Defaults to 'migrations'
  collectionName: argv.collectionName as string || configFile.collectionName as string || 'migrations',
  // MongDB url
  db: argv.db as string || configFile.db as string || null,
  // Enable automatic backups
  backups: argv.backups as boolean || configFile.backups as boolean || false,
  // Directory to save backups
  backupsDir: path.resolve(argv.backupsDir as string || configFile.backupsDir as string || './migrations/backups'),
  migrationsDir: path.resolve(argv.migrationsDir as string || configFile.migrationsDir as string || './migrations'),
} as IConfigFile;

(async () => {
  if (!argv._[0]) {
    yargs.help();
    process.exit();
  }

  if (!fs.existsSync(config.migrationsDir)) {
    fs.mkdirSync(config.migrationsDir);
    config.logger('info', 'Created migration directory.');
  }

  let versions = fs.readdirSync(config.migrationsDir)
    .filter((v: string) => v.match(new RegExp(/^[\d].[\d]$/))) as string[];

  switch (argv._[0]) {
    case 'migrate': {
      const versionsArray = versions.map((v: string) => parseFloat(v)) as number[];

      if (argv.migration !== 0 && versionsArray.indexOf(parseFloat(argv.migration as string)) < 0) {
        logger('error', 'This version does not exists.');
        process.exit();
      }

      versions = versionsArray.map((v: number) => v.toFixed(1)) as string[];

      await migrator.config(config); // Returns a promise

      versionsArray.forEach(async (v: number) => {
        const migrationObj = await require(`${config.migrationsDir}/${v}`).default;
        await migrator.add(migrationObj);
      });

      if (config.backups) {
        logger('info', 'create backup');
      }

      if (argv.rerun) {
        await migrator.migrateTo(`${argv.migration},rerun`);
      } else {
        await migrator.migrateTo(argv.migration as string);
      }

      break;
    }
    case 'list': {
      logger('info', 'Versions list based on folders');

      versions.forEach((v: string) => console.log(v));

      break;
    }
    case 'status': {
      await migrator.config(config); // Returns a promise

      const currentVersion = await migrator.getVersion();

      logger('info', `Current version is ${currentVersion}`);

      break;
    }
    default: {
      console.error('Invalid command. Type --help to show available commands.');

      break;
    }
  }

  process.exit();
})();
