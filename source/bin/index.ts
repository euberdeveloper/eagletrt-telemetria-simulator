#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-misused-promises */

if (!process.env.IS_WEBPACK) {
    // eslint-disable-next-line
    require('module-alias/register')
}

import * as yargs from 'yargs';

import { virtualizeCommand, simulateCommand, settingsCommand } from '@/bin/commands';

yargs
    .scriptName('eagletrt-simulator')
    .command(virtualizeCommand.command, virtualizeCommand.description, yargs => {
        yargs
            .command(
                virtualizeCommand.canCommand.command,
                virtualizeCommand.canCommand.command,
                yargs => {
                    yargs.options(virtualizeCommand.canCommand.options);
                },
                async argv => {
                    await virtualizeCommand.canCommand.handler(argv);
                }
            )
            .demandCommand(1, 'You must specify a command');
    })
    .command(simulateCommand.command, simulateCommand.description, yargs => {
        yargs
            .command(
                simulateCommand.canCommand.command,
                simulateCommand.canCommand.command,
                yargs => {
                    yargs.options(simulateCommand.canCommand.options);
                },
                async argv => {
                    await simulateCommand.canCommand.handler(argv);
                }
            )
            .command(
                simulateCommand.gpsCommand.command,
                simulateCommand.gpsCommand.command,
                yargs => {
                    yargs.options(simulateCommand.gpsCommand.options);
                },
                async argv => {
                    await simulateCommand.gpsCommand.handler(argv);
                }
            )
            .command(
                simulateCommand.allCommand.command,
                simulateCommand.allCommand.command,
                yargs => {
                    yargs.options(simulateCommand.allCommand.options);
                },
                async argv => {
                    await simulateCommand.allCommand.handler(argv);
                }
            )
            .demandCommand(1, 'You must specify a command');
    })
    .command(
        settingsCommand.command,
        settingsCommand.description,
        yargs => {
            yargs.option(settingsCommand.options);
        },
        argv => {
            settingsCommand.handler(argv) as unknown;
        }
    )
    .demandCommand(1, 'You must specify a command')
    .strict()
    .epilogue('For more information, find our manual at https://github.com/eagletrt/telemetria-simulator#readme').argv;
