# This is the Novelty Vizualization with Planimation plugin

This folder contains the plugin for http://editor.planning.domains.

Once the plugin installed, the NovetlyVizPlanimation button will display at the top of banner.

This plugin imitates the tree generation method of the Heuristic Visualization plugin, therefore it is not recommended to load it simultaneously with the Heuristic Visualization plugin to avoid unnecessary conflicts.

Overly complex calculations will block the UI thread, leading to webpage crashes. It is recommended that users test with simpler problems as much as possible.


## Functionality
 - Visualising a search tree node when it is clicked. 
 - The novelty value can be clicked automaticly once the tree node is clicked
 - Novelty table shows at the following of the search tree.


## How to use this plugin

1. Go to http://editor.planning.domains
2. Start a local server by using the command: python3 -m http.server [port]
3. Located to your NoveltyVizPlugin.js file, and get the address
4. Input your NoveltyVizPlugin.js file local address, and click install plugin
5. Wait the Novelty Vizualization plugin is fully loaded
6. Upload Domain, Problem, and Animation PDDL to build and animate the search tree

Any feedback, bug reports, comments, questions, or concerns can be sent to [Nir Lipovetzky], or the [issues tracker](https://github.com/planimation/plugins/issues).

[Nir Lipovetzky]:<mailto:nir.lipovetzky@unimelb.edu.au>
