#include <stdlib.h>
#include <stdio.h>
#include "gps_service.h"


int main(int argc, char const *argv[])
{
    
    //get the master id
    int gps_port = openGPSPort("/dev/ptmx");
    

    // grant access to the slave
    if(grantpt(gps_port) < 0)
    {
        perror("grantpt");
        exit(1);
    }

    // unlock the slave
    if(unlockpt(gps_port) < 0)
    {
        perror("unlockpt");
        exit(1);
    }

    // get the path to the slave
    char slavepath[64];
    if(ptsname_r(gps_port, slavepath, sizeof(slavepath)) < 0)
    {
        perror("ptsname_r");
        exit(1);
    }

    printf("Using %s\n", slavepath);
    
    
    while(1){
        char* line = NULL;
        size_t len = 0;

        FILE* fp = fopen("gps.txt","r");
        if (fp == NULL)
        {
            perror("Error opening file!\n");
            exit(1);
        }
        int t = 0;

        while (t != -1)
        {
            t = getline(&line, &len, fp);
            int written_bytes = write(gps_port,line,t);
            line = NULL;
            len = 0;
        }

        free(line);
        fclose(fp);
    }

    return 0;
}
