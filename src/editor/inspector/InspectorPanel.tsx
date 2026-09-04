/**
 * The inspector: node fields when something is selected, otherwise quest and mod
 * settings. One panel, three tabs, so the author never has to hunt for where a
 * setting lives.
 */
import { useEffect, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/Icon";
import { categoryOf, nodeTypeDef } from "@/schema/registry";
import { selectActiveQuest, selectSelectedNode, useEditor } from "@/store/editor";
import { Field } from "./Field";
import { ImagePickerField, TagInput } from "./ModFields";
import { FieldShell, NumberInput, SelectInput, TextArea, TextInput, Toggle } from "./primitives";
import { NODE_SIM_EDITORS } from "./sims";

const TABS = [
    { value: "node", label: "Node" },
    { value: "quest", label: "Quest" },
    { value: "mod", label: "Mod" },
] as const;

type TabId = (typeof TABS)[number]["value"];

export function InspectorPanel() {
    const node = useEditor(selectSelectedNode);
    const [tab, setTab] = useState<TabId>("quest");

    // Follow the selection: picking a node shows its fields, deselecting returns
    // to the quest.
    useEffect(() => {
        setTab((current) => (node ? "node" : current === "node" ? "quest" : current));
    }, [node]);

    return (
        <Tabs.Root
            value={tab}
            onValueChange={(v) => setTab(v as TabId)}
            className="flex h-full min-h-0 flex-col"
        >
            <Tabs.List className="flex shrink-0 items-center gap-px border-b border-line bg-surface px-1 pt-1">
                {TABS.map((t) => (
                    <Tabs.Trigger
                        key={t.value}
                        value={t.value}
                        disabled={t.value === "node" && !node}
                        className={cn(
                            "rounded-t-md border border-b-0 px-3 py-1.5 text-[11.5px] font-medium transition-colors",
                            "border-transparent text-ink-4 hover:text-ink-2",
                            "data-[state=active]:border-line data-[state=active]:bg-surface data-[state=active]:text-ink",
                            "disabled:pointer-events-none disabled:opacity-40",
                        )}
                    >
                        {t.label}
                    </Tabs.Trigger>
                ))}
            </Tabs.List>

            <div className="min-h-0 flex-1 overflow-y-auto bg-surface">
                <Tabs.Content value="node" className="data-[state=inactive]:hidden">
                    {node ? <NodeInspector nodeId={node.id} /> : <Empty>Select a node.</Empty>}
                </Tabs.Content>
                <Tabs.Content value="quest" className="data-[state=inactive]:hidden">
                    <QuestInspector />
                </Tabs.Content>
                <Tabs.Content value="mod" className="data-[state=inactive]:hidden">
                    <ModInspector />
                </Tabs.Content>
            </div>
        </Tabs.Root>
    );
}

/* ── Node ──────────────────────────────────────────────────────────────── */

function NodeInspector({ nodeId }: { nodeId: string }) {
    const node = useEditor(selectSelectedNode);
    const removeNodes = useEditor((s) => s.removeNodes);
    if (!node) return <Empty>Select a node.</Empty>;

    const def = nodeTypeDef(node.type);
    const category = categoryOf(node.type);
    const SimEditor = NODE_SIM_EDITORS[node.type];

    return (
        <div className="pb-8">
            <div className="flex items-start gap-2.5 border-b border-line px-3 py-3">
                <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-md"
                    style={{
                        background: `color-mix(in srgb, ${category.color} 16%, transparent)`,
                        color: category.color,
                    }}
                    aria-hidden
                >
                    <Icon name={def.icon} size={16} />
                </span>
                <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[13.5px] leading-tight font-semibold text-ink">
                        {def.label}
                    </h2>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-ink-2">{def.blurb}</p>
                </div>
                <button
                    type="button"
                    className="btn-icon text-ink-4 hover:text-danger"
                    onClick={() => removeNodes([node.id])}
                    title="Delete node"
                    aria-label="Delete node"
                >
                    <Icon name="trash" size={14} />
                </button>
            </div>

            {SimEditor && <SimEditor node={node} />}

            <div className="pt-1">
                {def.fields.map((field, i) => (
                    <Field
                        key={"key" in field ? field.key : `${i}-${field.kind}`}
                        def={field}
                        nodeId={nodeId}
                    />
                ))}
            </div>
        </div>
    );
}

/* ── Quest ─────────────────────────────────────────────────────────────── */

function QuestInspector() {
    const quest = useEditor(selectActiveQuest);
    const updateQuest = useEditor((s) => s.updateQuest);
    if (!quest) return <Empty>No quest selected.</Empty>;

    const write = (patch: Parameters<typeof updateQuest>[1]) => updateQuest(quest.id, patch);

    const objectiveCount = quest.graph.nodes.filter((n) => n.type === "objective").length;
    const noCompletionPath = quest.graph.nodes.filter(
        (n) => n.type === "objective" && !quest.graph.edges.some((e) => e.target === n.id && e.kind === "condition"),
    ).length;

    return (
        <div className="pb-8">
            <Section>Identity</Section>
            <FieldShell label="Quest identifier" hint="A unique name for this quest, not shown to players. Other quests use it to unlock only after this one is finished.">
                <TextInput
                    ariaLabel="Quest identifier"
                    value={quest.name}
                    onChange={(name) => write({ name })}
                    mono
                />
            </FieldShell>
            <FieldShell label="Display title">
                <TextInput ariaLabel="Display title" value={quest.title} onChange={(title) => write({ title })} />
            </FieldShell>
            <FieldShell label="Description">
                <TextArea
                    ariaLabel="Description"
                    value={quest.description}
                    onChange={(description) => write({ description })}
                    rows={3}
                />
            </FieldShell>
            <FieldShell label="Journal group">
                <SelectInput
                    ariaLabel="Journal group"
                    value={quest.group}
                    onChange={(group) => write({ group: group as typeof quest.group })}
                    options={[
                        { value: "sandbox", label: "Sandbox" },
                        { value: "side", label: "Side quest" },
                        { value: "storyline", label: "Storyline" },
                    ]}
                />
            </FieldShell>

            <Section>Rewards</Section>
            <div className="grid grid-cols-2 gap-2 px-3 py-2">
                <div>
                    <label className="field-label" htmlFor="quest-money">
                        Money
                    </label>
                    <NumberInput
                        id="quest-money"
                        value={quest.rewards.money}
                        onChange={(money) => write({ rewards: { ...quest.rewards, money } })}
                        min={0}
                    />
                </div>
                <div>
                    <label className="field-label" htmlFor="quest-xp">
                        XP
                    </label>
                    <NumberInput
                        id="quest-xp"
                        value={quest.rewards.xp}
                        onChange={(xp) => write({ rewards: { ...quest.rewards, xp } })}
                        min={0}
                    />
                </div>
            </div>

            <Section>Behaviour</Section>
            <Toggle
                label="Start automatically"
                hint="Claimed as soon as its prerequisites are met, with no player action."
                checked={quest.autoStart}
                onChange={(autoStart) => write({ autoStart })}
            />
            <Toggle
                label="Complete automatically"
                hint="Best left off. HackHub 1.1.2 freezes whenever it finishes a quest that came from a mod, whether that happens automatically or through a complete button, so quests are built to end their story without formally completing."
                checked={quest.autoComplete}
                onChange={(autoComplete) => write({ autoComplete })}
            />
            <Toggle
                label="Player can abandon"
                checked={quest.abandonable}
                onChange={(abandonable) => write({ abandonable })}
            />
            <Toggle
                label="Show a manual complete button"
                hint="Also best left off, for the same reason: pressing it freezes the game."
                checked={quest.hasCompleteButton}
                onChange={(hasCompleteButton) => write({ hasCompleteButton })}
            />
            <Toggle
                label="Tidy the objective list when the story ends"
                hint="Once every objective is done, hide them so the panel is not left full of finished steps."
                checked={quest.hideObjectivesWhenDone}
                onChange={(hideObjectivesWhenDone) => write({ hideObjectivesWhenDone })}
            />
            <FieldShell
                label="Closing line"
                hint="Shown as a single ticked item once the story is over. Worth filling in: without it the panel reads 0/0 completed."
            >
                <TextInput
                    ariaLabel="Closing objective line"
                    value={quest.closingObjectiveText}
                    onChange={(closingObjectiveText) => write({ closingObjectiveText })}
                />
            </FieldShell>

            <Section>Employer</Section>
            <FieldShell label="First name" hint="Left blank, the game generates an employer for you.">
                <TextInput
                    ariaLabel="Employer first name"
                    value={quest.employer.firstName ?? ""}
                    onChange={(firstName) => write({ employer: { ...quest.employer, firstName } })}
                />
            </FieldShell>
            <FieldShell label="Last name">
                <TextInput
                    ariaLabel="Employer last name"
                    value={quest.employer.lastName ?? ""}
                    onChange={(lastName) => write({ employer: { ...quest.employer, lastName } })}
                />
            </FieldShell>
            <FieldShell label="E-mail">
                <TextInput
                    ariaLabel="Employer e-mail"
                    value={quest.employer.email ?? ""}
                    onChange={(email) => write({ employer: { ...quest.employer, email } })}
                    mono
                />
            </FieldShell>

            <Section>Health</Section>
            <div className="px-3 py-2 text-[11.5px] leading-relaxed text-ink-3">
                <p>
                    {objectiveCount} objective{objectiveCount === 1 ? "" : "s"} on this quest.
                </p>
                {noCompletionPath > 0 && (
                    <p className="mt-1.5 flex items-start gap-1.5 text-warn">
                        <Icon name="alert" size={12} className="mt-px shrink-0" />
                        {noCompletionPath} objective{noCompletionPath === 1 ? " has" : "s have"} no
                        trigger wired in, so the player can never complete{" "}
                        {noCompletionPath === 1 ? "it" : "them"}.
                    </p>
                )}
            </div>
        </div>
    );
}

/* ── Mod ───────────────────────────────────────────────────────────────── */

function ModInspector() {
    const mod = useEditor((s) => s.project.mod);
    const updateMod = useEditor((s) => s.updateMod);
    const questCount = useEditor((s) => s.project.quests.length);

    return (
        <div className="pb-8">
            <div className="border-b border-line px-3 py-3">
                <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-md bg-accent-soft text-accent">
                        <Icon name="package" size={16} />
                    </span>
                    <div>
                        <h2 className="text-[13.5px] leading-tight font-semibold text-ink">
                            {mod.name || "Untitled mod"}
                        </h2>
                        <p className="mt-0.5 font-mono text-[10.5px] text-ink-4">
                            {mod.id} · v{mod.version} · {questCount} quest
                            {questCount === 1 ? "" : "s"}
                        </p>
                    </div>
                </div>
            </div>

            <Section>Identity</Section>
            <FieldShell label="Mod id" hint="Lowercase and hyphens. Must be unique across all mods.">
                <TextInput ariaLabel="Mod id" value={mod.id} onChange={(id) => updateMod({ id })} mono />
            </FieldShell>
            <FieldShell label="Display name">
                <TextInput ariaLabel="Display name" value={mod.name} onChange={(name) => updateMod({ name })} />
            </FieldShell>
            <FieldShell label="Version" hint="A number for this release, like 1.0.0. Increase it before every Workshop upload so players get the update.">
                <TextInput
                    ariaLabel="Version"
                    value={mod.version}
                    onChange={(version) => updateMod({ version })}
                    mono
                />
            </FieldShell>
            <FieldShell label="Author">
                <TextInput
                    ariaLabel="Author"
                    value={mod.author}
                    onChange={(author) => updateMod({ author })}
                />
            </FieldShell>
            <FieldShell label="Description">
                <TextArea
                    ariaLabel="Description"
                    value={mod.description}
                    onChange={(description) => updateMod({ description })}
                    rows={3}
                />
            </FieldShell>

            <Section>Permissions</Section>
            <p className="px-3 py-2 text-[11.5px] leading-relaxed text-ink-3">
                Permissions are{" "}
                <strong className="font-semibold text-ink-2">derived from your graph</strong> at
                export time, not typed here. Omitting them silently grants every permission, so the
                editor computes exactly the set your nodes need and shows it in the export report.
            </p>

            <Section>Workshop</Section>
            <ImagePickerField
                label="Cover image"
                hint="The big picture on your mod's card. 16:9, at least 640×360."
                ariaLabel="Cover image file"
                value={mod.cover}
                onChange={(cover) => updateMod({ cover })}
            />
            <ImagePickerField
                label="Icon"
                hint="The small square logo shown next to your mod's name."
                ariaLabel="Icon file"
                value={mod.icon}
                onChange={(icon) => updateMod({ icon })}
            />
            <FieldShell label="Tags" hint="Used for Workshop categorisation. Press Enter or a comma to add a tag; suggestions appear as you type.">
                <TagInput
                    ariaLabel="Add a tag"
                    value={mod.tags}
                    onChange={(tags) => updateMod({ tags })}
                />
            </FieldShell>
        </div>
    );
}

/* ── bits ──────────────────────────────────────────────────────────────── */

function Section({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="mt-3 mb-1 border-y border-line bg-surface-2/60 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-ink-3 uppercase first:mt-0">
            {children}
        </h3>
    );
}

function Empty({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <Icon name="sliders" size={20} className="text-ink-4" />
            <p className="text-[12px] text-ink-4">{children}</p>
        </div>
    );
}
