import * as path from 'path';
import * as treeKill from 'tree-kill';
import { exec } from 'shelljs';
import { EventEmitter } from 'events';
import { ChildProcess } from 'child_process';
import { Logger } from '../../utils';

/**
 * The interface of the options for the simulateGps function.
 */
export interface SimulateGpsOptions {
    /**
     * If true, the log will not be shown. Default: true.
     */
    silent: boolean;
    /**
     * The number of times that the gps ubx log file will be sent over the serial port. Default: Infinity.
     */
    iterations: number;
    /**
     * If the messages in the gps ubx log file will be sent simulating the time. Default: true.
     */
    simulateTime: boolean;
    /**
     * How many milliseconds will the gps simulator wait after opening the gps pseudoterminal port interface and before sending the messages over that interface. Default: 0.
     */
    delay: number;
    /**
     * Keep the process alive after having sent all the simulated gps data. Default: false
     */
    keepAlive: boolean;
};

/**
 * The class of the gps simulator instances, which are the processes that are created through the simulateGps function. They provide additional functionality compared to normal ChildProcess objects.
 */
export class GpsSimulatorInstance {

    private logger: Logger;
    private gpsInterfaceEmitter: EventEmitter;
    private simulatorFinishedEmitter: EventEmitter;

    private _childprocess: ChildProcess;
    private _gpsInterface: string | null;
    private _finished: boolean;

    /**
     * The childprocess instance of the created process.
     */
    public get childprocess(): ChildProcess {
        return this._childprocess;
    }
    /**
     * The name of the gps interface (the virtual serial port) where the messages are sent.
     */
    public get gpsInterface(): string | null {
        return this._gpsInterface;
    }
    /**
     * If the process finished its job and was closed.
     */
    public get finished(): boolean {
        return this._finished;
    }

    /**
     * Returns the gps interface if it is already defined, or waits for the gps simulator output to print it and returns it after detecting that output.
     */
    public async getGpsInterface(): Promise<string> {
        return new Promise((resolve) => {
            if (this.gpsInterface) {
                resolve(this.gpsInterface);
            }
            else {
                this.gpsInterfaceEmitter
                    .addListener('gpsInterface', gpsInterface => resolve(gpsInterface));
            }
        });
    }

    /**
     * Stops the process if it has not already finished.
     */
    public async stop(): Promise<void> {
        return new Promise(resolve => {
            if (this.finished) {
                resolve();
            }
            else {
                treeKill(this.childprocess.pid);
                this.simulatorFinishedEmitter
                    .addListener('simulatorFinished', () => resolve());
            }
        });
    }

    /**
     * Waits until the gps simulator has finished or an optional-specified timeout has expired.
     * @param timeout The number of milliseconds before stopping to wait if the simulator has not stopped yet. Default: null.
     * @returns A promise to a boolean which is true if the simulator has finished and false otherwise.
     */
    public async waitUntilFinished(timeout: number | null = null): Promise<boolean> {
        const finishedPromise = new Promise<boolean>(resolve => {
            if (this.finished) {
                resolve(true);
            }
            else {
                this.simulatorFinishedEmitter
                    .addListener('simulatorFinished', () => resolve(true));
            }
        });

        const timeoutPromise = new Promise<boolean>(resolve => {
            if (typeof timeout === 'number') {
                setTimeout(() => resolve(false), timeout);
            }
        });

        return Promise.race([finishedPromise, timeoutPromise]);
    }

    /**
     * The constructor of the GpsSimulatorInstance. It is supposed to be used by the simulateGps function.
     * @param childprocess The childprocess instance of the process.
     * @param logger The logger instance.
     */
    constructor(childprocess: ChildProcess, logger: Logger) {
        this._childprocess = childprocess;
        this.logger = logger;
        this._finished = false;

        this.gpsInterfaceEmitter = new EventEmitter();
        this.childprocess.stdout?.setEncoding('utf8');
        this.childprocess.stdout?.on('data', (data: Buffer) => {
            const lines = data.toString().split('\n');
            for (const line of lines) {
                if (line.includes('{MESSAGE}') && line.includes('GPS INTERFACE')) {
                    this._gpsInterface = line.split('GPS INTERFACE: ')[1];
                    this.gpsInterfaceEmitter.emit('gpsInterface', this._gpsInterface);
                }
            }
        });

        this.simulatorFinishedEmitter = new EventEmitter();
        this.childprocess.on('exit', (code, signal) => {
            if (signal === 'SIGTERM') {
                this.logger.success('Gps simulator closed');
            }
            else if (code === 0) {
                logger.success('Gps simulator finished');
            }
            else {
                logger.error(`Gps simulator finished with error code ${code}`);
            }
            this._finished = true;
            this.simulatorFinishedEmitter.emit('simulatorFinished');
        });
    }

}

const DEFAULT_SOURCE = path.join(__dirname, '..', '..', '..', '..', 'default_sources', 'default.gps.ubx');
const DEFAULT_OPTIONS: SimulateGpsOptions = {
    silent: true,
    iterations: Infinity,
    simulateTime: true,
    delay: 0,
    keepAlive: false
};

/**
 * It simulates some data sent via a virtualized gps serial port. The data comes from a gps ubx log.
 * @param src The path to the gps log file containing the messages that will be sent over the virtualized serial port. The default value is a gps log file already stored in this npm package. If some options are wanted to be specified, but also using the default src file, use null as this value.
 * @param options Additional options for the function.
 */
export async function simulateGps(src: string | null = DEFAULT_SOURCE, options: Partial<SimulateGpsOptions> = {}): Promise<GpsSimulatorInstance> {
    return new Promise<GpsSimulatorInstance>((resolve) => {
        const handledSrc = src ?? DEFAULT_SOURCE;
        const handledOptions: SimulateGpsOptions = { ...DEFAULT_OPTIONS, ...options };
        const logger = new Logger(handledOptions.silent, 'GPS');

        const commandOptions: string[] = [ `-l ${handledSrc}` ];
        if (handledOptions.delay > 0) {
            const value = handledOptions.delay;
            commandOptions.push(`-d ${value}`); 
        }
        if (handledOptions.iterations) {
            const value = handledOptions.iterations === Infinity ? 'i' : `${handledOptions.iterations}`;
            commandOptions.push(`-n ${value}`);
        }
        if (handledOptions.simulateTime) {
            commandOptions.push('-t');
        }
        if (handledOptions.keepAlive) {
            commandOptions.push('-k');
        }
        const stringifiedCommandOptions = commandOptions.join(' ');
        const pathToGpsSimulator = path.join(__dirname, '..', '..', '..', '..', 'gps_simulator', 'gps_simulator.out');

        logger.info('Starting gps simulator');
        const childProcess = exec(`${pathToGpsSimulator} ${stringifiedCommandOptions}`, { async: true, silent: handledOptions.silent });
        logger.debug('PID:', null, childProcess.pid);
        const gpsSimulatorInstance = new GpsSimulatorInstance(childProcess, logger);
        resolve(gpsSimulatorInstance);
    });
}

