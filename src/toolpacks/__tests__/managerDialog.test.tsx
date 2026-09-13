/**
 * The tool-pack manager dialog (r137): loading pack files with plain-language
 * results, the two-step remove, and persistence across reopenings. userEvent
 * drives the file input (the repo's proven FileReader-safe path).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ToolPackManagerDialog } from "@/toolpacks/ToolPackManagerDialog";
import { usePacks } from "@/store/packs";

const exampleJson = readFileSync(join(process.cwd(), "reference/example-toolpack/toolpack.json"), "utf8");

const packFile = (text: string, name = "toolpack.json") => new File([text], name, { type: "application/json" });

async function loadFiles(...files: File[]) {
    const input = screen.getByLabelText("Load tool pack files");
    const user = userEvent.setup();
    await user.upload(input, files);
}

beforeEach(() => {
    localStorage.clear();
    act(() => usePacks.setState({ packs: [] }));
    render(<ToolPackManagerDialog open onOpenChange={() => {}} />);
});

describe("tool pack manager", () => {
    it("introduces itself and says a pack is data, not code", () => {
        expect(screen.getByText("Tool packs")).toBeInTheDocument();
        expect(screen.getByText(/the editor never runs code from them/)).toBeInTheDocument();
        expect(screen.getByText("No tool packs loaded.")).toBeInTheDocument();
    });

    it("loads a valid pack and lists it with its honesty line", async () => {
        await loadFiles(packFile(exampleJson));
        expect(await screen.findByText(/Loaded 1 pack\./)).toBeInTheDocument();
        expect(screen.getAllByText("Example Tools").length).toBeGreaterThan(0);
        expect(screen.getByText(/example-tools · v1\.0\.0/)).toBeInTheDocument();
        /* The honesty line and the counts: broken across elements, so match
           on the card's textContent. */
        const idLine = screen.getByText(/example-tools · v1\.0\.0/);
        let card: HTMLElement | null = idLine.parentElement;
        while (card && !card.textContent?.includes("data shape")) card = card.parentElement;
        expect(card?.textContent).toContain("needs the Example Tools game mod installed");
        expect(card?.textContent).toContain("2 events · 1 data shape");
        /* The parsed target rules show on the card. */
        expect(card?.textContent).toContain("matches http, ftp, ssh, database, redis, smb, smtp");
    });

    it("still shows the packs after closing and reopening (machine-local persistence)", async () => {
        await loadFiles(packFile(exampleJson));
        await screen.findByText(/Loaded 1 pack\./);
        cleanup();
        render(<ToolPackManagerDialog open onOpenChange={() => {}} />);
        expect(screen.getAllByText("Example Tools").length).toBeGreaterThan(0);
    });

    it("explains a broken JSON file instead of a stack trace", async () => {
        await loadFiles(packFile("{oops", "broken.json"));
        expect(await screen.findByText(/broken\.json: this is not valid JSON/)).toBeInTheDocument();
        expect(screen.queryByText("Example Tools")).not.toBeInTheDocument();
    });

    it("points an old-format pack at the format doc", async () => {
        const old = JSON.stringify({ ...JSON.parse(exampleJson), format: 1 });
        await loadFiles(packFile(old, "old.json"));
        expect(await screen.findByText(/old\.json.*speaks format 2/s)).toBeInTheDocument();
    });

    it("loads the good half of a mixed selection and names the bad half", async () => {
        await loadFiles(packFile(exampleJson), packFile("{oops", "broken.json"));
        expect(await screen.findByText(/Loaded 1 pack\./)).toBeInTheDocument();
        expect(screen.getByText(/broken\.json: this is not valid JSON/)).toBeInTheDocument();
        expect(screen.getAllByText("Example Tools").length).toBeGreaterThan(0);
    });

    it("asks for .json files when none was offered", async () => {
        /* fireEvent, not user.upload: user-event honours the input's accept
           filter, and this input only takes .json — the mislabelled-file
           case must still reach the handler. */
        fireEvent.change(screen.getByLabelText("Load tool pack files"), {
            target: { files: [new File(["<p>hi</p>"], "page.html", { type: "text/html" })] },
        });
        expect(await screen.findByText(/No \.json files in that selection/)).toBeInTheDocument();
    });

    it("removes a pack in two steps", async () => {
        await loadFiles(packFile(exampleJson));
        await screen.findByText(/Loaded 1 pack\./);

        /* Step one asks; nothing is gone yet. */
        await userEvent.click(screen.getByLabelText("Remove Example Tools"));
        expect(screen.getByText("Remove?")).toBeInTheDocument();
        expect(screen.getAllByText("Example Tools").length).toBeGreaterThan(0);

        /* Step two removes. */
        await userEvent.click(screen.getByRole("button", { name: "Yes" }));
        expect(screen.queryAllByText("Example Tools")).toHaveLength(0);
        expect(usePacks.getState().packs).toHaveLength(0);
    });

    it("the remove question can be dismissed without removing", async () => {
        await loadFiles(packFile(exampleJson));
        await screen.findByText(/Loaded 1 pack\./);
        await userEvent.click(screen.getByLabelText("Remove Example Tools"));
        await userEvent.click(screen.getByRole("button", { name: "No" }));
        expect(screen.getAllByText("Example Tools").length).toBeGreaterThan(0);
        expect(usePacks.getState().packs).toHaveLength(1);
    });
});
