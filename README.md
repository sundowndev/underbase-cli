# underbase-cli

![build status](https://img.shields.io/travis/sundowndev/underbase-cli/master.svg?style=flat-square)
![tag](https://img.shields.io/github/tag/sundowndev/underbase-cli.svg?style=flat-square)

CLI app for writing, executing, and organizing your database migrations.

## Installation

Migrations can be installed through yarn or npm. Type:

``` sh
$ npm install underbase-cli
```
or
``` sh
$ yarn add underbase-cli
```

## Configuration

You can use json to configure Underbase by creating a `underbase.json` file at the root of your project :

```json
{
  "db": "mongodb://localhost:27017/api",
  "migrationsDir": "./migrations",
  "collectionName": "migrations",
  "backupsDir": "./migrations/backups",
  "backups": true
}
```

Arguments can also be passed to the CLI program :

```
$ underbase-cli --db mongodb://localhost:27017/api --migrations-dir ./migrations
```

## Usage

CLI commands :

```
$ underbase-cli --help

Usage: cli.js <command> [OPTIONS]

Commandes:
  cli.js migrate <migration>  Execute migrations
  cli.js list                 Show all migrations versions
  cli.js status               Show migrations status

Options:
  --version          Affiche le numéro de version                      [boolean]
  --db               MongoDB connection URL
  --migrations-dir   Migrations versions directory
  --backups          Enable automatic backups
  --backups-dir      Backups directory
  --collection-name  Migrations state collection
  --logs             Enable logs
  -h, --help         Affiche de l'aide                                 [boolean]
```
