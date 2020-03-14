#!/bin/bash

function ctrl_c() {
        kill $GPSID
        kill $CANID

        #wait $GPSID
}
trap ctrl_c SIGINT


./simulator.out &
GPSID=$!

bash ./can.sh &
CANID=$! 

echo "CAN " $CANID
echo "GPS " $GPSID

# trap ctrl-c and call ctrl_c()

#Swait $CANID
#wait $GPSID

#Strap ctrl_c TERM INT

wait $CANID
wait $GPSID

exit 0
