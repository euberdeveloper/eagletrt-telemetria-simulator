import { Options } from 'yargs';

export interface SovraCommand {
    command: string;
    description: string;
    options?: Record<string, Options>;
}

export interface Command extends Required<SovraCommand> {
    handler: (args: any) => void | Promise<void>;
}
