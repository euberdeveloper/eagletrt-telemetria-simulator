import { simulateCan, SimulateCanOptions, simulateGps, SimulateGpsOptions } from '@lib';
import { updateTelemetryGpsPort } from '@/bin/utils';
import { Command } from '@bin/commands/types';

export const command: Command = {
    command: 'all',
    description: 'Simulates both a canbus and a gps',
    options: {
        'can-log': {
            alias: 'c',
            default: null,
            describe: 'The log file that contains the messages to be sent over the can',
            defaultDescription: 'There is a module built-in default can log if nothing is specified',
            type: 'string'
        },
        'gps-log': {
            alias: 'g',
            default: null,
            describe: 'The log file that contains the messages to be sent over the gps',
            defaultDescription: 'There is a module built-in default gps log if nothing is specified',
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
        'can-simulate-time': {
            default: true,
            describe: 'If the time of the can log will be simulated',
            type: 'boolean'
        },
        'can-iterations': {
            default: Infinity,
            describe: 'The number of iterations in which the can log file will be sent to the canbus',
            defaultDescription: 'If nothing is specified, the file is sent in an infinite loop',
            type: 'number'
        },
        'gps-simulate-time': {
            default: true,
            describe: 'If the time of the gps log will be simulated',
            type: 'boolean'
        },
        'delay': {
            alias: 'd',
            default: 0,
            describe:
                'How many milliseconds will the gps simulator wait after opening the gps pseudoterminal port interface and before sending the messages over that interface. Also the can will wait the same number of milliseconds before starting.',
            type: 'number'
        },
        'gps-iterations': {
            default: Infinity,
            describe: 'The number of iterations in which the gps log file will be sent',
            defaultDescription: 'If nothing is specified, the file is sent in an infinite loop',
            type: 'number'
        },
        'gps-keep-alive': {
            default: false,
            describe: 'Keep the gps process alive after having sent all the simulated gps data',
            type: 'boolean'
        },
        'gps-update-config': {
            default: true,
            describe:
                'Updates the gps port on the config file of the telemetry to the same value of the opened gps interface. The config file is the one specified with the settings command.',
            type: 'boolean'
        }
    },
    handler: async args => {
        const gpsUpdateConfig = args.gpsUpdateConfig;

        const canLog = args.canLog;
        const gpsLog = args.gpsLog;

        const canOptions: SimulateCanOptions = {
            canInterface: args.canInterface,
            silent: args.silent,
            iterations: args.canIterations,
            simulateTime: args.canSimulateTime
        };
        const gpsOptions: SimulateGpsOptions = {
            silent: args.silent,
            iterations: args.gpsIterations,
            simulateTime: args.gpsSimulateTime,
            delay: args.delay,
            keepAlive: args.gpsKeepAlive
        };

        const [, gpsInstance] = await Promise.all([
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            new Promise(resolve => setTimeout(async () => resolve(await simulateCan(canLog, canOptions)), args.delay)),
            simulateGps(gpsLog, gpsOptions)
        ]);

        if (gpsUpdateConfig) {
            const gpsInterface = await gpsInstance.getGpsInterface();
            updateTelemetryGpsPort(gpsInterface);
        }
    }
};
