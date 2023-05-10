# Browserup Command Line Console. 

It can be run by running ./console in this folder.

The CLI console allows you to watch a Load Testing Run started with the browserup CLI.


## Modifying the CLI console:

If you want to work with it, you can also run the non-self contained version by 
running:  

npm install --no-optional

node index.js


## Generating the Cross-platform Self-contained CLI console

A single, self-contained binary can be created using [nexe](https://github.com/nexe/nexe):  

There are other tools, however nexe seems to be the only I have found that doesn't need
an executable per-platform.

npm install -g nexe

nexe index.js

This will generate a file at ./console

Using node 8 will get you a 40 meg file.
Using node 10 will get you a 50 meg file that does the same thing.

## Understanding Index.js

This app is primarily written using blessed-contrib, which you can see here:

[Blessed contrib] (https://github.com/yaronn/blessed-contrib), interestingly, was used by HP to create Trueload
 a [LoadRunner/StormRunner dashboard](https://github.com/yaronn/truload), which is great for inspiration, and probably why it has so many 
 widgets that are good for us.
 
Blessed-contrib builds our dashboard using a 24x24 grid into which containing object are placed.

[Blessed](https://github.com/chjj/blessed) Itself, which is the foundation of blessed-contrib, offers dialogs, widgets, windows and other items. 
We can use anything in blessed in our project.

To see all this, look in index.js.


## Competitors
[Taurus](http://gettaurus.org/kb/JMeter1/), is a competitor to reference for inspiration. 


