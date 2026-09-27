import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Simple "Previous · Page x of y · Next" bar for server-paged tables.
export function Pager({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (p: number) => void }) {
  if (total === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border/50 text-sm">
      <span className="text-muted-foreground">{total} in total</span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft className="h-4 w-4 mr-1" />Previous</Button>
        <span className="text-xs text-muted-foreground whitespace-nowrap">Page {page} of {pages}</span>
        <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next<ChevronRight className="h-4 w-4 ml-1" /></Button>
      </div>
    </div>
  );
}
