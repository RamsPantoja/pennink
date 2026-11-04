import { describe, expect, it, vi } from "vitest";
import { DEFAULT_PAGE_SIZE, pageInputSchema, paginate } from "../pagination";

describe("pageInputSchema", () => {
  it("defaults to the first page with the default page size", () => {
    expect(pageInputSchema.parse({})).toEqual({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });
  });

  it("rejects pages below 1 and page sizes above the maximum", () => {
    expect(pageInputSchema.safeParse({ page: 0 }).success).toBe(false);
    expect(pageInputSchema.safeParse({ pageSize: 51 }).success).toBe(false);
  });
});

describe("paginate", () => {
  it("passes the offset for the requested page and returns the total", async () => {
    const fetchRows = vi.fn(async () => ["c", "d"]);
    const countRows = vi.fn(async () => 6);

    const result = await paginate(
      { page: 2, pageSize: 2 },
      fetchRows,
      countRows,
    );

    expect(fetchRows).toHaveBeenCalledWith({ limit: 2, offset: 2 });
    expect(result).toEqual({
      items: ["c", "d"],
      total: 6,
      page: 2,
      pageSize: 2,
      totalPages: 3,
    });
  });

  it("reports one page when there are no rows", async () => {
    const result = await paginate(
      { page: 1, pageSize: 10 },
      async () => [],
      async () => 0,
    );

    expect(result).toEqual({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });
  });

  it("returns no items for a page past the end but keeps the total", async () => {
    const result = await paginate(
      { page: 5, pageSize: 10 },
      async () => [],
      async () => 12,
    );

    expect(result).toMatchObject({ items: [], total: 12, totalPages: 2 });
  });
});
