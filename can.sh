#!/bin/bash
# setting up can interface if not already set
echo "setting up can interface if not already set"
sudo modprobe vcan
sudo ip link add dev can0 type vcan
sudo ip link set up can0

# starting infinity can player
echo "starting infinity can player"
canplayer -l i -I can.log


