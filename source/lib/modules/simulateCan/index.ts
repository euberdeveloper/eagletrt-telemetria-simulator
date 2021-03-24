import * as path from 'path';
import * as treeKill from 'tree-kill';
import { exec, which } from 'shelljs';
import { EventEmitter } from 'events';
import { ChildProcess } from 'child_process';
import { Logger } from '@lib/utils';
import { command } from 'yargs';

/**
 * The interface of the options for the simulateCan function.
 */
export interface SimulateCanOptions {
    /**
     * If true, the log will not be shown. Default: true.
     */
    silent: boolean;
    /**
     * The name of the can interface where the data will be sent. Default: 'can0'.
     */
    canInterface: string;
    /**
     * The number of times that the can log file will be sent over the can. Default: Infinity.
     */
    iterations: number;
    /**
     * If the delta timestamps specified for each message in the can log file will be taken in consideration and simulated. Default: true.
     */
    simulateTime: boolean;
}

/**
 * The class of the can simulator instances, which are the processes that are created through the simulateCan function. They provide additional functionality compared to normal ChildProcess objects.
 */
export class CanSimulatorInstance {
    private readonly logger: Logger;
    private readonly simulatorFinishedEmitter: EventEmitter;

    private readonly _childprocess: ChildProcess;
    private readonly _canInterface: string;
    private _finished: boolean;

    /**
     * The constructor of the CanSimulatorInstance. It is supposed to be used by the simulateCan function.
     * @param childprocess The childprocess instance of the process.
     * @param canInterface The name of the can interface.
     * @param logger The logger instance.
     */
    constructor(childprocess: ChildProcess, canInterface: string, logger: Logger) {
        this._childprocess = childprocess;
        this._canInterface = canInterface;
        this.logger = logger;
        this._finished = false;

        this.simulatorFinishedEmitter = new EventEmitter();

        this.childprocess.on('exit', (code, signal) => {
            if (signal === 'SIGTERM') {
                this.logger.success('Can simulator closed');
            } else if (code === 0) {
                this.logger.success('Can simulator finished');
            } else {
                this.logger.error(`Can simulator finished with error code ${code}`);
            }
            this._finished = true;
            this.simulatorFinishedEmitter.emit('simulatorFinished');
        });
    }

    /**
     * The childprocess instance of the created process.
     */
    get childprocess(): ChildProcess {
        return this._childprocess;
    }
    /**
     * The name of the can interface where the messages are sent.
     */
    get canInterface(): string {
        return this._canInterface;
    }
    /**
     * If the process finished its job and was closed.
     */
    get finished(): boolean {
        return this._finished;
    }

    /**
     * Stops the process if it has not already finished.
     */
    public async stop(): Promise<void> {
        return new Promise(resolve => {
            if (this.finished) {
                resolve();
            } else {
                treeKill(this.childprocess.pid);
                this.simulatorFinishedEmitter.addListener('simulatorFinished', () => resolve());
            }
        });
    }

    /**
     * Waits until the can simulator has finished or an optional-specified timeout has expired.
     * @param timeout The number of milliseconds before stopping to wait if the simulator has not stopped yet. Default: null.
     * @returns A promise to a boolean which is true if the simulator has finished and false otherwise.
     */
    public async waitUntilFinished(timeout: number | null = null): Promise<boolean> {
        const finishedPromise = new Promise<boolean>(resolve => {
            if (this.finished) {
                resolve(true);
            } else {
                this.simulatorFinishedEmitter.addListener('simulatorFinished', () => resolve(true));
            }
        });

        const timeoutPromise = new Promise<boolean>(resolve => {
            if (typeof timeout === 'number') {
                setTimeout(() => resolve(false), timeout);
            }
        });

        return Promise.race([finishedPromise, timeoutPromise]);
    }
}

const DEFAULT_SOURCE = path.join(__dirname, '..', '..', '..', '..', 'default_sources', 'default.can.log');
const DEFAULT_OPTIONS: SimulateCanOptions = {
    silent: true,
    canInterface: 'can0',
    iterations: Infinity,
    simulateTime: true
};

/**
 * It simulates some data sent via a virtualized canbus interface. The data comes from a can log, that can be obtained through tools such as candump.
 * @param src The path to the can log file containing the messages that will be sent over the virtualized canbus. The default value is a can log file already stored in this npm package. If some options are wanted to be specified, but also using the default src file, use null as this value.
 * @param options Additional options for the function.
 */
export async function simulateCan(
    src: string | null = DEFAULT_SOURCE,
    options: Partial<SimulateCanOptions> = {}
): Promise<CanSimulatorInstance> {
    return new Promise<CanSimulatorInstance>(resolve => {
        const handledSrc = src ?? DEFAULT_SOURCE;
        const handledOptions: SimulateCanOptions = { ...DEFAULT_OPTIONS, ...options };
        const logger = new Logger(handledOptions.silent, 'CAN');

        const commandOptions: string[] = [`-I ${handledSrc}`];
        if (handledOptions.iterations) {
            const value = handledOptions.iterations === Infinity ? 'i' : `${handledOptions.iterations}`;
            commandOptions.push(`-l ${value}`);
        }
        if (!handledOptions.simulateTime) {
            commandOptions.push('-t');
        }
        commandOptions.push(`${handledOptions.canInterface}=can0`);
        const stringifiedCommandOptions = commandOptions.join(' ');

        logger.info('Starting canplayer');

        if (!which('canplayer')) {
            logger.error('Error: canplayer command not found. Try "apt install can-utils" to install it.');
            throw new Error('modprobe command not found. Try "apt install can-utils" to install it.');
        }

        const childProcess = exec(`canplayer ${stringifiedCommandOptions}`, {
            async: true,
            silent: handledOptions.silent
        });
        logger.debug('PID:', null, childProcess.pid);
        const canSimulatorInstance = new CanSimulatorInstance(childProcess, handledOptions.canInterface, logger);
        resolve(canSimulatorInstance);
    });
}
