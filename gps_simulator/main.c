// this stuff avoid warning on implicit declaration of grantpt, ptsname, unlockpt and ...
// getline (sometimes even usleep). stdlib.h requires some definition in order to function properly
// for info look at https://linux.die.net/man/3/grantpt and https://linux.die.net/man/7/feature_test_macros
#if defined(__linux__) || defined(__GLIBC__) || defined(__GNU__)
#define _GNU_SOURCE			/* GNU glibc grantpt() prototypes */
#endif

// time stuff to get the current time in milliseconds
#define _POSIX_C_SOURCE 200809L
#include <time.h>
#include <math.h>
#include <inttypes.h>

#include <stdlib.h>
#include <stdio.h>
#include <unistd.h>
#include "./gps_service/gps_service.h"
#include <limits.h>

// Let this shit to use asprintf
#ifndef _GNU_SOURCE
#define _GNU_SOURCE 1
#endif

// 17053 messages in 74 seconds (according to default.gps.ubx)
// 21685 messages in 126 seconds (according to esempio_tracciato_esterno.ubx)
// 19489 messages in 96 seconds (according to esempio_tracciato_interno.ubx)

// | Messages | Time [s] | Freq. [Hz] | Avg. freq | Interval [s] | Int. [us] |
// |----------|----------|------------|-----------|--------------|-----------|
// |    17053 |       74 |        230 |           |              |           |
// |    21685 |      126 |        172 |    202    |   4.95E-3    |    4954   |
// |    19489 |       96 |        203 |           |              |           |

#define STATIC_INTERVAL 128700 // [us] // between RMC messages, 1 each 26 packets

void printMessage(char* message);
void printError(char* message);

unsigned long getUs(void);
int getMsFromMessage(char *line);
int getDelta(int* previousT, int* currentT, char* line);

int main(int argc, char * const * argv)
{
    int startupDelay = 0;
    int keepAlive = 0;
    int ubxTime = 0;
    int ubxIterations = 1;
    char* ubxSource = NULL;
    char ubxIterationsBuff[101] = "1";

    int opt = 0;
    while ((opt = getopt(argc, argv, "ktn:l:d:")) != -1) {
        switch(opt) {
            case 'k':
                keepAlive = 1;
                break;
            case 'd':
                startupDelay = atoi(optarg);
                break;
            case 't':
                ubxTime = 1;
                break;
            case 'n':
                sprintf(ubxIterationsBuff, "%s", optarg); //convert the integer to string when automatically parsed by getopt
                ubxIterations = (ubxIterationsBuff[0] == 'i') ? INT_MAX : atoi(optarg);
                break;
            case 'l':
                ubxSource = optarg;
                break;
            default:
                printError("invalid argument received");
                exit(1);
        }
    }
    if (ubxSource == NULL) {
        printError("the log file has not been specified, use -l <path>");
        exit(1);
    }

    usleep(100 * 1000); // standard wait just for fun

    int previousT = 0, currentT = 0, deltaT = 0;
    //get the master id
    int gps_port = openGPSPort("/dev/ptmx");
    

    // grant access to the slave
    if(grantpt(gps_port) < 0)
    {
        printError("grantpt");
        exit(1);
    }

    // unlock the slave
    if(unlockpt(gps_port) < 0)
    {
        printError("unlockpt");
        exit(1);
    }

    // get the path to the slave
    char slavepath[64];
    if(ptsname_r(gps_port, slavepath, sizeof(slavepath)) < 0)
    {
        printError("ptsname_r");
        exit(1);
    }

    // configuration messages
    if (ubxTime) printMessage("UBX SIMULATING TIME");
    else printMessage("UBX NOT SIMULATING TIME");

    if (keepAlive) printMessage("UBX KEEPING ALIVE");
    else printMessage("UBX NOT KEEPING ALIVE");

    char* ubxSourceMessage;
    asprintf(&ubxSourceMessage, "UBX SOURCE: %s", ubxSource);
    printMessage(ubxSourceMessage);
    free(ubxSourceMessage);

    char* ubxIterationsMessage;
    asprintf(&ubxIterationsMessage, "UBX ITERATIONS: %s", ubxIterations == INT_MAX ? "infinite" : ubxIterationsBuff);
    printMessage(ubxIterationsMessage);
    free(ubxIterationsMessage);

    char* gpsInterfaceMessage;
    asprintf(&gpsInterfaceMessage, "GPS INTERFACE: %s", slavepath);
    printMessage(gpsInterfaceMessage);
    free(gpsInterfaceMessage);

    char* startupDelayMessage;
    asprintf(&startupDelayMessage, "WAITING: %d ms", startupDelay);
    printMessage(startupDelayMessage);
    free(startupDelayMessage);

    usleep(startupDelay * 1000);

    char* startupMessage;
    asprintf(&startupMessage, "SENDING");
    printMessage(startupMessage);
    free(startupMessage);
    
    unsigned long time =  getUs(), delay = 0; // useful for timerize

    while(ubxIterations){
        char* line = NULL;
        size_t len = 0;

        FILE* fp;
        fp = fopen(ubxSource, "r");
        
        if (fp == NULL)
        {
            printError("Error opening file!\n");
            exit(1);
        }
        int t = 0;

        while (t != -1)
        {
            t = getline(&line, &len, fp);
            if (ubxTime) {
                if (strstr(line,"RMC")) { // RMC has a timestamp and starts a 26 msg.s block, then ended by GLL 
                    delay = getUs() - time; // estimates the delay between the last RMC and now
                    if (delay < 0) // check if the delay is negative or more than tolerable
                        delay = 0;
                    else if (delay > STATIC_INTERVAL/2)
                        delay = STATIC_INTERVAL/2;
                    usleep(STATIC_INTERVAL - delay); // tune sleep to be as trustful as possible to STATIC_INTERVAL
                    time = getUs(); // update the timestamp of the last RMC
                }
            }
            int written_bytes = write(gps_port,line,t);
            line = NULL;
            len = 0;
        }

        free(line);
        fclose(fp);

        if (ubxIterations != INT_MAX) ubxIterations--;
    }

    while (keepAlive);

    return 0;
}

void fixTime(char *line) {

}

unsigned long getUs (void)
{
    struct timespec spec;
    unsigned long result = 0;
    clock_gettime(CLOCK_MONOTONIC_RAW, &spec);
    result += spec.tv_sec * 1000000;
    result += spec.tv_nsec / 1000; // Convert nanoseconds to microseconds
    return result;
}


int getMsFromMessage(char *line) {
    double raw = 0;
    int result = 0;
    if (strstr(line,"GGA"))
    {
        gps_gga_struct* gga = (gps_gga_struct*) malloc(sizeof(gps_gga_struct));
        gga = parseGGA(line);
        raw = atof(gga->utc_time);
        free(gga);
    }
    else if (strstr(line,"GLL"))
    {
        gps_gll_struct* gll = (gps_gll_struct*) malloc(sizeof(gps_gll_struct));
        gll = parseGLL(line);
        raw = atof(gll->utc_time);
        free(gll);
    }
    else if (strstr(line,"RMC"))
    {
        gps_rmc_struct* rmc = (gps_rmc_struct*) malloc(sizeof(gps_rmc_struct));
        rmc = parseRMC(line);
        raw = atof(rmc->utc_time);
        free(rmc);
    }
    result += (int)(raw*1000)%1000; //ms
    result += ((int)raw%100)*1000; //s
    result += ((int)(raw/100)%100)*1000*60; //m
    result += ((int)raw/10000)*1000*60*60; //h
    return result;
}

int getDelta(int* previousT, int* currentT, char* line){

    previousT = currentT;
    if (strstr(line,"GGA"))
    {
        gps_gga_struct* gga = (gps_gga_struct*) malloc(sizeof(gps_gga_struct));
        gga = parseGGA(line);
        *currentT = atoi(gga->utc_time);
        free(gga);
        return currentT - previousT;
    }
    else if (strstr(line,"GLL"))
    {
        gps_gll_struct* gll = (gps_gll_struct*) malloc(sizeof(gps_gll_struct));
        gll = parseGLL(line);
        *currentT = atoi(gll->utc_time);
        free(gll);
        return currentT - previousT;      
    }
    else if (strstr(line,"VTG"))
    {
        return 0;
    }
    else if (strstr(line,"RMC"))
    {
        gps_rmc_struct* rmc = (gps_rmc_struct*) malloc(sizeof(gps_rmc_struct));
        rmc = parseRMC(line);
        *currentT = atoi(rmc->utc_time);
        free(rmc);
        return currentT - previousT; 
    }
}

void printMessage(char* message) {
    printf("[GPS] {MESSAGE} %s\n", message);
    fflush(stdout);
}

void printError(char* message) {
    printf("[GPS] {ERROR} %s\n", message);
    fflush(stderr);
}
