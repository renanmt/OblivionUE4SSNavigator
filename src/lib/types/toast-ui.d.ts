declare module '@toast-ui/editor' {
    interface EditorOptions {
        el: HTMLElement;
        height?: string;
        initialValue?: string;
        previewStyle?: 'tab' | 'vertical';
        initialEditType?: 'markdown' | 'wysiwyg';
        theme?: string;
        toolbarItems?: string[][];
    }

    export default class Editor {
        constructor(options: EditorOptions);
        getMarkdown(): string;
        getHTML(): string;
        destroy(): void;
    }
} 