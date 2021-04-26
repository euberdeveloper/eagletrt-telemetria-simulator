import { simulateCan, SimulateCanOptions } from '@lib';
import { Command } from '@bin/commands/types';

export const command: Command = {
    command: 'can',
    description: 'Simulates a canbus by sending messages from a log',
    options: {
        'log': {
            alias: 'l',
            default: null,
            describe: 'The log file that contains the messages to be sent over the can',
            defaultDescription: 'There is a module built-in default can log if nothing is specified',
            type: 'string'
        },
        'can-interface': {
            alias: 'i',
            default: 'can0',
            describe: 'The name of the can interface to create',
            type: 'string'
        },
        'silent': {
            alias: 's',
            default: false,
            describe: 'If logs will be displayed',
            type: 'boolean'
        },
        'simulate-time': {
            alias: 't',
            default: true,
            describe: 'If the time of the can log will be simulated',
            type: 'boolean'
        },
        'iterations': {
            alias: 'n',
            default: Infinity,
            describe: 'The number of iterations in which the can log file will be sent to the canbus',
            defaultDescription: 'If nothing is specified, the file is sent in an infinite loop',
            type: 'number'
        }
    },
    handler: async args => {
        const log = args.log;
        const options: SimulateCanOptions = {
            canInterface: args.canInterface,
            silent: args.silent,
            iterations: args.iterations,
            simulateTime: args.simulateTime
        };
        await simulateCan(log, options);
    }
};
