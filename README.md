# Installation
See INSTALL.md

# Running DotaPuff
Run with the command

`npm start`

Open http://localhost:3000 in your browser.

# About DotaPuff
DotaPuff is a toy project made to help me learn Node.js. It
visualizes statistics for how you compare to your peers in
recent matches of DOTA 2.

DotaPuff gathers a list of peers you've recently played with
(or against) and compares your performance along various
metrics over your last 50 games. The arrows to the left and
right of each user box will place them into left or right
slots of the comparison view, where you can see a graph
of performance over time. Note that you can load a second
user while the first one is still loading.

To change the user and get a list of their peers, enter the
steam ID into the search bar and click the search button.

Occasionally you'll get an error saying that the steam servers
are busy. Just wait a few minutes and try again. Gathering
the necessary data requires many calls to the DOTA 2 web api,
so loading can be a little slow.

To see a hosted version of DotaPuff, see:

http://derekcormier.ca/dotapuff

![Screenshot](https://raw.github.com/kormide/dotapuff/master/public/img/screenshot.png)
