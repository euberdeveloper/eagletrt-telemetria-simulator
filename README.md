# **301 - Permanently moved to the [eagletrt's organization](https://github.com/eagletrt)**

[![Lint](https://github.com/eagletrt/telemetria-simulator/actions/workflows/lint.yml/badge.svg)](https://github.com/eagletrt/telemetria-simulator/actions/workflows/lint.yml)
[![Build](https://github.com/eagletrt/telemetria-simulator/actions/workflows/build.yml/badge.svg)](https://github.com/eagletrt/telemetria-simulator/actions/workflows/build.yml)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![License](https://img.shields.io/npm/l/@eagletrt/telemetria-simulator.svg)](https://github.com/eagletrt/telemetria-simulator/blob/master/LICENSE)
[![Types](https://img.shields.io/npm/types/@eagletrt/telemetria-simulator.svg)](https://www.npmjs.com/package/@eagletrt/telemetria-simulator)

# eagletrt-telemetria-simulator
From a CAN and/or GPS log, simulates the contained messages into the local environment [@eagletrt](https://www.github.com/eagletrt).

## Project purpose

This project is an **npm** package made for the **telemetry** of eagletrt. The telemetry consists in a **c program** located in a **Raspberry Pi** and attached to the canbus of the car and to a rover-gps. Its job is reading all the sensors **messages**, forwarding them via mqtt and saving them in a local mongodb database. Some **can** and **gps** raw **logs** are also saved by the telemetry. The purpose of this project is having a tool that given those **raw logs**, reproduces them in the local environment, especially for testing purposes.

## How it was made

This project was made with **typescript** and consists in an npm module that can be used also **globally**, as a terminal command. It is linted with **eslint**, bundled with **webpack**, documented with **typedoc** and checked by some **github actions**.

## How does it work

The library gets as inputs a **can** and/or **gps** raw log. It is very highly conigurable, but roughly what it does is reading those files and reproducing the events it reads, by emitting events in the CANbus (virtual or real) and USB virtual serial ports.

## How to use it

This module can be actually used both as a **local** and as a **global** npm module.

### As a local module

Install the module executing:

```bash
$ npm install --save @eagletrt/telemetria-simulator
```

Virtualize a can interface

```javascript
const telemetriaSimulator = require('@eagletrt/telemetria-simulator');

async function main() {
    await telemetriaSimulator.virtualizeCan('vcan0', { silent: true });
}
main();
```

Simulate from a CAN log

```javascript
const telemetriaSimulator = require('@eagletrt/telemetria-simulator');

async function main() {
    const canSimulatorInstance = await simulateCan('./can.log', {
        iterations: 100,
        silent: true,
        canInterface: 'vcan0'
    });
    await canSimulatorInstance.waitUntilFinished();
}
main();
```

Simulate from a GPS log

```javascript
const telemetriaSimulator = require('@eagletrt/telemetria-simulator');

async function main() {
    const gpsSimulatorInstance = await simulateGps('./gps.ubx', {
        iterations: 100,
        silent: true,
        simulateTime: true,
        delay: 230
    });
    console.log(await gpsSimulatorInstance.getGpsInterface());
    await gpsSimulatorInstance.waitUntilFinished();
}
main();
```

To see all the options, refer to the **api**.

### As a global module

Install the module with:

```bash
$ npm install -g @eagletrt/telemetria-simulator
```

Executing:

```bash
$ eagletrt-simulator virtualize can
$ eagletrt-simulator simulate can
$ eagletrt-simulator simulate gps
$ eagletrt-simulator simulate all
```

Will have the same results as the examples with the local module.

The options are almost the same as in the **api** of the local module. To see all the cli options, run:

```bash
$ eagletrt-simulator --help
```

## API

### processLogsToCsv

**Syntax:**

`processLogsToCsv(canLogPath, gpsLogPath, outputPath, throwError)`

**Description:**

Generate csv files from a can and/or gps log. The result will be a folder with a csv file for each message.

**Parameters:**

* __canLogPath__: The path to the can log file that you want to parse. It can be `null`.
* __gpsLogPath__: The path to the gps log file that you want to parse. It can be `null`.* __configModel__: Optional. The path to the json file containing the config model, used by generators to dynamically generate code about the config parser. The default is `config.model.json`.
* __outputLogPath__: The path to the output file that will be generated. The default value is `result`. Note that you do not have to specify the file extension because it depends by the function.
* __throwError__: If a strict error handling will be used, for instance if a line is corrupted the function will throw an error. The default value is `false`.

### processLogsToJson

**Syntax:**

`processLogsToJson(canLogPath, gpsLogPath, outputPath, throwError)`

**Description:**

Generate a json file from a can and/or gps log.

**Parameters:**

* __canLogPath__: The path to the can log file that you want to parse. It can be `null`.
* __gpsLogPath__: The path to the gps log file that you want to parse. It can be `null`.* __configModel__: Optional. The path to the json file containing the config model, used by generators to dynamically generate code about the config parser. The default is `config.model.json`.
* __outputLogPath__: The path to the output file that will be generated. The default value is `result`. Note that you do not have to specify the file extension because it depends by the function.
* __throwError__: If a strict error handling will be used, for instance if a line is corrupted the function will throw an error. The default value is `false`.

### processLogsForTest

**Syntax:**

`processLogsForTest(canLogPath, gpsLogPath, outputPath, throwError)`

**Description:**

Generate a json testing file from a can and/or gps log. It is used for the "general tests suites of the telemetry", when it simulates some can and/or gps logs and needs a `.expected.json` file with the expected results.

**Parameters:**

* __canLogPath__: The path to the can log file that you want to parse. It can be `null`.
* __gpsLogPath__: The path to the gps log file that you want to parse. It can be `null`.* __configModel__: Optional. The path to the json file containing the config model, used by generators to dynamically generate code about the config parser. The default is `config.model.json`.
* __outputLogPath__: The path to the output file that will be generated. The default value is `result`. Note that you do not have to specify the file extension because it depends by the function.
* __throwError__: If a strict error handling will be used, for instance if a line is corrupted the function will throw an error. The default value is `false`.

## Where was it used

This module was used in the telemetry sender [repo](https://github.com/eagletrt/telemetria-sender) of eagletrt. It is also included in the eagle-cli.

## Notes

Note that this module uses **yargs** for the cli and the yargs commands and options are **modular**: this means that they can be imported and used by other modules that consists in a cli and wrap this library, such as the **eagle-cli**.

The GPS simulator is written in C and compiled during installation. If this does not happen, there is a script in the `package.json` exactly to do it. The C program is valid only on Linux.

## Build

To build for production, using webpack:

```bash
npm run bundle
```
