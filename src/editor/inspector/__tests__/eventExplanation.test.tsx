/**
 * Under the event picker: what the chosen event IS, then what a condition
 * can match on it. (Rendered directly — opening the picker's Radix popover
 * under jsdom costs seconds per test and proves nothing about copy.)
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventExplanation } from "@/editor/inspector/EventPicker";

describe("event explanation", () => {
    it("explains the event before listing its fields", () => {
        render(<EventExplanation name="Terminal.Command" payload="{ command: string; args: string[] }" />);
        expect(screen.getByText(/runs a command/)).toBeInTheDocument();
        expect(screen.getByText(/Narrow it down with:/)).toBeInTheDocument();
        expect(screen.getByText("command, args")).toBeInTheDocument();
    });

    it("says plainly when there is nothing to match on", () => {
        render(<EventExplanation name="Metasploit.Msfconsole" payload="{}" />);
        expect(screen.getByText(/opens the metasploit console/)).toBeInTheDocument();
        expect(screen.getByText("It carries no details to test against.")).toBeInTheDocument();
    });

    it("matches primitive payloads as a whole, like the condition builder", () => {
        // Lynx.Search declares { query } but the game raises a bare string —
        // the preview must not offer "query" as a field.
        render(<EventExplanation name="Terminal.Lynx.Search" payload="{ query: string }" />);
        expect(screen.queryByText(/Narrow it down/)).not.toBeInTheDocument();
        expect(screen.getByText(/Match it as a whole/)).toBeInTheDocument();
    });
});
