# Obsidian Github Copilot Plugin

![Obsidian plugin](https://img.shields.io/endpoint?url=https://scambier.xyz/obsidian-endpoints/github-copilot.json)
![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/pierrad/obsidian-github-copilot)

Use Github Copilot in the Obsidian editor. This plugin is a bridge between the Obsidian editor and the Github Copilot service.

![https://github.com/Pierrad/obsidian-github-copilot/tree/master/.github/assets/example.gif](https://github.com/Pierrad/obsidian-github-copilot/blob/master/.github/assets/example.gif)

## Requirements

- A Github Copilot subscription (https://copilot.github.com/)
- Node.js 18 or later
- Network connection to send and receive data from the Github Copilot service

## Installation

1. Install the plugin via the Obsidian community plugins browser.
2. Go to the plugin settings and enter the path to the Node +18 binary. You can find it by running `which node` in your terminal.
3. Either
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

- [x] Use Github Copilot in the Obsidian editor
- [x] Configure the suggestion generation delay
- [x] Configure your bindings to accept, dismiss, trigger or partially accept suggestions
- [x] Configure if you want to see automatic suggestions or only trigger them manually
- [x] Configure if you want to see suggestion only in code blocks or in the whole note 
- [x] Exclude folders and files from the suggestion generation 

## Known issues

- If you installed Obsidian with Flatpak, you might need to use NVM to handle Node.js versions as the default binary path is not accessible in the Flatpak sandbox. See [this issue](https://github.com/Pierrad/obsidian-github-copilot/issues/6) for more information.
- "Tab" completion can be buggy in some cases (e.g. in bullet points in LateX Math mode for example). It depends on plugin priority over the keybindings. See [this issue](https://github.com/Pierrad/obsidian-github-copilot/issues/38) for more information. 


# TODO

- [x] Add a setting to configure a system prompt to use with the chat
- [x] Remember the last model used
- [x] Find a way to remember chats between sessions
- [ ] Find a way to link the current note to the chat
- [ ] Stream the response from the API
- [ ] Let the user choose between enter a new line or send the message