# ChatGPT Chrome Extension

A Chrome extension that allows you to quickly search ChatGPT directly from your browser's address bar. Simply type `c your question` and the extension will open ChatGPT, auto-fill your prompt, and submit it automatically.

## Features

- 🚀 **Quick Access**: Type `c` followed by your question in the Chrome address bar
- ✨ **Auto-fill**: Automatically populates your question in ChatGPT
- 🔄 **Auto-submit**: Automatically sends your message to ChatGPT
- 🎯 **Smart Detection**: Works with the current ChatGPT interface
- 📋 **Fallback Support**: Copies to clipboard if auto-fill fails

## Installation

### Method 1: Load Unpacked (Development)

1. **Download the extension files**:
   - `manifest.json`
   - `background.js`

2. **Create a folder** for the extension (e.g., `chatgpt-extension/`)

3. **Place both files** in the folder

4. **Open Chrome Extensions**:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)

5. **Load the extension**:
   - Click "Load unpacked"
   - Select your extension folder

6. **Verify installation**:
   - You should see "ChatGPT (type `c <query>`)" in your extensions list

### Method 2: Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store for easy installation.

## How to Use

1. **Click the address bar** (omnibox) in Chrome

2. **Type your command**:
   ```
   c your question here
   ```
   For example:
   ```
   c What is the capital of France?
   c How do I make a chocolate cake?
   c Explain quantum physics in simple terms
   ```

3. **Press Enter**

4. **Watch the magic happen**:
   - Chrome will navigate to ChatGPT
   - Your question will be automatically filled in
   - The message will be sent automatically

## Examples

| Command | What it does |
|---------|-------------|
| `c Hello ChatGPT` | Opens ChatGPT and sends "Hello ChatGPT" |
| `c What is 2+2?` | Opens ChatGPT and asks "What is 2+2?" |
| `c` | Opens ChatGPT with a default greeting |

## Troubleshooting

### Extension not working?

1. **Check if you're logged in**: Make sure you're logged into ChatGPT at chatgpt.com
2. **Reload the extension**: Go to `chrome://extensions/` and click the refresh button on your extension
3. **Check console logs**: Open DevTools (F12) and look for debug messages in the Console tab
4. **Try a simple query**: Start with `c Hello` to test basic functionality

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License.
