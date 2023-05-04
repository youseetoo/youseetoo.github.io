# Matchboxscope (Injection Molding Version)

This is a simplified version of the matchboxscope that can be produced using a desktop injection molding machine.

## Flash the firmware

1. Connect the ESP32-CAM board to the USB and press the ***RESET*** (in the rear of the ESP32-CAM board) and ***BOOT*** button (on the USB-side). Then first release the ***RESET*** and then the ***BOOT*** button. The device will be in `download mode`

2. Go to https://matchboxscope.github.io/firmware/FLASH.html and select the `ESP32 Camera Simple Webcam Server Advanced` firmware
![](IMAGES/injectionmold/matchboxscope_injectionmolding5.jpg)

3. Hit the `Connect` button and select the ESP32-CAM
![](IMAGES/injectionmold/matchboxscope_injectionmolding6.jpg)

4. Select `Install ESP32...`
![](IMAGES/injectionmold/matchboxscope_injectionmolding7.jpg)

5. Hit `Install`
![](IMAGES/injectionmold/matchboxscope_injectionmolding8.jpg)

6. Wait for it...
![](IMAGES/injectionmold/matchboxscope_injectionmolding9.jpg)

7. Open the serial Minitor afterwards and hit the ```RESET```button on the ESP32
![](IMAGES/injectionmold/matchboxscope_injectionmolding10.jpg)

8. The output should look something like this
![](IMAGES/injectionmold/matchboxscope_injectionmolding13.jpg)

9. By default the ESP32 will connect to a WIFI hotspot using the following default networks:

```
SSID: Blynk
PW: 12345678

SSID: omniscope
PW: omniscope
```

You can add your own by pasting the following string in the serial monitor
```
{"ssid":"youssid","password":"yourpassword"}
```

The firmware is based on this code: https://github.com/Matchboxscope/matchboxscope-simplecamera/tree/matchboxscope

10. finding the ESP in the network may become tricky. You can install the Fing APP (https://play.google.com/store/apps/details?id=com.overlook.android.fing) and scan your local network for its IP. In case you prepared an access point (AP) using Windows, you can spot the IP address in the hotspot  settings.


## Assembly

These are the parts you need to build a Matchboxscope:

![](IMAGES/injectionmold/matchboxscope_injectionmolding2.jpg)

- ESP32-Camera board + USB Serial adapter
- 2x Lid/bottom (printed)
- 2x Base (printed)
- 1x camera holder (printed)
- 1x lamp holder (printed)
- 1x lens holder (printed)
- 1x led lamp
- 3x Springs
- 8x M3x20 Cylindrical Headed Screws (DIN912)
- 6x M3 threaded inserts (4x6mm)
- 1x USB micro cable


1. Add the threaded inserts to the base using a hot iron - don't burn yourself!
![](IMAGES/injectionmold/matchboxscope_injectionmolding3.jpg)

2. Repeat this for all 6 slots
![](IMAGES/injectionmold/matchboxscope_injectionmolding1.jpg)

3. Remove the lens from the camera module using pliers
![](IMAGES/injectionmold/matchboxscope_injectionmolding4.jpg)

4. Add the lens to the holder and remove the sticky tape
![](IMAGES/injectionmold/matchboxscope_injectionmolding11.jpg)

5. Fix the lens on the base using M3 screws
![](IMAGES/injectionmold/matchboxscope_injectionmolding12.jpg)

6. Add the camera holder to the board and fix the camera in place
![](IMAGES/injectionmold/matchboxscope_injectionmolding14.jpg)

7. Add the esp32 board to the base
![](IMAGES/injectionmold/matchboxscope_injectionmolding15.jpg)

8. Close the lid using M3 screws
![](IMAGES/injectionmold/matchboxscope_injectionmolding16.jpg)

9. Add the springs to the screws and mount the sample plate using m3 screws + add teh lamp holder
![](IMAGES/injectionmold/matchboxscope_injectionmolding17.jpg)

10. Add the lamp - done!
![](IMAGES/injectionmold/matchboxscope_injectionmolding18.jpg)




## Done

![](IMAGES/injectionmold/matchboxscope_injectionmolding19.jpg)


## Showcase

![](IMAGES/injectionmold/matchboxscope_injectionmolding_sample_1.jpeg)
![](IMAGES/injectionmold/matchboxscope_injectionmolding_sample_2.jpeg)
![](IMAGES/injectionmold/matchboxscope_injectionmolding_sample_3.jpeg)
![](IMAGES/injectionmold/matchboxscope_injectionmolding_sample_4.jpeg)
![](IMAGES/injectionmold/matchboxscope_injectionmolding_sample_5.jpeg)
![](IMAGES/injectionmold/matchboxscope_injectionmolding_sample_6.jpeg)
![](IMAGES/injectionmold/matchboxscope_injectionmolding_sample_7.jpeg)
![](IMAGES/injectionmold/matchboxscope_injectionmolding_sample_8.jpeg)
![](IMAGES/injectionmold/matchboxscope_injectionmolding_sample_9.jpeg)
![](IMAGES/injectionmold/matchboxscope_injectionmolding_sample_10.jpeg)
![](IMAGES/injectionmold/matchboxscope_injectionmolding_sample_11.jpeg)
![](IMAGES/injectionmold/matchboxscope_injectionmolding_sample_12.jpeg)
