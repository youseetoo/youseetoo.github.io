# ESP32-Based Microscopy

This is a repository for the smallest standalone low-cost open-source DIY microscope system that can be used for a gazillion different applications. Sounds interesting? Continue reading!

The core component of this device is an ESP32 microcontroller packed with a small Camera (OV2460), WiFi, and a microSD card slot, making it a perfect match for your microscopy project. In its minimal version, you only need the ESP32-CAM and perhaps some chewing gum to raise the objective lens and create a finite corrected microscope.

Why raise the lens, and what is a finite corrected microscope, you ask? 

## Some theory

### Magnification

*Why can you actually magnify?* Good question! We don't magnify at all, but since the pixels of the OV2460 camera are really small, and we use the objective lens with a relatively small focal length (f'=~5mm), we perform a "4f-imaging". In this context, this means, we have a sample at a distance of 2f (focal lengths) in front of the lens, which will, in turn, create an image at 2f away from it. The camera chip will digitize the image and send it over to your displaying device. You can tune the magnification by changing the distance between the sample-lens and the lens-sensor. The formula is given by:

`M=a'/a`, where `M`is the magnification, `a'` the distance sample-lens, `a` the distance lens-sensor. Further:

`1/f'=1/a' - 1/a`;

You can easily display your phone's screen's ~100µm sized pixels. By tuning the distance, you can play with the field of view, resolution (since the imaging NA changes), and magnification. We don't care about sampling right now, since we do not have much influence on it anyway...

![](IMAGES/matchboxscope/image1.png)

![](IMAGES/matchboxscope/image2.png)

Essentially, this configuration is also known as a finite-corrected microscopy arrangement. It comes with many problems, but we want to keep it simple. Hence we will stick to the basic optical setup here.

### Illumination

The other important part of any microscope is the illumination setup. And also in this case, the ESP32-Cam board is coming to our help.

*Why don't we need any illumination?* Yet another good question. Where there is no light, we won't see anything. Obviously. But: The ESP32 has an insanely strong LED Torch/light that can be switched on/off and even dimmed. Luckily, we can use it to illuminate our sample for transmission microscopy. Wait, how can that be done? Easy! We construct a little periscope/mirror-periscope that simply reflects the light on top of the sample. We have also used other illumination systems like a fiber optic or an Ikea USB LED. The versatility of the system is amazing.

This is how the first periscope illumination looked like. Like an Anglerfish...

![](IMAGES/matchboxscope/IMG_20220326_185946.jpg)

![](IMAGES/matchboxscope/IMG_20220326_190242.jpg)

And using those two simple tricks (lens distance from the sensor, and illumination), we developed multiple unbelievably cost-effective open hardware microscopes.  

## License and Collaboration

This project is open-source and is released under the CERN open hardware license. We encourage everyone who is using our Toolbox to share their results and ideas so that the system keeps improving. It should serve as an easy-to-use and easy-to-access general-purpose building block solution for multiple applications. 

You're free to fork the project and enhance it. If you have any suggestions to improve it or add additional functions make a pull request or file an issue.



## Collaborating
If you find this project useful, please like this repository, follow us on Twitter, and cite the webpage! :-)
