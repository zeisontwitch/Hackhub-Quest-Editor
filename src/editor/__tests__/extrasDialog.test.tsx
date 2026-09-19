/**
 * The pack extras dialog (r203) — what a jsdom test can honestly hold.
 *
 * It cannot say whether any of it looks right (pixels are Zeis's half). What it
 * can hold is the part the readings changed, and the part an author depends on:
 *
 *  - a new widget starts OPAQUE, because the SDK's own default is see-through
 *    and the first probe drew bare text on the desktop because of it;
 *  - there is no `section` control anywhere, because the game ignores it;
 *  - an action asks only for the fields its own kind uses;
 *  - the language list is the game's own 30 codes, and a line typed once shows
 *    up as the token an author pastes into any text field.
 *
 * Same jsdom caution as the Twotter tests: inside a Radix dialog a plain click
 * is fine, but `userEvent.tab()` stalls for ~35 s, so fields are committed by
 * blurring directly.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExtrasDialog } from "@/editor/extras/ExtrasDialog";
import { GAME_LANGUAGE_CODES } from "@/schema/extras";
import { createProject } from "@/schema/project";
import { useEditor } from "@/store/editor";

beforeEach(() => {
    localStorage.clear();
    act(() => useEditor.getState().load(createProject(), { clearHistory: true }));
});

const renderDialog = () => {
    render(<ExtrasDialog open onOpenChange={() => {}} />);
    return userEvent.setup({ delay: null });
};

describe("pack extras dialog (r203)", () => {
    it("offers the four surfaces, and no `section` control anywhere", async () => {
        const user = renderDialog();
        for (const tab of ["Start menu", "Desktop widgets", "Right-click", "Text & languages"]) {
            expect(screen.getByRole("button", { name: tab })).toBeTruthy();
        }
        /* The SDK declares `section` and the game ignores it — a control that
           does nothing must not be offered. Asserted with a menu entry
           SELECTED, so every field of the form is on screen: the point is that
           the word is absent from the form, not that the form is absent. */
        await user.click(screen.getByRole("button", { name: /New menu entry/ }));
        expect(screen.getByLabelText("Label")).toBeTruthy();
        expect(screen.queryByText(/section/i)).toBeNull();
        expect(screen.queryByLabelText(/section/i)).toBeNull();
    });

    it("adds a start-menu entry and writes it into the project", async () => {
        const user = renderDialog();
        await user.click(screen.getByRole("button", { name: /New menu entry/ }));
        const menuItems = useEditor.getState().project.extras.menuItems;
        expect(menuItems).toHaveLength(1);
        expect(menuItems[0]!.label).toBe("New item");
    });

    it("embeds a picture an author picks, the way the game was proven to accept it", async () => {
        /* Measured in game 2026-09-19 (row P): a start-menu entry with a data
           URL in its picture showed the picture. So the field is a file picker
           that embeds the file, not a text box asking for a data URL by hand -
           which is what it used to be, and what no author can reasonably do. */
        const user = renderDialog();
        await user.click(screen.getByRole("button", { name: /New menu entry/ }));
        const file = new File([new Uint8Array([137, 80, 78, 71])], "square.png", { type: "image/png" });
        await user.upload(screen.getByLabelText("Menu entry picture"), file);
        await screen.findByAltText("Picture preview");
        expect(useEditor.getState().project.extras.menuItems[0]!.icon).toMatch(/^data:image\/png;base64,/);
    });

    it("takes the picture back out again when the author removes it", async () => {
        const user = renderDialog();
        await user.click(screen.getByRole("button", { name: /New menu entry/ }));
        const item = () => useEditor.getState().project.extras.menuItems[0]!;
        const file = new File([new Uint8Array([137, 80, 78, 71])], "square.png", { type: "image/png" });
        await user.upload(screen.getByLabelText("Menu entry picture"), file);
        await screen.findByAltText("Picture preview");
        await user.click(screen.getByRole("button", { name: "Remove" }));
        expect(item().icon).toBe("");
        expect(screen.queryByAltText("Picture preview")).toBeNull();
    });

    it("keeps the picture control off the right-click form too, and on the same footing", async () => {
        /* Two forms, one control: an author should not have to learn a different
           answer for the same question. */
        const user = renderDialog();
        await user.click(screen.getByRole("button", { name: "Right-click" }));
        await user.click(screen.getByRole("button", { name: /New right-click entry/ }));
        expect(screen.getByLabelText("Right-click entry picture")).toBeTruthy();
    });

    it("adds a widget that is opaque by default, with the SDK's default never relied on", async () => {
        const user = renderDialog();
        await user.click(screen.getByRole("button", { name: "Desktop widgets" }));
        await user.click(screen.getByRole("button", { name: /New widget/ }));
        const widget = useEditor.getState().project.extras.widgets[0]!;
        /* The SDK defaults this to true (bare text, no background). The one
           thing that must never happen is shipping a widget without deciding. */
        expect(widget.transparent).toBe(false);
        const toggle = screen.getByRole("switch", { name: /See-through/ });
        expect(toggle.getAttribute("aria-checked")).toBe("false");
        await user.click(toggle);
        expect(useEditor.getState().project.extras.widgets[0]!.transparent).toBe(true);
    });

    it("asks an action only for the fields its own kind uses", async () => {
        const user = renderDialog();
        await user.click(screen.getByRole("button", { name: /New menu entry/ }));
        /* Default kind is a message: the message box is there, the mail and
           handbook fields are not. */
        expect(screen.getByLabelText("Message")).toBeTruthy();
        expect(screen.queryByLabelText("Subject")).toBeNull();
        expect(screen.queryByLabelText("Page")).toBeNull();

        await user.selectOptions(screen.getByLabelText("When clicked"), "mail");
        expect(screen.getByLabelText("Subject")).toBeTruthy();
        expect(screen.queryByLabelText("Message")).toBeNull();
    });

    it("points a 'start a quest' action at a quest of this pack", async () => {
        const user = renderDialog();
        const quest = useEditor.getState().project.quests[0]!;
        await user.click(screen.getByRole("button", { name: /New menu entry/ }));
        await user.selectOptions(screen.getByLabelText("When clicked"), "claim");
        const picker = screen.getByLabelText("Quest") as HTMLSelectElement;
        /* Every quest of the pack is offered by name, and the value written is
           the id — what Quest.claim() takes. */
        expect(Array.from(picker.options).map((o) => o.text)).toContain(quest.title);
        await user.selectOptions(picker, quest.id);
        expect(useEditor.getState().project.extras.menuItems[0]!.action.questId).toBe(quest.id);
    });

    it("offers the game's own languages, and only those", async () => {
        const user = renderDialog();
        await user.click(screen.getByRole("button", { name: "Text & languages" }));
        const picker = screen.getByLabelText("Add a language") as HTMLSelectElement;
        const offered = Array.from(picker.options)
            .map((o) => o.value)
            .filter(Boolean);
        /* The picker is the game's own list, in full and with nothing invented:
           an author cannot ask for a language the game does not have. English
           is already there (it is what the game falls back to), so it is the
           one code missing from the picker. */
        const already = useEditor.getState().project.translations.languages;
        expect(already).toEqual(["en"]);
        expect(offered.sort()).toEqual(
            GAME_LANGUAGE_CODES.filter((c) => !already.includes(c)).sort(),
        );
        await user.selectOptions(picker, "de");
        expect(useEditor.getState().project.translations.languages).toContain("de");
        /* …and once added it leaves the picker, so it cannot be added twice. */
        expect(Array.from(picker.options).some((o) => o.value === "de")).toBe(false);
    });

    it("turns a line added once into a column per language and the token to paste", async () => {
        const user = renderDialog();
        await user.click(screen.getByRole("button", { name: "Text & languages" }));
        const field = screen.getByLabelText("Add a line");
        await user.type(field, "menu.flashlight");
        await user.click(screen.getByRole("button", { name: /Add line/ }));

        const table = screen.getByRole("table");
        expect(within(table).getByText("menu.flashlight")).toBeTruthy();
        /* The author's job here is to have the token ready to paste elsewhere. */
        expect(screen.getByLabelText("Copy {{tr.menu.flashlight}}")).toBeTruthy();

        const cell = screen.getByLabelText("menu.flashlight in en");
        await user.type(cell, "Flashlight");
        act(() => cell.blur());
        expect(useEditor.getState().project.translations.strings.en["menu.flashlight"]).toBe("Flashlight");
    });

    it("refuses a line name with spaces in it, and says why", async () => {
        const user = renderDialog();
        await user.click(screen.getByRole("button", { name: "Text & languages" }));
        await user.type(screen.getByLabelText("Add a line"), "my line");
        await user.click(screen.getByRole("button", { name: /Add line/ }));
        expect(screen.getByRole("alert").textContent).toMatch(/No spaces/);
        expect(Object.keys(useEditor.getState().project.translations.strings.en ?? {})).toHaveLength(0);
    });

    it("opens the widget's own page editor, because a widget is a small page", async () => {
        const user = renderDialog();
        await user.click(screen.getByRole("button", { name: "Desktop widgets" }));
        await user.click(screen.getByRole("button", { name: /New widget/ }));
        await user.click(screen.getByRole("button", { name: /Edit what it looks like/ }));
        expect(screen.getByTitle(/Widget appearance|New widget appearance/i)).toBeTruthy();
    });
});
