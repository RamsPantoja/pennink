import * as React from "react"
import { useTranslations } from "next-intl"
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"

type ListSearchProps = {
  placeholder: string
  onSearch: (term: string | undefined) => void
}

/** Title search for a list. The term is applied on Enter or the search button, and clearing it removes the filter. */
export function ListSearch({ placeholder, onSearch }: ListSearchProps) {
  const t = useTranslations("ListSearch")
  const [value, setValue] = React.useState("")

  const submit = () => onSearch(value.trim() || undefined)

  const clear = () => {
    setValue("")
    onSearch(undefined)
  }

  return (
    <div className="flex w-full max-w-md items-center gap-2">
      <Input
        type="text"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        className="flex-1"
        onChange={(event) => {
          setValue(event.target.value)
          if (event.target.value === "") onSearch(undefined)
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit()
        }}
      />
      <Button
        variant="outline"
        size="icon"
        aria-label={t("submit")}
        disabled={!value.trim()}
        onClick={submit}
      >
        <MagnifyingGlassIcon />
      </Button>
      {value && (
        <Button variant="ghost" size="icon" aria-label={t("clear")} onClick={clear}>
          <XMarkIcon />
        </Button>
      )}
    </div>
  )
}
