# underbase-cli

[![build status](https://img.shields.io/travis/sundowndev/underbase-cli/master.svg?style=flat-square)](https://travis-ci.org/sundowndev/underbase-cli)
[![release](https://img.shields.io/github/release/sundowndev/underbase-cli.svg?style=flat-square)](https://github.com/sundowndev/underbase-cli/releases)
[![dependencies](https://david-dm.org/sundowndev/underbase-cli/status.svg?style=flat-square)](https://david-dm.org/sundowndev/underbase-cli)

>MongoDB migrations done right. Abstract framework and CLI app for writing, executing, and organizing your database migrations.

Look at [underbase](https://github.com/sundowndev/underbase) for programmatic usage.

## Installation

This package can be installed through yarn or npm. Type:

``` bash
$ npm i underbase-cli

# or ...

$ yarn add underbase-cli
```

## Usage

CLI commands :

```
$ underbase-cli --help

Usage: underbase-cli <command> [OPTIONS]

Commands:
  underbase-cli migrate <migration>  Execute migrations
  underbase-cli create <version>     Create a new migration
  underbase-cli list                 Show all migrations versions
  underbase-cli status               Show migrations status

Options:
  --version                 Show underbase-cli package version         [boolean]
  --db <url>                MongoDB connection URL
  --migrations-dir <dir>    Migrations versions directory
  --backups                 Enable automatic backups
  --backups-dir <dir>       Backups directory
  --collection-name <name>  Migrations state collection
  --logs                    Enable logs
  --force                   Force migrations execution
  --chdir <dir>             Change the working directory
  -h, --help                Show this help message                     [boolean]
```

## Configuration

You can use json to configure Underbase by creating a `underbase.json` file at the root of your project :

```json
{
  "db": "mongodb://localhost:27017/underbase_test",
  "migrationsDir": "./examples",
  "collectionName": "migrations",
  "backupsDir": "./examples/backups",
  "backups": true,
  "logs": false
}
```

Arguments can also be passed to the CLI program :

```
$ underbase-cli --db mongodb://localhost:27017/api --migrations-dir ./migrations
```
