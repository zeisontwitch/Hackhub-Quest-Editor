/**
 * The debug panel and its instrumentation.
 *
 * This is the tool we will lean on to diagnose the next problem, so it has to
 * be trustworthy itself: if the panel says "allowed: yes" while the physics is
 * refused, it is worse than having no panel.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { createProject } from "@/schema/project";
import { useEditor } from "@/store/editor";
import { EDITOR_BUILD } from "@/compiler/compile";
import {
    clearDiagnostics,
    count,
    diagCounters,
    diagLog,
    record,
} from "@/editor/canvas/diagnostics";
import {
    DEFAULT_TUNING,
    dampingRatio,
    resetWireTuning,
    setWireTuning,
    settleSeconds,
    wireTuning,
} from "@/editor/canvas/wireTuning";
import { setWirePhysicsEnabled } from "@/editor/canvas/wirePhysicsPref";
import { setWireMotion } from "@/editor/canvas/wireMotion";
import { refusalReason } from "@/editor/canvas/wirePhysics";

beforeEach(() => {
    localStorage.clear();
    clearDiagnostics();
    resetWireTuning();
    setWirePhysicsEnabled(true);
    setWireMotion(true);
    act(() => useEditor.getState().load(createProject(), { clearHistory: true }));
});

async function openPanel() {
    render(<App />);
    await waitFor(() => expect(document.querySelector(".react-flow")).toBeTruthy());
    const user = userEvent.setup();
    await user.click(screen.getByText("Debug"));
    await waitFor(() => expect(screen.getByRole("dialog", { name: "Debug panel" })).toBeTruthy());
    return user;
}

describe("the panel", () => {
    it("is closed until asked for", async () => {
        render(<App />);
        await waitFor(() => expect(document.querySelector(".react-flow")).toBeTruthy());
        expect(screen.queryByRole("dialog", { name: "Debug panel" })).toBeNull();
    });

    it("opens and closes from the toolbar", async () => {
        const user = await openPanel();
        await user.click(screen.getByLabelText("Close the debug panel"));
        await waitFor(() =>
            expect(screen.queryByRole("dialog", { name: "Debug panel" })).toBeNull(),
        );
    });

    it("shows which build is loaded", async () => {
        // A stale bundle looks exactly like a broken feature; this tells them
        // apart at a glance.
        await openPanel();
        expect(screen.getByText(EDITOR_BUILD)).toBeTruthy();
    });
});

describe("it reports the gates honestly", () => {
    it("says physics is allowed when nothing is blocking it", async () => {
        await openPanel();
        expect(screen.getByText("yes")).toBeTruthy();
    });

    it("names the switch that refused, rather than just saying no", async () => {
        // The failure mode that cost several rounds: physics silently off,
        // with no way to see why from the UI.
        setWirePhysicsEnabled(false);
        await openPanel();
        expect(screen.getByText(/Springy wires is off/)).toBeTruthy();
    });

    it("names the master switch too", async () => {
        setWireMotion(false);
        await openPanel();
        expect(screen.getByText(/Animated wires is off/)).toBeTruthy();
    });
});

describe("refusalReason", () => {
    it("is null when the physics may run", () => {
        expect(refusalReason()).toBeNull();
    });

    it("blames the physics toggle first", () => {
        setWirePhysicsEnabled(false);
        setWireMotion(false);
        expect(refusalReason()).toBe("Springy wires is off");
    });
});

describe("live tuning", () => {
    it("starts at the shipped defaults", () => {
        expect(wireTuning()).toEqual(DEFAULT_TUNING);
    });

    it("changes a number and remembers it", () => {
        setWireTuning({ stiffness: 900 });
        expect(wireTuning().stiffness).toBe(900);
        expect(JSON.parse(localStorage.getItem("qe.wireTuning")!).stiffness).toBe(900);
    });

    it("leaves the other numbers alone", () => {
        setWireTuning({ stiffness: 900 });
        expect(wireTuning().maxSag).toBe(DEFAULT_TUNING.maxSag);
    });

    it("puts everything back", () => {
        setWireTuning({ stiffness: 900, maxSag: 10 });
        resetWireTuning();
        expect(wireTuning()).toEqual(DEFAULT_TUNING);
        expect(localStorage.getItem("qe.wireTuning")).toBeNull();
    });

    it("exposes the numbers the sliders drive", async () => {
        await openPanel();
        for (const label of ["Stiffness", "Damping", "Max sag", "Taut at", "Ghost ms"]) {
            expect(screen.getByLabelText(label)).toBeTruthy();
        }
    });

    it("reports the damping ratio, which is what predicts the feel", () => {
        // Under 1 bounces, at 1 arrives dead, over 1 crawls in.
        expect(dampingRatio({ ...DEFAULT_TUNING, stiffness: 400, damping: 40 })).toBeCloseTo(1, 5);
        expect(dampingRatio({ ...DEFAULT_TUNING, stiffness: 400, damping: 20 })).toBeCloseTo(0.5, 5);
    });

    it("reports a settle time that falls as the spring stiffens", () => {
        const slow = settleSeconds({ ...DEFAULT_TUNING, stiffness: 180, damping: 18 });
        const fast = settleSeconds({ ...DEFAULT_TUNING, stiffness: 520, damping: 34 });
        expect(fast).toBeLessThan(slow);
    });
});

describe("diagnostics", () => {
    it("counts what happened", () => {
        count("ghosts");
        count("ghosts");
        expect(diagCounters().ghosts).toBe(2);
    });

    it("keeps the recent events, oldest first", () => {
        record("a", "one");
        record("b", "two");
        const log = diagLog();
        expect(log.map((e) => e.tag)).toEqual(["a", "b"]);
    });

    it("never grows past its ring, however much happens", () => {
        // A fixed buffer: a long session must not leak memory.
        for (let i = 0; i < 500; i++) record("spam", String(i));
        expect(diagLog().length).toBe(60);
        // ...and it keeps the NEWEST, which is what a diagnosis needs.
        expect(diagLog().at(-1)!.detail).toBe("499");
    });

    it("clears on request", () => {
        count("ghosts");
        record("a");
        clearDiagnostics();
        expect(diagCounters().ghosts).toBe(0);
        expect(diagLog()).toEqual([]);
    });
});
