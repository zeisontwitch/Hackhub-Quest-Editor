/**
 * The Twotter panel (r185): every character the mod has on the in-game social
 * network, in one place.
 *
 * Accounts are MOD-level, so this panel is the only place they are authored —
 * the Tweet node picks one. Two things it deliberately says out loud, because
 * an author cannot see either from the fields:
 *
 *  - the HANDLE is what the game's search matches, so a handle the game will
 *    not accept is a clue the player can never find. The compiler refuses to
 *    export it quietly; this panel says it while you type.
 *  - the REMOVAL rule. The runtime cleans a mod's accounts up when the last
 *    quest that needs them ends — the SDK requires it (accounts otherwise live
 *    in the player's save forever) — unless the author wants the character to
 *    outlive the story.
 *
 * Stage 2 (r188) gives it a face: the right-hand side is the profile the game
 * will draw, and clicking a part of that profile turns it into the field for
 * that part. The fields are all still here — they are just wearing a jacket.
 */
import { useMemo, useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/Icon";
import { EmptyHint, FieldShell, NumberInput, Toggle } from "@/editor/inspector/primitives";
import { TWOTTER_HANDLE_PATTERN, createTwotterAccount } from "@/schema/project";
import type { QuestDoc, TwotterAccountDoc } from "@/schema/project";
import { tweetAgeLabel, tweetAgeMs } from "@/schema/twotter";
import { MockProfile } from "./MockProfile";
import { TweetTimeline, type PreviewTweet } from "./TweetTimeline";
import { useEditor } from "@/store/editor";

/** Letters, numbers and `_`, 3–15 — the same rule the compiler enforces. */
function handleProblem(account: TwotterAccountDoc, accounts: TwotterAccountDoc[]): string | null {
    const handle = account.handle.replace(/^@/, "").trim();
    /* A nameless account is not an error the way a broken handle is, but it does
       read as one on screen: every post is shown under a blank name line. There
       is a reason this is a nudge and not a rule — see `MockProfile`'s note: the
       game fills a name in only for a record that never carried one, and the
       editor always sends what the author typed. */
    if (!account.displayName.trim()) {
        return "Give the account a display name. Without one, every post from this account is shown under an empty name — the editor cannot make one up on the game's behalf.";
    }
    if (!handle) return "Give the account a handle. It is what players type into Twotter's search.";
    if (!TWOTTER_HANDLE_PATTERN.test(handle)) {
        return "Handles take letters, numbers and underscores, three to fifteen characters. The game's search will not find an account whose handle breaks that rule.";
    }
    const clash = accounts.find(
        (a) => a.id !== account.id && a.handle.replace(/^@/, "").trim().toLowerCase() === handle.toLowerCase(),
    );
    if (clash) return `Another account already uses @${handle}. Handles are what players search for, so only one of them can be found.`;
    return null;
}

/** Where this account posts from, across every quest in the mod. */
function usesOf(accountId: string, quests: QuestDoc[]): { quest: string; nodes: number }[] {
    const hits: { quest: string; nodes: number }[] = [];
    for (const quest of quests) {
        const nodes = quest.graph.nodes.filter(
            (n) => n.type === "comms.tweet" && n.data.accountId === accountId,
        ).length;
        if (nodes) hits.push({ quest: quest.title, nodes });
    }
    return hits;
}

/**
 * Everything this account has ever posted, across every quest, in the game's
 * order. The panel's question is "who is this character", and what they said is
 * most of the answer — it is also the only place an author can see a handle's
 * posts side by side when two quests post from the same account.
 */
function postsOf(accountId: string, quests: QuestDoc[]): PreviewTweet[] {
    const out: PreviewTweet[] = [];
    for (const quest of quests) {
        for (const node of quest.graph.nodes) {
            if (node.type !== "comms.tweet" || node.data.accountId !== accountId) continue;
            for (const row of node.data.tweets) {
                out.push({
                    id: `${quest.id}:${node.id}:${row.id}`,
                    content: row.content,
                    age: tweetAgeLabel(row),
                    ageMs: tweetAgeMs(row),
                    stalePicture: !!row.image,
                    likes: row.likes,
                    comments: row.comments,
                    shares: row.shares,
                    views: row.views,
                    showInTimeline: row.showInTimeline,
                    migrated: !!node.data.migratedDate && row.timeMode === "earlier",
                    quest: quest.title || quest.name,
                });
            }
        }
    }
    return out;
}

export function TwotterPanelDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const accounts = useEditor((s) => s.project.twotterAccounts);
    const quests = useEditor((s) => s.project.quests);
    const addTwotterAccount = useEditor((s) => s.addTwotterAccount);
    const removeTwotterAccount = useEditor((s) => s.removeTwotterAccount);
    const updateTwotterAccount = useEditor((s) => s.updateTwotterAccount);
    const toast = useEditor((s) => s.toast);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const account = accounts.find((a) => a.id === selectedId) ?? accounts[0] ?? null;
    const problem = useMemo(
        () => (account ? handleProblem(account, accounts) : null),
        [account, accounts],
    );
    const uses = useMemo(() => (account ? usesOf(account.id, quests) : []), [account, quests]);
    const posts = useMemo(() => (account ? postsOf(account.id, quests) : []), [account, quests]);

    const patch = (next: Partial<Omit<TwotterAccountDoc, "id">>) => {
        if (account) updateTwotterAccount(account.id, next);
    };

    return (
        <>
            <Dialog.Root open={open} onOpenChange={onOpenChange}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-40 bg-void/70 backdrop-blur-[2px]" />
                    <Dialog.Content
                        className={cn(
                            "fixed top-1/2 left-1/2 z-50 flex h-[76vh] w-[min(940px,94vw)] -translate-x-1/2 -translate-y-1/2",
                            "flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-panel",
                        )}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3">
                            <div>
                                <Dialog.Title className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                                    <Icon name="bird" size={14} />
                                    Twotter accounts
                                </Dialog.Title>
                                <Dialog.Description className="mt-0.5 text-[11.5px] text-ink-4">
                                    The characters this mod has on Twotter. Every quest can post from them, so a
                                    face can carry a story across the whole mod.
                                </Dialog.Description>
                            </div>
                            <Dialog.Close asChild>
                                <button type="button" className="btn-icon" aria-label="Close">
                                    <Icon name="x" size={14} />
                                </button>
                            </Dialog.Close>
                        </div>

                        <div className="flex min-h-0 flex-1">
                            {/* ── the account list ── */}
                            <div className="flex w-[260px] shrink-0 flex-col border-r border-line">
                                <div className="border-b border-line p-2">
                                    <button
                                        type="button"
                                        className="btn-default w-full justify-center"
                                        onClick={() => {
                                            const created = createTwotterAccount({});
                                            addTwotterAccount(created);
                                            setSelectedId(created.id);
                                            toast("New account added — give it a handle.");
                                        }}
                                    >
                                        <Icon name="plus" size={13} />
                                        New account
                                    </button>
                                </div>
                                <div className="min-h-0 flex-1 overflow-y-auto p-2">
                                    {accounts.length === 0 && (
                                        <EmptyHint>
                                            No accounts yet. Add one, then point a Twotter node at it.
                                        </EmptyHint>
                                    )}
                                    {accounts.map((a) => {
                                        const active = account?.id === a.id;
                                        const bad = handleProblem(a, accounts);
                                        return (
                                            <button
                                                key={a.id}
                                                type="button"
                                                onClick={() => setSelectedId(a.id)}
                                                className={cn(
                                                    "mb-1 flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left",
                                                    active
                                                        ? "border-cat-comms/60 bg-cat-comms/10"
                                                        : "border-transparent hover:border-line hover:bg-surface-3",
                                                )}
                                            >
                                                {a.avatar ? (
                                                    <img
                                                        src={a.avatar}
                                                        alt=""
                                                        className="h-7 w-7 shrink-0 rounded-full border border-line object-cover"
                                                    />
                                                ) : (
                                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface-3 text-ink-4">
                                                        <Icon name="bird" size={12} />
                                                    </span>
                                                )}
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-[12px] text-ink">
                                                        {a.displayName || "Unnamed character"}
                                                    </span>
                                                    <span className="block truncate font-mono text-[10.5px] text-ink-4">
                                                        @{a.handle || "handle-missing"}
                                                    </span>
                                                </span>
                                                {bad && (
                                                    <span className="shrink-0 text-warn" title={bad}>
                                                        <Icon name="alert" size={12} />
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ── the selected account ── */}
                            {/* ── the selected account ── */}
                            <div className="min-h-0 flex-1 overflow-y-auto p-4">
                                {!account ? (
                                    <EmptyHint>Select an account, or add one.</EmptyHint>
                                ) : (
                                    <div className="space-y-3">
                                        {problem && (
                                            <p className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-[11.5px] leading-relaxed text-warn">
                                                {problem}
                                            </p>
                                        )}

                                        <p className="text-[11px] leading-relaxed text-ink-4">
                                            This is the profile as the game draws it.{" "}
                                            <span className="text-ink-3">
                                                Click the banner, the picture, the name, the handle or the bio and
                                                that part becomes a field right where it sits.
                                            </span>{" "}
                                            Leave either picture blank and the game draws its own — that is what a
                                            blank picture is for. The name, handle, bio and counts are sent
                                            exactly as written; a blank bio stays blank on purpose (a{" "}
                                            <em>missing</em> bio is the shape that once crashed Twotter's search).
                                        </p>

                                        <MockProfile
                                            account={account}
                                            onPatch={patch}
                                            footer={
                                                <>
                                                    The game lays this card out itself, so this is a preview, not a
                                                    promise. What travels to the game is the text and the two
                                                    pictures — nothing here is drawn by us in game.
                                                </>
                                            }
                                        />

                                        <div className="grid grid-cols-2 gap-3">
                                            <FieldShell
                                                label="Followers"
                                                hint="Cosmetic, and worth getting right: a brand-new account with forty thousand followers reads as fake."
                                            >
                                                <NumberInput
                                                    ariaLabel="Followers"
                                                    min={0}
                                                    step={1}
                                                    value={account.followers}
                                                    onChange={(followers) => patch({ followers })}
                                                />
                                            </FieldShell>
                                            <FieldShell
                                                label="Following"
                                                hint="How many accounts this one follows. Small next to the follower count is normal for a public figure."
                                            >
                                                <NumberInput
                                                    ariaLabel="Following"
                                                    min={0}
                                                    step={1}
                                                    value={account.following}
                                                    onChange={(following) => patch({ following })}
                                                />
                                            </FieldShell>
                                        </div>

                                        <FieldShell
                                            label="Verified"
                                            hint="The blue check. Give it to a company, a newsroom, an official account — not to somebody who is hiding. Clicking the check up on the profile flips it too."
                                        >
                                            <Toggle
                                                checked={account.verified}
                                                onChange={(verified) => patch({ verified })}
                                                label={account.verified ? "Verified" : "Not verified"}
                                            />
                                        </FieldShell>

                                        <FieldShell
                                            label="Remove when the story ends"
                                            hint="On (the usual choice) deletes the account with the last quest that needs it, so the player's save is not left full of your characters. Off keeps it after the mod is finished — the player can still look the profile up."
                                        >
                                            <Toggle
                                                checked={account.removeWhenQuestEnds}
                                                onChange={(removeWhenQuestEnds) => patch({ removeWhenQuestEnds })}
                                                label={
                                                    account.removeWhenQuestEnds
                                                        ? "Removed when the last quest that uses it ends"
                                                        : "Stays in the player's save"
                                                }
                                            />
                                        </FieldShell>

                                        <div className="rounded-lg border border-line bg-surface-3 px-3 py-2">
                                            <p className="text-[11px] font-semibold tracking-wide text-ink-3">
                                                Used by
                                            </p>
                                            {uses.length === 0 ? (
                                                <p className="mt-1 text-[11.5px] text-ink-4">
                                                    No Twotter node posts from this account yet.
                                                </p>
                                            ) : (
                                                <ul className="mt-1 space-y-0.5">
                                                    {uses.map((u) => (
                                                        <li key={u.quest} className="text-[11.5px] text-ink-3">
                                                            {u.quest} — {u.nodes} node{u.nodes === 1 ? "" : "s"}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>

                                        <div className="rounded-lg border border-line bg-surface-3 px-3 py-2.5">
                                            <TweetTimeline
                                                tweets={posts}
                                                displayName={account.displayName}
                                                handle={account.handle}
                                                avatar={account.avatar}
                                                heading="What this account has posted"
                                                emptyText="Nothing yet. A Twotter node that points at this account adds its posts here."
                                                compact
                                            />
                                        </div>

                                        <div className="flex justify-end border-t border-line pt-3">
                                            <button
                                                type="button"
                                                className="btn-default text-danger"
                                                onClick={() => setConfirmDelete(true)}
                                            >
                                                <Icon name="trash" size={13} />
                                                Delete account
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            <AlertDialog.Root open={confirmDelete} onOpenChange={setConfirmDelete}>
                <AlertDialog.Portal>
                    <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-void/70 backdrop-blur-[2px]" />
                    <AlertDialog.Content className="fixed top-1/2 left-1/2 z-[70] w-[min(430px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-line bg-surface p-4 shadow-panel">
                        <AlertDialog.Title className="text-[13px] font-semibold text-ink">
                            Delete {account?.displayName ? account.displayName : "this account"}?
                        </AlertDialog.Title>
                        <AlertDialog.Description className="mt-1 text-[11.5px] leading-relaxed text-ink-3">
                            {uses.length
                                ? `${uses.length} quest${uses.length === 1 ? "" : "s"} still post from @${account?.handle || "this account"}. Those nodes keep a pointer to an account that is gone: they post nothing, and the export report names them.`
                                : `@${account?.handle || "this account"} is not used by any node, so nothing else changes.`}
                        </AlertDialog.Description>
                        <div className="mt-4 flex justify-end gap-2">
                            <AlertDialog.Cancel asChild>
                                <button type="button" className="btn-default">
                                    Keep it
                                </button>
                            </AlertDialog.Cancel>
                            <AlertDialog.Action asChild>
                                <button
                                    type="button"
                                    className="btn-primary bg-danger"
                                    onClick={() => {
                                        if (account) removeTwotterAccount(account.id);
                                        setSelectedId(null);
                                    }}
                                >
                                    Delete account
                                </button>
                            </AlertDialog.Action>
                        </div>
                    </AlertDialog.Content>
                </AlertDialog.Portal>
            </AlertDialog.Root>
        </>
    );
}
