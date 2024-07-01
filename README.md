# vscode-stan-extension

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/wardbrian.vscode-stan-extension?label=Visual%20Studio%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=wardbrian.vscode-stan-extension)
[![Open VSX Version](https://img.shields.io/open-vsx/v/wardbrian/vscode-stan-extension)](https://open-vsx.org/extension/wardbrian/vscode-stan-extension)
[![build & publish](https://github.com/WardBrian/vscode-stan-extension/actions/workflows/release.yaml/badge.svg?branch=main)](https://github.com/WardBrian/vscode-stan-extension/actions/workflows/release.yaml)

This package adds syntax highlighting, code folding, formatting, linting, code suggestions,
and snippets for [Stan](https://mc-stan.org) files in [Visual Studio Code](https://code.visualstudio.com/).

## Features

### Syntax highlighting

![Syntax highlighting example](./img/highlight-example.png)

### Linting

![Linting example](./img/linting-example.png)

### Automatic formatting

![Formatting example](./img/formatting.gif)

### Snippets and code completion

![Snippet example](./img/snippets.gif)

### Hover information

![Hover example](./img/hover-example.png)

### Code Folding

![code-folding](./img/code-folding.gif)


## Installation

```
code --install-extension wardbrian.vscode-stan-extension
```

or find and install it from the Extensions view.

Locally:

```
npm i
npm run build
code --install-extension ./vscode-stan-extension.0.5.0.vsix # change version as necessary
```

## Credits

This is a fork of the original [stan-vscode by ivan-bocharov](https://github.com/ivan-bocharov/stan-vscode).

The grammar was originally converted from the [atom-language-stan](https://github.com/jrnold/atom-language-stan) Stan package. The grammar has since been updated to support Stan v2.35.
