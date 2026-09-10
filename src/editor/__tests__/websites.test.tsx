/**
 * Step 3 website builder: store actions, the builder dialog end to end, the
 * code view, Load HTML, the isolated visual editor, and template quality.
 */
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CodePageEditor, VisualPageEditor } from "@/editor/websites/pageEditor";
import {
    isFullDocument,
    joinDocument,
    parseSearchTerms,
    splitDocument,
    wrapFragment,
} from "@/editor/websites/pageDoc";
import { WebsiteBuilderDialog } from "@/editor/websites/WebsiteBuilder";
import { createPage, createProject, createWebsite } from "@/schema/project";
import { PAGE_TEMPLATES, SITE_TEMPLATES } from "@/templates/pages";
import { useEditor } from "@/store/editor";

beforeEach(() => {
    localStorage.clear();
    act(() => useEditor.getState().load(createProject(), { clearHistory: true }));
});

describe("website store actions", () => {
    it("adds, updates and removes sites and pages with history", () => {
        const site = createWebsite({ host: "leak.example" });
        act(() => useEditor.getState().addWebsite(site));
        expect(useEditor.getState().project.websites).toHaveLength(1);

        const page = createPage({ path: "/hidden", seo: false });
        act(() => useEditor.getState().addPage(site.id, page));
        expect(useEditor.getState().project.websites[0].pages).toHaveLength(2);

        act(() => useEditor.getState().updatePage(site.id, page.id, { title: "The goods" }));
        expect(useEditor.getState().project.websites[0].pages.find((p) => p.id === page.id)!.title).toBe(
            "The goods",
        );

        act(() => useEditor.getState().updateWebsite(site.id, { host: "other.example" }));
        expect(useEditor.getState().project.websites[0].host).toBe("other.example");

        act(() => useEditor.getState().undo());
        expect(useEditor.getState().project.websites[0].host).toBe("leak.example");

        act(() => useEditor.getState().removePage(site.id, page.id));
        expect(useEditor.getState().project.websites[0].pages).toHaveLength(1);

        act(() => useEditor.getState().removeWebsite(site.id));
        expect(useEditor.getState().project.websites).toHaveLength(0);
    });
});

describe("page documents", () => {
    it("splits full documents and rejoins without touching the head", () => {
        const doc = `<!doctype html><html><head><style>h1{color:red}</style></head><body><h1>Hi</h1></body></html>`;
        expect(isFullDocument(doc)).toBe(true);
        const parts = splitDocument(doc);
        expect(parts.head).toContain("<style>h1{color:red}</style>");
        expect(parts.body).toBe("<h1>Hi</h1>");
        expect(joinDocument(parts, "<h1>Bye</h1>")).toContain("<h1>Bye</h1>");
        expect(joinDocument(parts, "<h1>Bye</h1>")).toContain("<style>h1{color:red}</style>");
    });

    it("wraps fragments into a styled base document", () => {
        expect(isFullDocument("<p>clue</p>")).toBe(false);
        const wrapped = wrapFragment("<p>clue</p>", "Clue");
        expect(wrapped).toContain("<!doctype html>");
        expect(wrapped).toContain("<title>Clue</title>");
        expect(wrapped).toContain("<p>clue</p>");
        expect(splitDocument(wrapped).body).toContain("<p>clue</p>");
    });

    it("parses the extra-search-words input into a clean term list", () => {
        expect(parseSearchTerms("lcb, meridian bank,  ,banking")).toEqual(["lcb", "meridian bank", "banking"]);
        expect(parseSearchTerms("solo")).toEqual(["solo"]);
        // Dedupe is exact-match; the author's casing is kept (the engine may
        // match case-insensitively — that is its call, not ours).
        expect(parseSearchTerms("dup, dup, DUP")).toEqual(["dup", "DUP"]);
        expect(parseSearchTerms("   ")).toEqual([]);
    });
});

describe("template quality", () => {
    it("every page template is a complete, self-contained styled document", () => {
        for (const t of PAGE_TEMPLATES) {
            const made = t.make();
            expect(made.content.toLowerCase(), t.id).toContain("<!doctype html>");
            expect(made.content, t.id).toContain("<style>");
            expect(made.content, t.id).toContain("</html>");
            // No external *resources*: the game's web views have no internet.
            // (Prose mentions of "https://" and SVG xmlns are not fetches.)
            expect(made.content, t.id).not.toMatch(/(src|href)="https?:\/\//);
            expect(made.content, t.id).not.toMatch(/@import|url\(https?:\/\//);
        }
        for (const s of SITE_TEMPLATES) {
            const made = s.make();
            expect(made.pages.length, s.id).toBeGreaterThan(0);
        }
        // The Public agency template keeps the community naza design, rebuilt as real pages.
        const agency = PAGE_TEMPLATES.find((t) => t.id === "agency")!.make();
        expect(agency.content).toContain("Zero-Gravity Administration");
        expect(agency.content).toContain('href="/missions"');
        expect(agency.content).not.toContain('href="#missions"');
    });
});

describe("website builder dialog", () => {
    it("walks from no sites to a hidden clue page", async () => {
        const user = userEvent.setup();
        render(<WebsiteBuilderDialog open onOpenChange={() => {}} />);

        expect(screen.getByText("No websites yet.")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: /blank website/i }));

        expect(screen.getByLabelText("Site host")).toHaveValue("example.net");

        // Add a ready-made hidden clue page.
        await user.click(screen.getByRole("button", { name: "New page" }));
        await user.click(screen.getByRole("button", { name: /hidden internal memo/i }));

        const site = useEditor.getState().project.websites[0];
        const hidden = site.pages.find((p) => p.path === "/files/internal/q3-audit")!;
        expect(hidden.seo).toBe(false);
        expect(hidden.template).toBe("hidden-leak");

        const listing = screen.getByRole("switch");
        expect(listing).not.toBeChecked();

        // The visual editor is an iframe running the page's own document.
        const visual = screen.getByTitle("Visual editor for /files/internal/q3-audit");
        expect(visual.getAttribute("srcdoc")).toContain("INTERNAL — DO NOT DISTRIBUTE");

        // The preview shows the in-game browser with the hidden-page banner.
        await user.click(screen.getByRole("button", { name: "preview" }));
        expect(screen.getByText(/not in search results/i)).toBeInTheDocument();
        expect(screen.getAllByText(/example\.net\/files\/internal\/q3-audit/).length).toBeGreaterThan(0);
        const preview = screen.getByTitle("Page preview");
        expect(preview.getAttribute("srcdoc")).toContain("router 10.9.4.2");

        // Flip it listed and the banner goes away.
        await user.click(screen.getByRole("button", { name: "visual" }));
        await user.click(screen.getByRole("switch"));
        expect(useEditor.getState().project.websites[0].pages.find((p) => p.id === hidden.id)!.seo).toBe(true);
    });

    it("offers whole-site templates on the empty state", async () => {
        const user = userEvent.setup();
        render(<WebsiteBuilderDialog open onOpenChange={() => {}} />);

        const corp = screen.getByRole("button", { name: /corporate site/i });
        expect(corp).toBeInTheDocument();
        expect(screen.getByText(/hidden internal memo/i)).toBeInTheDocument();
        expect(screen.getByText(/5 pages · 1 hidden/)).toBeInTheDocument();

        await user.click(corp);

        const site = useEditor.getState().project.websites[0];
        expect(site.host).toBe("meridian-capital.net");
        expect(site.pages).toHaveLength(5);
        expect(site.pages.filter((p) => !p.seo)).toHaveLength(1);
        expect(site.pages.find((p) => !p.seo)!.path).toBe("/files/internal/q3-audit");
    });

    it("loads more site templates any time via the add-site picker", async () => {
        const user = userEvent.setup();
        const first = createWebsite();
        act(() => useEditor.getState().addWebsite(first));

        render(<WebsiteBuilderDialog open onOpenChange={() => {}} />);
        await user.click(screen.getByRole("button", { name: "Add website" }));

        // The whole repertoire is offered, not just on the empty state.
        expect(screen.getByRole("button", { name: /newsletter blog/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /forum front page/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /recipe site/i })).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /recipe site/i }));
        const sites = useEditor.getState().project.websites;
        expect(sites).toHaveLength(2);
        const recipe = sites.find((w) => w.host === "butterandbramble.com")!;
        expect(recipe.pages).toHaveLength(2);
        expect(recipe.pages[0].content).toContain("Butter");
    });

    it("duplicates a page so authors can reuse a base design", async () => {
        const user = userEvent.setup();
        const { SITE_TEMPLATES } = await import("@/templates/pages");
        const corp = SITE_TEMPLATES.find((t) => t.id === "corp")!.make();
        act(() =>
            useEditor.getState().addWebsite(
                createWebsite({ host: corp.host, name: corp.name, pages: corp.pages.map((pg) => createPage(pg)) }),
            ),
        );

        render(<WebsiteBuilderDialog open onOpenChange={() => {}} />);
        const before = useEditor.getState().project.websites[0].pages.length;
        await user.click(screen.getAllByRole("button", { name: /^Duplicate page/ })[0]);

        const pages = useEditor.getState().project.websites[0].pages;
        expect(pages).toHaveLength(before + 1);
        const copy = pages.find((pg) => pg.path === "/copy")!;
        expect(copy.title).toBe("Home (copy)");
        expect(copy.content).toContain("Meridian Capital");
    });

    it("edits page meta fields", async () => {
        const user = userEvent.setup();
        const site = createWebsite();
        act(() => useEditor.getState().addWebsite(site));

        render(<WebsiteBuilderDialog open onOpenChange={() => {}} />);
        await user.clear(screen.getByLabelText("Page path"));
        await user.type(screen.getByLabelText("Page path"), "/about");
        expect(useEditor.getState().project.websites[0].pages[0].path).toBe("/about");
    });

    it("edits the search metadata fields", async () => {
        const user = userEvent.setup();
        const site = createWebsite();
        act(() => useEditor.getState().addWebsite(site));

        render(<WebsiteBuilderDialog open onOpenChange={() => {}} />);
        await user.type(screen.getByLabelText("Search result description"), "The bank's public front page");
        await user.type(screen.getByLabelText("Extra search words"), "lcb, meridian bank, , banking");
        const page = useEditor.getState().project.websites[0].pages[0];
        expect(page.description).toBe("The bank's public front page");
        expect(page.search).toEqual(["lcb", "meridian bank", "banking"]);
    });

    it("code view exposes the full document for copy-paste", async () => {
        const user = userEvent.setup();
        const site = createWebsite();
        act(() => useEditor.getState().addWebsite(site));

        render(<WebsiteBuilderDialog open onOpenChange={() => {}} />);
        await user.click(screen.getByRole("button", { name: "code" }));

        const code = screen.getByLabelText("HTML code for /") as HTMLTextAreaElement;
        expect(code.value).toContain("<style>");

        await user.type(code, "<!-- planted clue: 74 68 65 -->");
        expect(useEditor.getState().project.websites[0].pages[0].content).toContain("planted clue");
    });

    it("deleting from a page row asks first and only removes on confirm", async () => {
        const user = userEvent.setup();
        const site = createWebsite({
            pages: [createPage({ path: "/keep", title: "Keep" }), createPage({ path: "/doomed", title: "Doomed" })],
        });
        act(() => useEditor.getState().addWebsite(site));

        render(<WebsiteBuilderDialog open onOpenChange={() => {}} />);
        await user.click(screen.getByRole("button", { name: "Delete page /doomed" }));

        // the confirm dialog shows before anything is deleted
        expect(screen.getByText("Do you really want to delete this page?")).toBeInTheDocument();
        expect(useEditor.getState().project.websites[0].pages).toHaveLength(2);

        await user.click(screen.getByRole("button", { name: "Cancel" }));
        expect(useEditor.getState().project.websites[0].pages).toHaveLength(2);

        await user.click(screen.getByRole("button", { name: "Delete page /doomed" }));
        await user.click(screen.getByRole("button", { name: "Delete page" }));
        const paths = useEditor.getState().project.websites[0].pages.map((p) => p.path);
        expect(paths).toEqual(["/keep"]);
    });

    it("scans uploaded documents for referenced pages and easter eggs", async () => {
        const user = userEvent.setup();
        const { scanDocument } = await import("@/editor/websites/pageDoc");

        const uploaded = [
            '<!doctype html><html><body><a href="/vault">v</a><a href="/vault">dup</a>',
            '<a href="#top">t</a><div id="top">top</div><form><input type="hidden" value="74"></form>',
            "<!-- temp password: hunter2 --><script>go()</script></body></html>",
        ].join("");
        const scan = scanDocument(uploaded);
        expect(scan.linkedPaths).toEqual(["/vault"]);
        expect(scan.anchors).toEqual(["top"]);
        expect(scan.comments).toEqual(["temp password: hunter2"]);
        expect(scan.scripts).toBe(1);
        expect(scan.forms).toBe(1);
        expect(scan.hiddenBits).toBe(1);

        const site = createWebsite();
        act(() => useEditor.getState().addWebsite(site));
        render(<WebsiteBuilderDialog open onOpenChange={() => {}} />);
        act(() => useEditor.getState().updatePage(site.id, site.pages[0].id, { content: uploaded }));

        expect(await screen.findByText(/don't exist yet/)).toBeInTheDocument();
        expect(screen.getByText("/vault")).toBeInTheDocument();
        expect(screen.getByText(/temp password: hunter2/)).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /create the missing page/i }));
        const pages = useEditor.getState().project.websites[0].pages;
        expect(pages).toHaveLength(2);
        expect(pages.map((p) => p.path).sort()).toEqual(["/", "/vault"]);
    });

    it("the naza agency site is a real multi-page site with a hidden helpdesk page", async () => {
        const { SITE_TEMPLATES } = await import("@/templates/pages");
        const { scanDocument } = await import("@/editor/websites/pageDoc");
        const agency = SITE_TEMPLATES.find((t) => t.id === "agency")!.make();

        // every linked path is a page of the site — no dead links for players
        const paths = agency.pages.map((p) => p.path);
        expect(paths).toContain("/portal");
        for (const p of agency.pages) {
            for (const linked of scanDocument(p.content).linkedPaths) {
                expect(paths, `${p.path} links to ${linked}`).toContain(linked);
            }
        }

        // the unlisted helpdesk page is the dirhunter target
        const helpdesk = agency.pages.find((p) => p.path === "/it/helpdesk")!;
        expect(helpdesk.seo).toBe(false);
        expect(helpdesk.content).toContain("tre");
        expect(helpdesk.content).toContain("NZA-3419");

        // the portal keeps its form, denial script and view-source clue
        const portal = agency.pages.find((p) => p.path === "/portal")!;
        const portalScan = scanDocument(portal.content);
        expect(portalScan.forms).toBe(1);
        expect(portalScan.scripts).toBe(1);
        expect(portalScan.comments.join(" ")).toContain("temp resets");

        // the design survived: home still has the orbit hero and gov bar
        const home = agency.pages.find((p) => p.path === "/")!;
        expect(home.content).toContain("gov-bar");
        expect(home.content).toContain("Halcyon Space Telescope");
    });

    it("the AI website prompt popout teaches the LLM the game's quirks", async () => {
        const user = userEvent.setup();
        const writeText = vi.fn().mockResolvedValue(undefined);
        vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
        const site = createWebsite();
        act(() => useEditor.getState().addWebsite(site));
        render(<WebsiteBuilderDialog open onOpenChange={() => {}} />);

        await user.click(screen.getByRole("button", { name: /AI website prompt/ }));
        expect(screen.getByText("Ask an AI to build your website")).toBeInTheDocument();

        await user.type(
            screen.getByLabelText("Website idea"),
            "a bakery that hides its door code",
        );
        const prompt = (screen.getByLabelText("Generated prompt") as HTMLTextAreaElement).value;
        expect(prompt).toContain("a bakery that hides its door code");
        expect(prompt).toContain("NO internet");
        expect(prompt).toContain(".html file per page");
        expect(prompt).toContain('href="/news"');
        expect(prompt).toContain("NOT linked from the navigation");

        await user.click(screen.getByRole("button", { name: "Copy prompt" }));
        await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining("bakery")));
        vi.unstubAllGlobals();
    });

    it("code view offers a Format button that pretty-prints the document", async () => {
        const user = userEvent.setup();
        const site = createWebsite();
        act(() => useEditor.getState().addWebsite(site));
        render(<WebsiteBuilderDialog open onOpenChange={() => {}} />);
        await user.click(screen.getByRole("button", { name: "code" }));

        const code = screen.getByLabelText("HTML code for /") as HTMLTextAreaElement;
        await user.clear(code);
        await user.type(code, '<!doctype html><html><body><div><p>a</p><p>b</p></div></body></html>');
        await user.click(screen.getByRole("button", { name: /Format/ }));

        await waitFor(() => {
            const value = (screen.getByLabelText("HTML code for /") as HTMLTextAreaElement).value;
            expect(value).toMatch(/\n\s+<p>a<\/p>/);
        });
    });

    it("loads a finished html file, wrapping bare fragments", async () => {
        const user = userEvent.setup();
        const site = createWebsite();
        act(() => useEditor.getState().addWebsite(site));

        render(<WebsiteBuilderDialog open onOpenChange={() => {}} />);

        const full = new File(
            ["<!doctype html><html><head><style>body{background:#000}</style></head><body><h1>leak</h1></body></html>"],
            "leak.html",
            { type: "text/html" },
        );
        await user.upload(screen.getByLabelText("Load HTML file"), full);
        expect(useEditor.getState().project.websites[0].pages[0].content).toContain("<h1>leak</h1>");

        const fragment = new File(["<p>just a body</p>"], "body.html", { type: "text/html" });
        await user.upload(screen.getByLabelText("Load HTML file"), fragment);
        const content = useEditor.getState().project.websites[0].pages[0].content;
        expect(content).toContain("<!doctype html>");
        expect(content).toContain("<p>just a body</p>");
    });
});

describe("visual and code editors in isolation", () => {
    it("visual editor is an isolated iframe with a toolbar and image inserter", () => {
        render(
            <VisualPageEditor doc="<p>y</p>" onChange={() => {}} ariaLabel="Visual editor for /" />,
        );
        const frame = screen.getByTitle("Visual editor for /");
        expect(frame.getAttribute("srcdoc")).toBe("<p>y</p>");
        expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
        expect(screen.getByLabelText("Image file to insert")).toBeInTheDocument();
        expect(screen.getByText(/images are embedded/)).toBeInTheDocument();
    });

    it("code editor is a plain textarea over the document", async () => {
        const user = userEvent.setup();
        function Harness() {
            const [value, setValue] = useState("<p>a</p>");
            return <CodePageEditor doc={value} onChange={setValue} ariaLabel="code" />;
        }
        render(<Harness />);
        const code = screen.getByLabelText("code") as HTMLTextAreaElement;
        await user.type(code, "more");
        expect(code.value).toBe("<p>a</p>more");
    });
});
