
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "feel-lucky" is now active!');

    let lastSelectedUri: vscode.Uri | undefined;

    let disposable = vscode.commands.registerCommand('feel-lucky.openRandomFile', async (uri: vscode.Uri) => {
        let targetUri = uri;
        let isFolder = false;

        if (targetUri) {
            try {
                const stat = await vscode.workspace.fs.stat(targetUri);
                if (stat.type === vscode.FileType.Directory) {
                    isFolder = true;
                }
            } catch (e) {
                // Ignore error, treat as not a folder
            }
        }

        if (isFolder) {
            // Context menu execution (or shortcut on folder): update the last selected URI
            lastSelectedUri = targetUri;
        } else {
            // Shortcut execution (on file or global): try to use the last selected URI
            if (lastSelectedUri) {
                targetUri = lastSelectedUri;
            } else {
                // No history: ask user to select a folder
                const options: vscode.OpenDialogOptions = {
                    canSelectMany: false,
                    openLabel: 'Select Folder',
                    canSelectFiles: false,
                    canSelectFolders: true
                };

                const fileUri = await vscode.window.showOpenDialog(options);
                if (fileUri && fileUri[0]) {
                    targetUri = fileUri[0];
                    lastSelectedUri = targetUri; // Remember this selection too
                } else {
                    return; // User cancelled
                }
            }
        }

        try {
            const files = await getAllFiles(targetUri);
            if (files.length === 0) {
                vscode.window.showInformationMessage('No files found in this folder.');
                return;
            }

            const randomFile = files[Math.floor(Math.random() * files.length)];
            const doc = await vscode.workspace.openTextDocument(randomFile);
            await vscode.window.showTextDocument(doc);
        } catch (error) {
            vscode.window.showErrorMessage(`Error opening random file: ${error} `);
        }
    });

    context.subscriptions.push(disposable);
}

async function getAllFiles(folderUri: vscode.Uri): Promise<vscode.Uri[]> {
    const files: vscode.Uri[] = [];
    const ignoreList = ['.git', 'node_modules', '.DS_Store', 'out', 'dist'];

    async function recurse(currentUri: vscode.Uri) {
        const entries = await vscode.workspace.fs.readDirectory(currentUri);

        for (const [name, type] of entries) {
            if (ignoreList.includes(name)) {
                continue;
            }

            const entryUri = vscode.Uri.joinPath(currentUri, name);

            if (type === vscode.FileType.File) {
                files.push(entryUri);
            } else if (type === vscode.FileType.Directory) {
                await recurse(entryUri);
            }
        }
    }

    await recurse(folderUri);
    return files;
}

export function deactivate() { }
