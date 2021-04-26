import { setTelemetryConfigPath } from '@/bin/utils';
import { Command } from '@bin/commands/types';

export const command: Command = {
    command: 'settings',
    description: 'Change the settings of the module',
    options: {
        'telemetry-config-path': {
            alias: 't',
            demandOption: true,
            describe:
                'The path to the telemetry config file. It will be updated automatically when calling the gps simulator with the option --update-config set to true. Use "null" to set it to null.',
            type: 'string'
        }
    },
    handler: args => {
        const telemetryConfigPath = args.telemetryConfigPath === 'null' ? null : args.telemetryConfigPath;
        setTelemetryConfigPath(telemetryConfigPath);
    }
};
