import { Monaco } from '@monaco-editor/react';
import { getProject } from '../projects_manager/manageEnv';
import { instructions } from '../interpreter/instructions';

// Helper to convert comma-separated hex string to a visual text grid
function getSpritePreview(dataStr: string): string {
  try {
    const bytes = dataStr
      .split(',')
      .map(x => parseInt(x.trim(), 16))
      .filter(x => !isNaN(x));

    if (bytes.length === 0) return 'Empty sprite';

    return bytes
      .map(byte => {
        let row = '';
        for (let bit = 7; bit >= 0; bit--) {
          row += (byte & (1 << bit)) ? '█' : '░';
        }
        return row;
      })
      .join('\n');
  } catch {
    return 'Invalid sprite data';
  }
}

export function registerChip8Language(monaco: Monaco) {
  // Prevent duplicate registration
  if (monaco.languages.getLanguages().some((lang) => lang.id === 'chip8')) {
    return;
  }

  // 1. Register Language
  monaco.languages.register({ id: 'chip8' });

  // 2. Syntax Highlighting
  monaco.languages.setMonarchTokensProvider('chip8', {
    ignoreCase: true,
    keywords: Object.keys(instructions),
    tokenizer: {
      root: [
        [/[a-zA-Z_]\w*:/, 'type.identifier'], // labels
        [/[a-zA-Z_]\w*/, {
          cases: {
            '@keywords': 'keyword',
            '@default': 'identifier'
          }
        }],
        [/\b(V[0-9A-Fa-f]|I|DT|ST|K|F|\[I\])\b/i, 'variable.predefined'],
        [/0x[0-9A-Fa-f]+/, 'number.hex'],
        [/\b[0-9]+\b/, 'number'],
        [/;.*$/, 'comment'],
        [/project\.sprites\.\w*/, 'string'],
      ]
    }
  });

  // 3. IntelliSense suggestions
  monaco.languages.registerCompletionItemProvider('chip8', {
    triggerCharacters: ['.'],
    provideCompletionItems: (model, position) => {
      const lineContent = model.getLineContent(position.lineNumber);
      const textBeforeCursor = lineContent.substring(0, position.column - 1);
      
      // Get the word under the cursor to allow precise replacement
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      const suggestions: any[] = [];

      // Dynamic Active Project ID resolution
      const getActiveProjectId = () => {
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          return params.get('projectId') || localStorage.getItem('chip8_last_project') || '123';
        }
        return '123';
      };

      // Match dot-access paths like "project." or "project.sprites." with optional partial word typed
      const pathMatch = textBeforeCursor.match(/(project(?:\.\w+)*)\.(\w*)$/);

      if (pathMatch) {
        const pathPrefix = pathMatch[1]; // e.g. "project" or "project.sprites"

        if (pathPrefix === 'project') {
          // Suggest ONLY "sprites" when accessing project
          suggestions.push({
            label: 'sprites',
            kind: monaco.languages.CompletionItemKind.Folder,
            insertText: 'sprites.',
            range: range,
            detail: 'Project Sprites Directory'
          });
        } else if (pathPrefix === 'project.sprites') {
          // Suggest ONLY sprite names when accessing project.sprites
          const project = getProject(getActiveProjectId());
          if (project?.sprites) {
            Object.entries(project.sprites).forEach(([name, sprite]) => {
              const previewGrid = getSpritePreview(sprite.data);
              suggestions.push({
                label: name,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: name,
                range: range,
                detail: `Sprite: ${name}`,
                documentation: {
                  value: `**Description:** ${sprite.description || 'None'}\n\n**Visual Preview:**\n\`\`\`text\n${previewGrid}\n\`\`\``
                }
              });
            });
          }
        }

        // Return early so we don't display unrelated opcodes/registers when matching namespace paths
        return { suggestions };
      }

      // Default suggestions when not accessing a namespace path:
      
      // 3c. Default Instruction suggestions
      Object.entries(instructions).forEach(([opcode, variants]) => {
        variants.forEach(variant => {
          const snippetArgs = variant.argsLayout.map((arg, idx) => {
            const placeholder = idx + 1;
            if (arg === 'X') return `\${${placeholder}:V0}`;
            if (arg === 'Y') return `\${${placeholder}:V1}`;
            if (arg === 'NNN') return `\${${placeholder}:addr}`;
            if (arg === 'NN') return `\${${placeholder}:val}`;
            if (arg === 'N') return `\${${placeholder}:height}`;
            if (arg === 'I_VAL') return '[I]';
            if (arg === 'NUMBER*') return `\${${placeholder}:val}`;
            return arg;
          });

          const hasArgs = snippetArgs.length > 0;
          suggestions.push({
            label: opcode,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: hasArgs ? `${opcode} ${snippetArgs.join(', ')};` : `${opcode};`,
            insertTextRules: hasArgs ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
            range: range,
            detail: variant.helper,
            documentation: variant.helper
          });
        });
      });

      // 3d. Predefined Registers
      for (let i = 0; i < 16; i++) {
        const reg = `V${i.toString(16).toUpperCase()}`;
        suggestions.push({
          label: reg,
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: reg,
          range: range,
          detail: `General purpose register ${reg}`
        });
      }

      // 3e. Root Project Object
      suggestions.push({
        label: 'project',
        kind: monaco.languages.CompletionItemKind.Module,
        insertText: 'project.',
        range: range,
        detail: 'Access active project resources'
      });

      return { suggestions };
    }
  });
}
