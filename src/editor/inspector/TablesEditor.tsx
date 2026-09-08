/**
 * The database table editor: tables holding rows of named cells, for the
 * player's SQL to query. Columns are free-form — whatever the quest needs —
 * so this is a small spreadsheet, not the fixed-shape list editor.
 *
 * Cells are always stored as strings: a value like "0049" is a phone prefix,
 * not a number, and guessing wrong corrupts it. The schema also accepts real
 * numbers for hand-written JSON; those display as-is and stay numbers until
 * the author edits the cell.
 */
import { nanoid } from "nanoid";
import { Icon } from "@/components/Icon";
import { TextInput } from "./primitives";

export interface DbTable {
    id: string;
    name: string;
    rows: Record<string, string | number>[];
}

function asTable(item: unknown): DbTable {
    const row = (item ?? {}) as { id?: unknown; name?: unknown; rows?: unknown };
    const rows = Array.isArray(row.rows)
        ? row.rows.map((r) => {
              const cells: Record<string, string | number> = {};
              if (r && typeof r === "object") {
                  for (const [k, v] of Object.entries(r as Record<string, unknown>)) {
                      if (typeof v === "number") cells[k] = v;
                      else if (v !== undefined && v !== null) cells[k] = String(v);
                  }
              }
              return cells;
          })
        : [];
    return {
        id: typeof row.id === "string" ? row.id : nanoid(8),
        name: typeof row.name === "string" ? row.name : "",
        rows,
    };
}

/** Column names in first-seen order across every row. */
function columnsOf(rows: Record<string, string | number>[]): string[] {
    const cols: string[] = [];
    for (const row of rows) {
        for (const key of Object.keys(row)) {
            if (!cols.includes(key)) cols.push(key);
        }
    }
    return cols;
}

export function TablesEditor({
    value,
    onChange,
}: {
    value: Record<string, unknown>[];
    onChange: (next: DbTable[]) => void;
}) {
    const tables = value.map(asTable);
    const write = (next: DbTable[]) => onChange(next);
    const patchTable = (index: number, patch: Partial<DbTable>) =>
        write(tables.map((t, i) => (i === index ? { ...t, ...patch } : t)));

    return (
        <div className="space-y-2">
            {tables.length === 0 && (
                <p className="rounded-md border border-dashed border-line px-3 py-2.5 text-center text-[11px] text-ink-4">
                    No tables yet — the database would be empty.
                </p>
            )}
            {tables.map((table, ti) => {
                const cols = columnsOf(table.rows);
                const title = table.name.trim() || `Table ${ti + 1}`;
                return (
                    <div key={table.id} className="overflow-hidden rounded-md border border-line bg-surface-2/40">
                        <div className="flex items-center gap-1 px-1.5 py-1">
                            <div className="min-w-0 flex-1">
                                <TextInput
                                    ariaLabel={`Name of table ${ti + 1}`}
                                    value={table.name}
                                    onChange={(name) => patchTable(ti, { name })}
                                    placeholder="employees"
                                    mono
                                />
                            </div>
                            <button
                                type="button"
                                className="btn-icon size-5 shrink-0 text-ink-4 hover:text-danger"
                                onClick={() => write(tables.filter((_, i) => i !== ti))}
                                title={`Remove ${title}`}
                                aria-label={`Remove ${title}`}
                            >
                                <Icon name="trash" size={11} />
                            </button>
                        </div>
                        {!table.name.trim() && (
                            <p className="px-2 pb-1 text-[10.5px] text-warn">
                                This table has no name, so the game will skip it.
                            </p>
                        )}
                        <div className="overflow-x-auto px-1.5 pb-1.5">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        {cols.map((col) => (
                                            <th key={col} className="min-w-24 p-0.5 align-bottom">
                                                <span className="flex items-center gap-0.5">
                                                    <TextInput
                                                        ariaLabel={`Column name, was ${col}, in ${title}`}
                                                        value={col}
                                                        onChange={(next) => {
                                                            const renamed = next.trim();
                                                            if (!renamed || renamed === col) return;
                                                            patchTable(ti, {
                                                                rows: table.rows.map((row) => {
                                                                    const { [col]: v, ...rest } = row;
                                                                    return { ...rest, [renamed]: v ?? "" };
                                                                }),
                                                            });
                                                        }}
                                                        mono
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn-icon size-5 shrink-0 text-ink-4 hover:text-danger"
                                                        onClick={() =>
                                                            patchTable(ti, {
                                                                rows: table.rows.map((row) => {
                                                                    const next = { ...row };
                                                                    delete next[col];
                                                                    return next;
                                                                }),
                                                            })
                                                        }
                                                        title={`Remove column ${col}`}
                                                        aria-label={`Remove column ${col} from ${title}`}
                                                    >
                                                        <Icon name="x" size={10} />
                                                    </button>
                                                </span>
                                            </th>
                                        ))}
                                        <th className="w-6 p-0.5" aria-label="Row actions" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {table.rows.map((row, ri) => (
                                        <tr key={ri}>
                                            {cols.map((col) => (
                                                <td key={col} className="p-0.5">
                                                    <TextInput
                                                        ariaLabel={`${col}, row ${ri + 1} of ${title}`}
                                                        value={String(row[col] ?? "")}
                                                        onChange={(cell) =>
                                                            patchTable(ti, {
                                                                rows: table.rows.map((r, i) =>
                                                                    i === ri ? { ...r, [col]: cell } : r,
                                                                ),
                                                            })
                                                        }
                                                    />
                                                </td>
                                            ))}
                                            <td className="p-0.5 text-center">
                                                <button
                                                    type="button"
                                                    className="btn-icon size-5 text-ink-4 hover:text-danger"
                                                    onClick={() =>
                                                        patchTable(ti, {
                                                            rows: table.rows.filter((_, i) => i !== ri),
                                                        })
                                                    }
                                                    title={`Remove row ${ri + 1}`}
                                                    aria-label={`Remove row ${ri + 1} from ${title}`}
                                                >
                                                    <Icon name="x" size={10} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {table.rows.length === 0 && (
                                <p className="px-1 py-1 text-[10.5px] text-ink-4">
                                    No rows yet.
                                </p>
                            )}
                            <span className="flex gap-1 px-0.5 pt-1">
                                <button
                                    type="button"
                                    className="btn-default px-2 py-1 text-[11px]"
                                    onClick={() => {
                                        let n = cols.length + 1;
                                        let name = `column${n}`;
                                        while (cols.includes(name)) {
                                            n += 1;
                                            name = `column${n}`;
                                        }
                                        patchTable(ti, {
                                            rows: table.rows.map((row) => ({ ...row, [name]: "" })),
                                            ...(table.rows.length === 0
                                                ? { rows: [{ [name]: "" }] }
                                                : {}),
                                        });
                                    }}
                                    aria-label={`Add column to ${title}`}
                                >
                                    + Column
                                </button>
                                <button
                                    type="button"
                                    className="btn-default px-2 py-1 text-[11px]"
                                    onClick={() =>
                                        patchTable(ti, {
                                            rows: [...table.rows, Object.fromEntries(cols.map((c) => [c, ""]))],
                                        })
                                    }
                                    disabled={cols.length === 0}
                                    title={cols.length === 0 ? "Add a column first" : undefined}
                                    aria-label={`Add row to ${title}`}
                                >
                                    + Row
                                </button>
                            </span>
                        </div>
                    </div>
                );
            })}
            <button
                type="button"
                className="btn-default w-full px-2 py-1.5 text-[11.5px]"
                onClick={() => write([...tables, { id: nanoid(8), name: "", rows: [] }])}
            >
                + Add table
            </button>
        </div>
    );
}
