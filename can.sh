#!/bin/bash

function ctrl_c() {
        echo "kill canplayer"
        killall canplayer
        wait $canpl_id
}

#trap ctrl_c TERM INT

# setting up can interface if not already set
echo "setting up can interface if not already set"
sudo modprobe vcan
sudo ip link add dev can0 type vcan
sudo ip link set up can0

# startingd can player
echo "startingd can player"
exec canplayer -l i -I can.log
#canpl_id=$!

#wait $canpl_id
