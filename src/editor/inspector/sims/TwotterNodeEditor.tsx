/**
 * The Twotter node's inspector face (stage 2, r188).
 *
 * The node holds a series of posts, so the inspector shows the profile those
 * posts add up to: the account's banner, face, name, handle and bio, above the
 * posts themselves in the order the game will show them (newest first). The
 * rows below this read-only preview stay exactly what they were — the list the
 * author writes, oldest first — because the two orders mean different things
 * and the node should not hide either.
 *
 * It is read-only on purpose: an account is shared by every quest, so editing it
 * from one node would quietly change what other quests post. "Edit this account"
 * opens the panel where accounts live.
 *
 * Pictures are not previewed here: the SDK's `TwotterTweet` has no picture field
 * (r187, §10 of the developer questions), so a picture on a row would be a lie
 * about what the player sees.
 */
import { Icon } from "@/components/Icon";
import { EmptyHint } from "@/editor/inspector/primitives";
import { MockProfile } from "@/editor/twotter/MockProfile";
import { TweetTimeline, type PreviewTweet } from "@/editor/twotter/TweetTimeline";
import type { NodeOfType } from "@/schema/nodes";
import { tweetAgeLabel, tweetAgeMs } from "@/schema/twotter";
import { useEditor } from "@/store/editor";

export function TwotterNodeEditor({ node }: { node: NodeOfType<"comms.tweet"> }) {
    const quest = useEditor((s) => s.project.quests.find((q) => q.graph.nodes.some((n) => n.id === node.id)));
    const account = useEditor((s) => s.project.twotterAccounts.find((a) => a.id === node.data.accountId));
    const setUi = useEditor((s) => s.setUi);

    const tweets: PreviewTweet[] = node.data.tweets.map((row, i) => ({
        id: row.id || `row-${i}`,
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
        // Exactly one row can arrive with the story in the usual case, but an
        // author may write several; they all post as the node runs, so they all
        // get the shimmer.
        shimmer: row.timeMode === "arrival",
    }));

    return (
        <div className="grid gap-2 px-3 pt-2">
            {!account ? (
                <EmptyHint>
                    This node has no account yet. Pick one below, or{" "}
                    <button
                        type="button"
                        className="underline decoration-dotted hover:text-ink-2"
                        onClick={() => setUi({ modal: "twotter" })}
                    >
                        create one
                    </button>
                    .
                </EmptyHint>
            ) : (
                <>
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold tracking-wide text-ink-3">
                            The profile this node posts from
                        </p>
                        <button
                            type="button"
                            className="flex items-center gap-1 text-[10.5px] text-cat-comms hover:underline"
                            onClick={() => setUi({ modal: "twotter" })}
                        >
                            <Icon name="user" size={11} />
                            Edit this account
                        </button>
                    </div>

                    <MockProfile
                        account={account}
                        footer={
                            <>
                                Read-only here — the account is shared by every quest, so it is edited in the
                                Twotter panel{quest ? ` (“${quest.title || quest.name}” posts from it)` : ""}.
                            </>
                        }
                    />

                    <div className="mt-1 border-t border-line pt-2.5">
                        <TweetTimeline
                            tweets={tweets}
                            displayName={account.displayName}
                            handle={account.handle}
                            avatar={account.avatar}
                            emptyText="No tweets on this node yet — add a row below and it appears here as the player will read it."
                            compact
                        />
                        {tweets.length > 0 && (
                            <p className="mt-1.5 text-[10px] leading-relaxed text-ink-4">
                                This is the profile once the node has run. The rows below stay in the order you
                                wrote them — oldest first, the way it happened — and the game turns them over for
                                you. The newest post {tweets.some((t) => t.shimmer) ? "appears as the story runs" : "is the one you wrote last"}.
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
