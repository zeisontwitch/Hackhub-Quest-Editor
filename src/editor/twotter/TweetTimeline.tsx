/**
 * The tweet list, drawn the way the game draws a profile (r188).
 *
 * Two rules it exists to make visible at a glance:
 *
 *  - **the game's order.** Oldest-first is how an author WRITES a history ("the
 *    way it happened"), and the game shows the other way up. The node's list
 *    stays chronological; this list is sorted so the two are never confused.
 *  - **the age.** A backdated tweet reads "a month ago" the moment the player
 *    finds the profile; a tweet that arrives with the story is the newest thing
 *    on it. The label comes from the same helper the compiler uses, so the
 *    preview cannot drift away from what the runtime sends.
 */
import { cn } from "@/lib/cn";
import { Icon } from "@/components/Icon";

export interface PreviewTweet {
    id: string;
    content: string;
    /** How the game will word the age ("a month ago", "a few seconds ago"). */
    age: string;
    /** Raw age for ordering; 0 means "arrives with the story". */
    ageMs: number;
    /**
     * The row carries a picture that came from an older draft. It is NOT shown:
     * the game has no picture field on a post (r187), so drawing it would claim
     * the player sees it. The card says so instead.
     */
    stalePicture?: boolean;
    likes: number;
    comments: number;
    shares: number;
    views: number;
    showInTimeline: boolean;
    /** This is the row that "arrives with the story" and may shimmer. */
    shimmer?: boolean;
    /** The migration had to guess this row's time. */
    migrated?: boolean;
    /** Which quest posted it (the panel shows this; the node is one quest). */
    quest?: string;
}

function counts(t: PreviewTweet): string[] {
    const out: string[] = [];
    if (t.comments) out.push(`${t.comments} ${t.comments === 1 ? "reply" : "replies"}`);
    if (t.shares) out.push(`${t.shares} ${t.shares === 1 ? "repost" : "reposts"}`);
    if (t.likes) out.push(`${t.likes} ${t.likes === 1 ? "like" : "likes"}`);
    if (t.views) out.push(`${t.views.toLocaleString()} views`);
    return out;
}

export function TweetCard({
    tweet,
    displayName,
    handle,
    avatar,
    compact,
}: {
    tweet: PreviewTweet;
    displayName: string;
    handle: string;
    avatar?: string;
    compact?: boolean;
}) {
    return (
        <article
            className={cn(
                "relative overflow-hidden rounded-lg border border-line bg-surface-2/50 px-2.5 py-2",
                tweet.shimmer && "qe-shimmer",
            )}
        >
            <div className="flex gap-2">
                {avatar ? (
                    <img src={avatar} alt="" className="size-7 shrink-0 rounded-full border border-line object-cover" />
                ) : (
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface-3 text-ink-4">
                        <Icon name="bird" size={12} />
                    </span>
                )}
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-1.5">
                        <span className="truncate text-[12px] font-semibold text-ink">
                            {displayName || "Unnamed character"}
                        </span>
                        <span className="truncate font-mono text-[10.5px] text-ink-4">
                            @{handle || "handle_missing"}
                        </span>
                        <span className="text-ink-4">·</span>
                        <span className="text-[10.5px] text-ink-3">{tweet.age}</span>
                        {tweet.showInTimeline && (
                            <span
                                className="rounded-full border border-cat-comms/40 bg-cat-comms/10 px-1.5 text-[9.5px] text-cat-comms"
                                title="Also dropped into the main public timeline, not just left on the profile"
                            >
                                timeline
                            </span>
                        )}
                    </div>
                    {tweet.content ? (
                        <p className={cn("mt-0.5 text-[11.5px] leading-relaxed whitespace-pre-wrap text-ink-2", compact && "line-clamp-3")}>
                            {tweet.content}
                        </p>
                    ) : (
                        <p className="mt-0.5 text-[11px] text-ink-4 italic">no words — an empty post</p>
                    )}
                    {tweet.stalePicture && (
                        <p className="mt-1 flex items-start gap-1 text-[10px] leading-snug text-warn">
                            <Icon name="alert" size={10} className="mt-px shrink-0" />
                            <span>
                                This row still carries a picture from an earlier draft. It is not drawn here and
                                will not be drawn in the game — a post has no picture field to put it in.
                            </span>
                        </p>
                    )}
                    {counts(tweet).length > 0 && (
                        <p className="mt-1 flex flex-wrap gap-x-2 text-[10px] text-ink-4">{counts(tweet).join(" · ")}</p>
                    )}
                    {tweet.migrated && (
                        <p className="mt-1 flex items-center gap-1 text-[10px] text-warn">
                            <Icon name="alert" size={10} />
                            time guessed by the migration from an older draft
                        </p>
                    )}
                    {tweet.quest && <p className="mt-1 text-[10px] text-ink-4">posted by “{tweet.quest}”</p>}
                </div>
            </div>
        </article>
    );
}

/**
 * The profile's tweets, newest first — the game's order, with one line saying
 * so. `rows` arrive in AUTHOR order (oldest first) or as the panel collected
 * them; sorting happens here so every caller gets the same thing.
 */
export function TweetTimeline({
    tweets,
    displayName,
    handle,
    avatar,
    emptyText,
    heading,
    compact,
}: {
    tweets: PreviewTweet[];
    displayName: string;
    handle: string;
    avatar?: string;
    emptyText: string;
    heading?: string;
    compact?: boolean;
}) {
    const sorted = [...tweets].sort((a, b) => a.ageMs - b.ageMs);
    return (
        <div className="space-y-1.5">
            {heading && (
                <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[11px] font-semibold tracking-wide text-ink-3">{heading}</p>
                    {sorted.length > 0 && (
                        <p className="text-[10px] text-ink-4">
                            {sorted.length} post{sorted.length === 1 ? "" : "s"} · newest at the top, as the game shows it
                        </p>
                    )}
                </div>
            )}
            {sorted.length === 0 ? (
                <p className="rounded-md border border-dashed border-line px-3 py-2 text-center text-[11px] text-ink-4">
                    {emptyText}
                </p>
            ) : (
                sorted.map((t) => (
                    <TweetCard
                        key={t.id}
                        tweet={t}
                        displayName={displayName}
                        handle={handle}
                        avatar={avatar}
                        compact={compact}
                    />
                ))
            )}
        </div>
    );
}
