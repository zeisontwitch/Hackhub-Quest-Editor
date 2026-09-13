/**
 * The colour picker, mounted.
 *
 * Sliders and a hex field rather than a hue wheel, precisely so this is
 * testable: a range input carries its own value, where a wheel would need
 * pointer geometry that jsdom cannot provide (the r97-r100 lesson).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColourPicker } from "@/editor/inspector/ColourPicker";
import { hexToHsl } from "@/editor/inspector/colour";

const PRESETS = [
    { value: "#64748b", label: "Slate" },
    { value: "#60a5fa", label: "Blue" },
] as const;

/** Render with a live value, the way the inspector binds it. */
function mount(initial = "#64748b") {
    const seen: string[] = [];
    function Harness() {
        const [value, setValue] = require("react").useState(initial);
        return (
            <ColourPicker
                label="Colour"
                value={value}
                presets={PRESETS}
                onChange={(hex: string) => {
                    seen.push(hex);
                    setValue(hex);
                }}
            />
        );
    }
    render(<Harness />);
    return { seen };
}

const hexBox = () => screen.getByLabelText("Colour — hex value") as HTMLInputElement;
const slider = (name: string) => screen.getByLabelText(`Colour — ${name}`) as HTMLInputElement;

beforeEach(() => localStorage.clear());

describe("presets", () => {
    it("shows a swatch per preset and marks the active one", () => {
        mount("#64748b");
        expect(screen.getByLabelText("Slate").getAttribute("aria-pressed")).toBe("true");
        expect(screen.getByLabelText("Blue").getAttribute("aria-pressed")).toBe("false");
    });

    it("picks a preset on click", async () => {
        const { seen } = mount("#64748b");
        await userEvent.setup().click(screen.getByLabelText("Blue"));
        expect(seen).toContain("#60a5fa");
    });
});

describe("hex field", () => {
    it("shows the current colour", () => {
        mount("#60a5fa");
        expect(hexBox().value).toBe("#60a5fa");
    });

    it("accepts a typed value on Enter", async () => {
        const { seen } = mount("#64748b");
        const user = userEvent.setup();
        await user.clear(hexBox());
        await user.type(hexBox(), "#34d399{Enter}");
        expect(seen.at(-1)).toBe("#34d399");
    });

    it("accepts a value typed without the hash", async () => {
        const { seen } = mount("#64748b");
        const user = userEvent.setup();
        await user.clear(hexBox());
        await user.type(hexBox(), "34d399{Enter}");
        expect(seen.at(-1)).toBe("#34d399");
    });

    it("ignores junk rather than writing a broken colour", async () => {
        const { seen } = mount("#64748b");
        const user = userEvent.setup();
        await user.clear(hexBox());
        await user.type(hexBox(), "not-a-colour{Enter}");
        expect(seen).toHaveLength(0);
        expect(hexBox().value).toBe("#64748b");
    });

    it("abandons a half-typed value on Escape", async () => {
        const { seen } = mount("#64748b");
        const user = userEvent.setup();
        await user.clear(hexBox());
        await user.type(hexBox(), "#ab{Escape}");
        expect(seen).toHaveLength(0);
        expect(hexBox().value).toBe("#64748b");
    });
});

describe("sliders", () => {
    it("offers hue, saturation and lightness", () => {
        mount();
        expect(slider("hue")).toBeTruthy();
        expect(slider("saturation")).toBeTruthy();
        expect(slider("lightness")).toBeTruthy();
    });

    it("starts at the current colour's values", () => {
        mount("#ff0000");
        expect(Number(slider("hue").value)).toBe(0);
        expect(Number(slider("saturation").value)).toBe(100);
        expect(Number(slider("lightness").value)).toBe(50);
    });

    it("changes the colour when hue moves", () => {
        const { seen } = mount("#ff0000");
        act(() => {
            const el = slider("hue");
            const setter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype, "value",
            )!.set!;
            setter.call(el, "120");
            el.dispatchEvent(new Event("input", { bubbles: true }));
        });
        expect(seen.at(-1)).toBe("#00ff00");
    });

    it("keeps the hue slider in place when saturation drops to zero", () => {
        /*
         * Grey has no hue, so every conversion reports 0. Deriving the slider
         * from the colour would snap it to red mid-drag and lose the author's
         * place, which is why the component remembers it.
         */
        mount("#00ff00"); // hue 120
        act(() => {
            const el = slider("saturation");
            const setter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype, "value",
            )!.set!;
            setter.call(el, "0");
            el.dispatchEvent(new Event("input", { bubbles: true }));
        });
        expect(Number(slider("hue").value)).toBe(120);
    });
});

describe("round trip", () => {
    it("opening the picker does not shift the colour", () => {
        // The bug the float-precision fix exists for: #64748b is lightness
        // 46.863, and rounding it to 47 comes back as #65758b.
        for (const hex of PRESETS.map((p) => p.value)) {
            const { seen } = mount(hex);
            expect(seen).toHaveLength(0);
            expect(hexBox().value).toBe(hex);
            expect(hexToHsl(hex)).not.toBeNull();
            cleanup(); // each iteration mounts its own picker
        }
    });
});
