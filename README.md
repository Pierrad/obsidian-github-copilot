# Obsidian Github Copilot Plugin

Use Github Copilot in the Obsidian editor. This plugin is a bridge between the Obsidian editor and the Github Copilot service.

![https://github.com/Pierrad/obsidian-github-copilot/tree/master/.github/assets/example.gif](https://github.com/Pierrad/obsidian-github-copilot/blob/master/.github/assets/example.gif)

## Requirements

- A Github Copilot subscription (https://copilot.github.com/)
- Node.js 18 or later

## Installation

1. Install the plugin via the Obsidian community plugins browser.
2. Go to the plugin settings and enter the path to the Node +18 binary. You can find it by running `which node` in your terminal.
3. Enable Copilot in the plugin settings.
4. Either
   1. A modal will appear asking you to sign in to Copilot. Follow the instructions to sign in.
   2. Or, you will receive a notice saying that Copilot is ready to use. (This will happen if you have already signed in to Copilot in the past in IDEs)

> [!NOTE]  
> If you install the plugin by cloning it or downloading the release files from Github, you will need to name the plugin folder `github-copilot` for the plugin to work.


## Usage

1. Open a note in Obsidian. 
2. Write something in the editor.
3. After a small pause, Copilot will suggest completions for your text.
4. Press `Tab` to accept a suggestion or `Esc` to dismiss it.

## Features

- [x] Use Copilot in the Obsidian editor
- [x] Enable/Disable Copilot in the bottom status ba
- [x] Sign-In process to Copilot
