shell-extension-nouveau-perflvl-switcher
========================================

##Nouveau PM Switch extension for Gnome Shell

Nouveau Perflvl Switcher is a small extension to switch among performance levels in Nouveau-supported cards.

It works when the card is primary or secondary, but not in SLI/Multicard configuration, as Nouveau 
doesn't support multicard setup (see http://nouveau.freedesktop.org/wiki/FeatureMatrix). 
Yet, nvidia optimus has to be tested so feedbacks of any type are higly requested.

##Requirements
In order to enable performance levels switchin in your kernel, you have to boot it with nouveau.perflvl_wr=7777 .
This extensions uses policykit to gain root write access to the sysfs file (/sys/class/drm/cardX/performance_level), so 
there's no need to change write permission on the file (perhaps a full root authentication would be better).

##Debug
Extension messages and debug informations can be found in ~/.xsession-errors. Just look for lines starting with "[nouveau pm switch]".

##Disclaimer
Remember that card reclocking is NOT YET considered stable, so use performance level switching AT YOUR OWN RISK.
This extension has been tested on a NV50 generation card (GeForce 9650mGT), and it should work flawlessly on newer cards,
along with their power management support (Check for the state of support at http://nouveau.freedesktop.org/wiki/PowerManagement)

##Thanks and Credits
Thanks goes to Francisco Pina Martins (https://github.com/StuntsPT) the author of "Radeon power profile manager" 
(https://github.com/StuntsPT/shell-extension-radeon-power-profile-manager, that I used as a starting point for the code),
to Wikipedia, where I took the raster svg from (http://en.wikipedia.org/wiki/File:Phoenician_nun.svg)
and of course to the #nouveau team on freenode, for the funny conversations and suggestions.

##License:
This software is licensed under the GPLv2.
