import { virtualizeCan, VirtualizeCanOptions } from '@lib';
import { Command } from '@bin/commands/types';

export const command: Command = {
    command: 'can',
    description: 'Virtualize a canbus interface',
    options: {
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
        }
    },
    handler: async args => {
        const canInterface = args.canInterface;
        const options: VirtualizeCanOptions = {
            silent: args.silent
        };
        await virtualizeCan(canInterface, options);
    }
};
