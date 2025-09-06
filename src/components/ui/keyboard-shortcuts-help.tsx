import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import { Button } from './button';
import { Badge } from './badge';
import { Separator } from './separator';
import { Keyboard, HelpCircle } from 'lucide-react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  category?: string;
}

interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[];
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({ 
  shortcuts, 
  trigger,
  open,
  onOpenChange 
}: KeyboardShortcutsHelpProps) {
  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  const formatKeys = (shortcut: KeyboardShortcut) => {
    const keys = [];
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
    if (shortcut.ctrlKey) keys.push(isMac ? '⌘' : 'Ctrl');
    if (shortcut.metaKey) keys.push('⌘');
    if (shortcut.shiftKey) keys.push('⇧');
    if (shortcut.altKey) keys.push(isMac ? '⌥' : 'Alt');
    
    let key = shortcut.key;
    if (key === ' ') key = 'Space';
    if (key === 'ArrowUp') key = '↑';
    if (key === 'ArrowDown') key = '↓';
    if (key === 'ArrowLeft') key = '←';
    if (key === 'ArrowRight') key = '→';
    if (key === 'Enter') key = '↵';
    if (key === 'Escape') key = 'Esc';
    
    keys.push(key);
    
    return keys.join(' + ');
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Keyboard className="w-4 h-4 mr-2" />
      Shortcuts
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and interact with TribeUp more efficiently.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <Badge 
                      variant="secondary" 
                      className="font-mono text-xs bg-background border"
                    >
                      {formatKeys(shortcut)}
                    </Badge>
                  </div>
                ))}
              </div>
              {Object.keys(groupedShortcuts).indexOf(category) < Object.keys(groupedShortcuts).length - 1 && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            Press <Badge variant="outline" className="font-mono mx-1">Esc</Badge> to close
          </div>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to use keyboard shortcuts help
export function useKeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = React.useState(false);

  const showHelp = () => setIsOpen(true);
  const hideHelp = () => setIsOpen(false);

  return {
    isOpen,
    showHelp,
    hideHelp,
    setIsOpen
  };
}