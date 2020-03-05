gcc -g -c gps_service.c 
gcc -g -c sender.c 
gcc -o sender sender.o gps_service.o