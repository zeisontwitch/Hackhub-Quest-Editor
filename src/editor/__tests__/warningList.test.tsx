/**
 * r152: compiler warnings render as one amber card each (export + dry run),
 * the quest/host context semibold — not a grey wall of bullets.
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WarningList } from "@/components/WarningList";

describe("WarningList", () => {
    it("renders one card per warning with the context prefix semibold", () => {
        render(<WarningList warnings={["The Heist: telnet means nothing here", "Setup: likewise"]} />);
        const items = screen.getAllByRole("listitem");
        expect(items).toHaveLength(2);
        const heads = screen.getAllByText("The Heist");
        expect(heads).toHaveLength(1);
        expect(heads[0].tagName).toBe("STRONG");
        /* Flat markup: the warning text matches exactly one element. */
        expect(screen.getByText(/telnet means nothing/)).toBeInTheDocument();
    });

    it("renders warnings without a context prefix whole, with no strong", () => {
        const { container } = render(<WarningList warnings={["Test Pack community data is used in this quest."]} />);
        expect(container.querySelector("strong")).toBeNull();
        expect(screen.getByText(/community data is used/)).toBeInTheDocument();
    });
});
