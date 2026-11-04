import * as React from "react"
import { useTranslations } from "next-intl"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "cn"
import { Button } from "~/components/ui/button"

type PaginationProps = {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  className?: string
}

type PageItem = { kind: "page"; page: number } | { kind: "ellipsis"; after: number }

/** Page numbers to show: the first and last page, plus a window around the current page. */
export function getPageItems(page: number, totalPages: number): PageItem[] {
  const items: PageItem[] = []
  for (let p = 1; p <= totalPages; p++) {
    const isEdge = p === 1 || p === totalPages
    const isNearCurrent = Math.abs(p - page) <= 1
    if (isEdge || isNearCurrent) {
      items.push({ kind: "page", page: p })
    } else if (items[items.length - 1]?.kind !== "ellipsis") {
      items.push({ kind: "ellipsis", after: p - 1 })
    }
  }
  return items
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  className,
}: PaginationProps) {
  const t = useTranslations("Pagination")

  // If the current page no longer exists (e.g. the last item on it was deleted), move back.
  React.useEffect(() => {
    if (page > totalPages) onPageChange(totalPages)
  }, [page, totalPages, onPageChange])

  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <nav
      aria-label={t("navigation")}
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground",
        className
      )}
    >
      <span>{t("range", { from, to, total })}</span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label={t("previous")}
        >
          <ChevronLeft />
        </Button>
        {getPageItems(page, totalPages).map((item) =>
          item.kind === "ellipsis" ? (
            <span key={`ellipsis-${item.after}`} className="px-1" aria-hidden>
              …
            </span>
          ) : (
            <Button
              key={item.page}
              variant={item.page === page ? "secondary" : "ghost"}
              size="icon-sm"
              aria-current={item.page === page ? "page" : undefined}
              aria-label={t("goToPage", { page: item.page })}
              onClick={() => onPageChange(item.page)}
            >
              {item.page}
            </Button>
          )
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label={t("next")}
        >
          <ChevronRight />
        </Button>
      </div>
    </nav>
  )
}
