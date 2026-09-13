/**
 * The database table editor: a small spreadsheet over tables → rows → named
 * cells, writing exactly the shape the compiler's database test pins.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Field } from "@/editor/inspector/Field";
import { makeNode } from "@/templates/kit";
import { createProject, createQuest } from "@/schema/project";
import { nodeTypeDef } from "@/schema/registry";
import { useEditor } from "@/store/editor";

function loadWith(nodes: ReturnType<typeof makeNode>[]) {
    const quest = createQuest({
        id: "q-db",
        name: "Db",
        closingObjectiveText: "done",
        title: "Db",
        autoStart: true,
        description: "db",
        rewards: { money: 0, xp: 0 },
    });
    quest.graph = { nodes, edges: [] };
    const project = createProject({
        mod: { id: "db-mod", name: "Db", version: "1.0.0", author: "", description: "db", tags: [], dependencies: [], minSdkVersion: "0.21.0", apiVersion: 1 },
        quests: [quest],
        websites: [],
    });
    act(() => {
        useEditor.getState().load(project, { clearHistory: true });
        useEditor.getState().setActiveQuest(project.quests[0].id);
    });
}

interface StoredTable {
    id: string;
    name: string;
    rows: Record<string, string | number>[];
}

function storedTables(nodeId: string): StoredTable[] {
    const node = useEditor
        .getState()
        .project.quests[0].graph.nodes.find((n) => n.id === nodeId);
    return (node!.data as { tables: StoredTable[] }).tables;
}

const tablesDef = nodeTypeDef("world.database").fields.find((f) => "key" in f && f.key === "tables")!;

const seed = () =>
    makeNode("world.database", { x: 0, y: 0 }, {
        host: "db.example.com",
        tables: [
            { id: "t1", name: "employees", rows: [{ name: "A. Ritter", role: "compliance" }] },
        ],
    });

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("database table editor", () => {
    it("shows stored tables with their rows and cells", () => {
        const db = seed();
        loadWith([db]);
        render(<Field def={tablesDef} nodeId={db.id} />);
        expect((screen.getByLabelText("Name of table 1") as HTMLInputElement).value).toBe("employees");
        expect((screen.getByLabelText("name, row 1 of employees") as HTMLInputElement).value).toBe("A. Ritter");
        expect((screen.getByLabelText("role, row 1 of employees") as HTMLInputElement).value).toBe("compliance");
    });

    it("writes cell edits back as strings", () => {
        const db = seed();
        loadWith([db]);
        render(<Field def={tablesDef} nodeId={db.id} />);
        fireEvent.change(screen.getByLabelText("role, row 1 of employees"), {
            target: { value: "janitor" },
        });
        expect(storedTables(db.id)[0].rows).toEqual([{ name: "A. Ritter", role: "janitor" }]);
        // Even a numeric-looking cell stays a string: "0049" is a phone
        // prefix, not a number.
        fireEvent.change(screen.getByLabelText("role, row 1 of employees"), {
            target: { value: "0049" },
        });
        expect(storedTables(db.id)[0].rows[0].role).toBe("0049");
    });

    it("adds rows, columns and tables", () => {
        const db = seed();
        loadWith([db]);
        render(<Field def={tablesDef} nodeId={db.id} />);
        fireEvent.click(screen.getByRole("button", { name: "Add row to employees" }));
        expect(storedTables(db.id)[0].rows).toHaveLength(2);
        expect(storedTables(db.id)[0].rows[1]).toEqual({ name: "", role: "" });
        fireEvent.click(screen.getByRole("button", { name: "Add column to employees" }));
        const cols = Object.keys(storedTables(db.id)[0].rows[0]);
        expect(cols).toContain("column3");
        // Every row was backfilled.
        expect(Object.keys(storedTables(db.id)[0].rows[1])).toContain("column3");
        fireEvent.click(screen.getByRole("button", { name: "+ Add table" }));
        expect(storedTables(db.id)).toHaveLength(2);
        expect(storedTables(db.id)[1]).toMatchObject({ name: "", rows: [] });
    });

    it("renames a column across every row", () => {
        const db = seed();
        loadWith([db]);
        render(<Field def={tablesDef} nodeId={db.id} />);
        fireEvent.change(screen.getByLabelText("Column name, was role, in employees"), {
            target: { value: "job" },
        });
        expect(storedTables(db.id)[0].rows).toEqual([{ name: "A. Ritter", job: "compliance" }]);
    });

    it("removes rows, columns and tables", () => {
        const db = seed();
        loadWith([db]);
        render(<Field def={tablesDef} nodeId={db.id} />);
        fireEvent.click(screen.getByRole("button", { name: "Remove column role from employees" }));
        expect(storedTables(db.id)[0].rows).toEqual([{ name: "A. Ritter" }]);
        fireEvent.click(screen.getByRole("button", { name: "Remove row 1 from employees" }));
        expect(storedTables(db.id)[0].rows).toEqual([]);
        fireEvent.click(screen.getByRole("button", { name: "Remove employees" }));
        expect(storedTables(db.id)).toEqual([]);
    });

    it("warns that an unnamed table is skipped at export", () => {
        const db = makeNode("world.database", { x: 0, y: 0 }, {
            host: "db.example.com",
            tables: [{ id: "t1", name: "", rows: [{ a: "b" }] }],
        });
        loadWith([db]);
        render(<Field def={tablesDef} nodeId={db.id} />);
        expect(screen.getByText(/no name, so the game will skip it/)).toBeInTheDocument();
    });
});
