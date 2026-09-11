/**
 * The settings sheet.
 *
 * The author-facing home for the editor preferences (roadmap item 5). What
 * makes it trustworthy is that it flips the same modules the canvas toolbar
 * flips and persists them — a sheet that kept its own state would be a second
 * source of truth, and the two surfaces would drift apart.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { createProject } from "@/schema/project";
import { useEditor } from "@/store/editor";
import { resetSnapForTests, snapEnabled } from "@/editor/canvas/snapGrid";
import { setWireMotion } from "@/editor/canvas/wireMotion";
import {
    resetWirePhysicsForTests,
    wirePhysicsEnabled,
} from "@/editor/canvas/wirePhysicsPref";
import {
    DEFAULT_TUNING,
    resetWireTuning,
    setWireTuning,
    wireTuning,
} from "@/editor/canvas/wireTuning";

beforeEach(() => {
    localStorage.clear();
    resetSnapForTests();
    setWireMotion(true);
    resetWirePhysicsForTests();
    resetWireTuning();
    act(() => {
        useEditor.getState().load(createProject(), { clearHistory: true });
        // A previous test may have left a modal open; the store is module
        // state and survives the unmount, so put it away explicitly.
        useEditor.getState().setUi({ modal: null });
    });
});

async function openSettings() {
    render(<App />);
    await waitFor(() => expect(document.querySelector(".react-flow")).toBeTruthy());
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Settings" }));
    await waitFor(() => expect(screen.getByRole("dialog", { name: "Settings" })).toBeTruthy());
    return user;
}

describe("the sheet", () => {
    it("is closed until asked for", async () => {
        render(<App />);
        await waitFor(() => expect(document.querySelector(".react-flow")).toBeTruthy());
        expect(screen.queryByRole("dialog", { name: "Settings" })).toBeNull();
    });

    it("opens from the top bar and closes on Escape", async () => {
        const user = await openSettings();
        await user.keyboard("{Escape}");
        await waitFor(() =>
            expect(screen.queryByRole("dialog", { name: "Settings" })).toBeNull(),
        );
    });

    it("is a sheet, not a blocking modal", async () => {
        await openSettings();
        // Radix marks modal dialogs aria-modal; the sheet must not be one, or
        // it would dim and block the very canvas being tuned. Whether clicks
        // really pass through is a browser fact jsdom cannot prove — that
        // half is Zeis's eyes in the preview.
        const sheet = screen.getByRole("dialog", { name: "Settings" });
        expect(sheet.getAttribute("aria-modal")).toBeNull();
    });

    it("says plainly that nothing here changes the exported mod", async () => {
        await openSettings();
        expect(screen.getByText(/None of this changes the exported mod/)).toBeTruthy();
    });
});

describe("the toggles", () => {
    it("flips the snap preference and remembers it", async () => {
        const user = await openSettings();
        expect(snapEnabled()).toBe(false);
        await user.click(screen.getByRole("switch", { name: "Snap to grid" }));
        expect(snapEnabled()).toBe(true);
        expect(localStorage.getItem("qe.snapToGrid")).toBe("on");
        expect(
            screen.getByRole("switch", { name: "Snap to grid" }).getAttribute("aria-checked"),
        ).toBe("true");
    });

    it("flips springy wires off, where the debug panel can see it", async () => {
        const user = await openSettings();
        await user.click(screen.getByRole("switch", { name: "Springy wires" }));
        expect(wirePhysicsEnabled()).toBe(false);
        expect(localStorage.getItem("qe.wirePhysics")).toBe("off");
    });

    it("agrees with the canvas toolbar — one module, two surfaces", async () => {
        const user = await openSettings();
        await user.click(screen.getByRole("switch", { name: "Snap to grid" }));
        expect(screen.getByText("Snapping")).toBeTruthy();
    });
});

describe("the dials", () => {
    it("drives the live tuning and persists it", async () => {
        await openSettings();
        fireEvent.change(screen.getByLabelText("Stiffness"), { target: { value: "900" } });
        expect(wireTuning().stiffness).toBe(900);
        expect(JSON.parse(localStorage.getItem("qe.wireTuning")!).stiffness).toBe(900);
    });

    it("puts the shipped defaults back", async () => {
        const user = await openSettings();
        setWireTuning({ stiffness: 900, maxSag: 10 });
        await user.click(screen.getByRole("button", { name: /Reset to defaults/ }));
        expect(wireTuning()).toEqual(DEFAULT_TUNING);
        expect(localStorage.getItem("qe.wireTuning")).toBeNull();
    });

    it("reads out the damping ratio the numbers produce", async () => {
        // 40 = 2·√400, the critical pair — the readout must say so, because
        // the ratio is the number that predicts the feel.
        await openSettings();
        fireEvent.change(screen.getByLabelText("Stiffness"), { target: { value: "400" } });
        fireEvent.change(screen.getByLabelText("Damping"), { target: { value: "40" } });
        expect(screen.getByText(/damping ratio — critical/)).toBeTruthy();
    });
});
