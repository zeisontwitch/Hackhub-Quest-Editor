/**
 * The grey-screen net (r144).
 *
 * Zeis reported the editor loading to "a grey colour and absolutely nothing
 * else" on the day the grid round (r142) landed, and rolled the branch back.
 * The investigation (docs/plans/r144-grey-screen-readme-reland.md) found no
 * boot crash in r142's code — the likely culprit was the dev-preview server
 * dying with a sandbox reset — but the report exposed a real gap: nothing
 * asserted that the whole editor boots at all.
 *
 * A grey screen is React crashing during the first render: the CSS background
 * outlives the component tree, so the page shows colour and nothing else.
 * jsdom reproduces exactly that class of failure — a crash here fails the
 * test instead of the user. These tests mount the real App, whole, and
 * require the standing shell (top bar with its Settings button, the canvas)
 * with the grid off (the shipped default) and on, native and overlay.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import App from "@/App";
import { createProject } from "@/schema/project";
import { useEditor } from "@/store/editor";
import { resetCanvasGridForTests, setCanvasGrid } from "@/editor/canvas/canvasGrid";

beforeEach(() => {
    localStorage.clear();
    resetCanvasGridForTests();
    act(() => useEditor.getState().load(createProject(), { clearHistory: true }));
});

async function bootTheEditor() {
    render(<App />);
    await waitFor(() => expect(document.querySelector(".react-flow")).toBeTruthy());
}

/** What a booted editor always shows, grid or no grid. */
function expectShellStanding() {
    expect(screen.getByRole("navigation", { name: "Quests" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Settings" })).toBeTruthy();
    expect(document.querySelector(".react-flow")).toBeTruthy();
}

describe("the editor boots (the grey-screen net)", () => {
    it("boots to a standing shell with the grid off — the shipped default", async () => {
        await bootTheEditor();
        expectShellStanding();
        expect(document.querySelector('[data-testid="rf__background"]')).toBeNull();
        expect(document.querySelector('[data-testid="qe-canvas-grid"]')).toBeNull();
    });

    it("boots with the grid on — a native style (squares)", async () => {
        setCanvasGrid({ enabled: true, style: "squares" });
        await bootTheEditor();
        expectShellStanding();
        expect(document.querySelector('[data-testid="rf__background"]')).toBeTruthy();
    });

    it("boots with the grid on — the custom overlay (hexagons)", async () => {
        setCanvasGrid({ enabled: true, style: "hexagons" });
        await bootTheEditor();
        expectShellStanding();
        expect(document.querySelector('[data-testid="qe-canvas-grid"]')).toBeTruthy();
    });
});
