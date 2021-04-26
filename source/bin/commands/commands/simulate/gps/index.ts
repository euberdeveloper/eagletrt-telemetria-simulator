import { simulateGps, SimulateGpsOptions } from '@lib';
import { updateTelemetryGpsPort } from '@/bin/utils';
import { Command } from '@bin/commands/types';

export const command: Command = {
    command: 'gps',
    description: 'Simulates a gps by sending messages from a log',
    options: {
        'log': {
            alias: 'l',
            default: null,
            describe: 'The log file that contains the messages to be sent over the gps',
            defaultDescription: 'There is a module built-in default gps log if nothing is specified',
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
            describe: 'If the time of the gps log will be simulated',
            type: 'boolean'
        },
        'delay': {
            alias: 'd',
            default: 0,
            describe:
                'How many milliseconds will the gps simulator wait after opening the gps pseudoterminal port interface and before sending the messages over that interface',
            type: 'number'
        },
        'iterations': {
            alias: 'n',
            default: Infinity,
            describe: 'The number of iterations in which the gps log file will be simulated',
            defaultDescription: 'If nothing is specified, the file is sent in an infinite loop',
            type: 'number'
        },
        'keep-alive': {
            alias: 'k',
            default: false,
            describe: 'Keep the process alive after having sent all the simulated gps data',
            type: 'boolean'
        },
        'update-config': {
            alias: 'u',
            default: true,
            describe:
                'Updates the gps port on the config file of the telemetry to the same value of the opened gps interface. The config file is the one specified with the settings command.',
            type: 'boolean'
        }
    },
    handler: async args => {
        const updateConfig = args.updateConfig;

        const log = args.log;
        const options: SimulateGpsOptions = {
            silent: args.silent,
            iterations: args.iterations,
            simulateTime: args.simulateTime,
            delay: args.delay,
            keepAlive: args.keepAlive
        };

        const gpsInstance = await simulateGps(log, options);

        if (updateConfig) {
            const gpsInterface = await gpsInstance.getGpsInterface();
            updateTelemetryGpsPort(gpsInterface);
        }
    }
};
