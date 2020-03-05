#!/bin/bash 

CANID=`pidof sudo bash ./can.sh&`
GPSID=`pidof sudo ./simulator.out&`
echo "can" $CANID
echo "gps" $GPSID
# trap ctrl-c and call ctrl_c()
trap ctrl_c INT

function ctrl_c() {
        echo "in kill"
        sudo kill $GPSID
        sudo kill $CANID    
}