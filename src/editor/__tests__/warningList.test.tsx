/**
 * r152 cards, r153 severity: info renders light-blue, warn amber, error red;
 * the quest/host context stays semibold — not a grey wall of bullets.
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WarningList } from "@/components/WarningList";

describe("WarningList", () => {
    it("renders one card per warning with the context prefix semibold", () => {
        render(<WarningList warnings={[{ level: "warn", text: "The Heist: telnet means nothing here" }]} />);
        expect(screen.getAllByRole("listitem")).toHaveLength(1);
        const head = screen.getByText("The Heist");
        expect(head.tagName).toBe("STRONG");
        /* Flat markup: the warning text matches exactly one element. */
        expect(screen.getByText(/telnet means nothing/)).toBeInTheDocument();
    });

    it("renders warnings without a context prefix whole, with no strong", () => {
        const { container } = render(
            <WarningList warnings={[{ level: "info", text: "Test Pack community data is used in this quest." }]} />,
        );
        expect(container.querySelector("strong")).toBeNull();
        expect(screen.getByText(/community data is used/)).toBeInTheDocument();
    });

    it("tints each level differently: blue info, amber warn, red error", () => {
        const { container } = render(
            <WarningList
                warnings={[
                    { level: "info", text: "a: pure FYI" },
                    { level: "warn", text: "b: might break" },
                    { level: "error", text: "c: will break" },
                ]}
            />,
        );
        const items = [...container.querySelectorAll("li")];
        expect(items).toHaveLength(3);
        expect(items[0].className).toContain("bg-accent-soft");
        expect(items[1].className).toContain("bg-warn/5");
        expect(items[2].className).toContain("bg-danger/5");
    });
});
