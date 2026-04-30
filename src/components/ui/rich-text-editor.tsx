import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Type,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  placeholder,
  className 
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync state to editor when value changes externally (e.g. loading for edit)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value && !isFocused) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value, isFocused]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  return (
    <div className={cn(
      "flex flex-col border rounded-3xl overflow-hidden transition-all duration-300 bg-white",
      isFocused ? "border-primary ring-2 ring-primary/10" : "border-slate-200",
      isFullscreen ? "fixed inset-4 z-[100] shadow-2xl" : "relative",
      className
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-slate-100 bg-slate-50/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => execCommand('bold')}
            className="h-9 w-9 p-0 rounded-xl hover:bg-white hover:shadow-sm"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => execCommand('italic')}
            className="h-9 w-9 p-0 rounded-xl hover:bg-white hover:shadow-sm"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <div className="w-[1px] h-4 bg-slate-200 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => execCommand('insertUnorderedList')}
            className="h-9 w-9 p-0 rounded-xl hover:bg-white hover:shadow-sm"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => execCommand('insertOrderedList')}
            className="h-9 w-9 p-0 rounded-xl hover:bg-white hover:shadow-sm"
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="h-9 w-9 p-0 rounded-xl hover:bg-white hover:shadow-sm text-slate-400"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Editor Surface */}
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "flex-1 p-6 min-h-[250px] outline-none prose prose-slate max-w-none text-slate-900 font-medium overflow-y-auto",
          "editor-content",
          isFullscreen ? "h-full" : ""
        )}
        style={{ scrollbarWidth: 'thin' }}
      />
      
      <style dangerouslySetInnerHTML={{ __html: `
        .editor-content ul { list-style-type: disc !important; padding-left: 1.5rem !important; margin-bottom: 1rem !important; }
        .editor-content ol { list-style-type: decimal !important; padding-left: 1.5rem !important; margin-bottom: 1rem !important; }
        .editor-content li { margin-bottom: 0.25rem !important; }
        .editor-content h3 { font-size: 1.25rem !important; font-weight: 800 !important; margin-top: 1.5rem !important; margin-bottom: 0.75rem !important; color: #0f172a !important; }
        .editor-content [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
      `}} />
      
      {!value && !isFocused && (
        <div className="absolute top-[72px] left-6 text-slate-400 pointer-events-none text-sm font-medium">
          {placeholder || "Enter detailed specifications..."}
        </div>
      )}
    </div>
  );
};
