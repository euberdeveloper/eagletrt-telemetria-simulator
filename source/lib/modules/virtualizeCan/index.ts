import { which } from 'shelljs';
import { execAsync, Logger } from '@lib/utils';

/**
 * The interface of the options for the virtualizeCan function.
 */
export interface VirtualizeCanOptions {
    /**
     * If true, the log will not be shown. Default: true.
     */
    silent: boolean;
}

const DEFAULT_OPTIONS: VirtualizeCanOptions = {
    silent: true
};

/**
 * The enum of the result for the virtualizeCan function.
 */
export enum VirtualizeCanResult {
    /**
     * Returned when the can interface has been virtualized.
     */
    VIRTUALIZED = 'virtualized',
    /**
     * Returned when the can interface was already virtualized, so nothing has been done.
     */
    ALREADY_VIRTUALIZED = 'already_virtualized'
}

/**
 * It virtualizes a canbus interface.
 * @param canInterface The name of the interface that is to be virtualized. Deualt Value: 'can0'.
 * @param options Additional options for the function.
 * @returns A promise to either 'virtualized' if the can has been virtualized or 'already_virtualized' if it was already virtualized.
 */
export async function virtualizeCan(
    canInterface = 'can0',
    options: Partial<VirtualizeCanOptions> = {}
): Promise<VirtualizeCanResult> {
    const handledOptions: VirtualizeCanOptions = { ...DEFAULT_OPTIONS, ...options };
    const logger = new Logger(handledOptions.silent, 'CAN');

    let result: VirtualizeCanResult = VirtualizeCanResult.VIRTUALIZED;

    try {
        logger.info('Setting up CAN interface');
        logger.debug('Can interface: ', canInterface);

        if (!which('modprobe')) {
            logger.error('Error: modprobe command not found');
            throw new Error('modprobe command not found');
        }

        if (!which('ip')) {
            logger.error('Error: ip command not found');
            throw new Error('ip command not found');
        }

        await execAsync(`sudo modprobe vcan`, { silent: handledOptions.silent });
        await execAsync(`sudo ip link add dev ${canInterface} type vcan`, { silent: handledOptions.silent });
        await execAsync(`sudo ip link set up ${canInterface}`, { silent: handledOptions.silent });

        logger.success('CAN interface virtualized');
    } catch (error) {
        if (error?.code === 2 && error?.stderr === 'RTNETLINK answers: File exists\n') {
            result = VirtualizeCanResult.ALREADY_VIRTUALIZED;
            logger.warning('CAN inteface already virtualized');
        }
    }

    return result;
}
