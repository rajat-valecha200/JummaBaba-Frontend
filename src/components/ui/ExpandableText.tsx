import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CLAMP_CLASSES: Record<number, string> = {
  1: 'line-clamp-1',
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
  5: 'line-clamp-5',
};

interface ExpandableTextProps {
  /** Plain text content. Ignored if `html` is provided. */
  text?: string | null;
  /** Rich HTML content (rendered via dangerouslySetInnerHTML), for fields like product descriptions. */
  html?: string | null;
  /** How many lines to show before offering "View More". Defaults to 3. */
  lines?: number;
  /** Character count (of the plain-text-stripped content) above which truncation kicks in. */
  charLimit?: number;
  className?: string;
  textClassName?: string;
  /** Dialog title shown when expanded. */
  title?: string;
  emptyFallback?: string;
}

export function ExpandableText({
  text,
  html,
  lines = 3,
  charLimit = 220,
  className,
  textClassName,
  title = 'Full Details',
  emptyFallback,
}: ExpandableTextProps) {
  const [open, setOpen] = useState(false);

  const plainLength = useMemo(() => {
    if (html) return html.replace(/<[^>]*>/g, '').trim().length;
    return (text || '').length;
  }, [html, text]);

  const content = html ?? text;
  if (!content) {
    return emptyFallback ? <p className={cn('text-muted-foreground italic', textClassName)}>{emptyFallback}</p> : null;
  }

  const isOverflowing = plainLength > charLimit;
  const clampClass = CLAMP_CLASSES[lines] || CLAMP_CLASSES[3];

  return (
    <>
      <div className={className}>
        {html ? (
          <div
            className={cn('prose prose-sm prose-slate max-w-none', isOverflowing && clampClass, textClassName)}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <p className={cn(isOverflowing && clampClass, textClassName)}>{text}</p>
        )}
        {isOverflowing && (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="px-0 h-auto mt-1 text-primary font-bold text-xs"
            onClick={() => setOpen(true)}
          >
            View More
          </Button>
        )}
      </div>

      {isOverflowing && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            {html ? (
              <div className={cn('prose prose-sm prose-slate max-w-none', textClassName)} dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">{text}</p>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
