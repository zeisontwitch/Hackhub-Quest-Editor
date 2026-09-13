"""Add a `hint` to every inspector field in src/schema/registry.ts.

RETIRED (r127): one-shot r123 tool, kept for the record; moved here from
`reference/` because its output is now the live registry content and the
`HINTS` dict below would drift out of sync with it. Do not re-run it; hints
are edited in `registry.ts` directly now (and the hint-coverage test keeps
them honest).

Hints are what a non-coder actually reads, so this is content work, not
formatting: each one says what the game does with the value, not what the field
is called.

Deliberately dumb and provably local: it inserts `hint: "…"` immediately after a
field's own `key: "…"`, scoped to the section that key belongs to. Property order
is irrelevant to an object literal, and nothing else on the line is touched, so
there is no way for this to eat neighbouring lines. Re-running is a no-op.
"""
import re
import pathlib

HINTS: dict[tuple[str, str], str] = {
    # ── shared field groups ────────────────────────────────────────────────
    ("portFields", "external"): "The port number as seen from outside. This is what nmap reports and what the player connects to.",
    ("portFields", "internal"): "The port the service actually listens on inside the machine. Leave equal to the external port unless you are deliberately redirecting.",
    ("portFields", "service"): "What nmap prints next to the port, e.g. http, ssh, ftp, mysql. Free text — it is a label, not a real service.",
    ("portFields", "version"): "The banner nmap -sV prints, e.g. \"Apache 2.4.41\". Leave blank to omit the version line.",
    ("userFields", "username"): "The login name for ssh, ftp or a web login page.",
    ("userFields", "firstName"): "Shown on the account's profile page and in whois results.",
    ("userFields", "lastName"): "Shown on the account's profile page and in whois results.",
    ("userFields", "emailAddress"): "The account's e-mail address. Useful as a lead the player can mail.",
    ("userFields", "acceptReverseTCP"): "Lets the player open a reverse shell back into this account. Only enable it when the quest needs one.",
    ("vulnFields", "type"): "The vulnerability class. It drives what nuclei and sqlmap report when they scan this machine.",
    ("vulnFields", "version"): "The affected component's version, e.g. \"WordPress 5.8\". Cosmetic unless a trigger matches on it.",
    ("ruleFields", "port"): "The port this rule applies to.",
    ("ruleFields", "source"): "Which source addresses the rule matches. `*` means anywhere; write a single IP to narrow it.",
    ("ruleFields", "destination"): "Which destination addresses the rule matches. `*` means this machine.",
    ("fileFields", "name"): "The file or folder name.",
    ("fileFields", "extension"): "The extension, e.g. txt, log, conf. Leave blank for folders.",
    ("fileFields", "isFolder"): "Mark this entry as a directory rather than a file.",
    ("fileFields", "hidden"): "Prefix the name with a dot so a plain ls does not show it.",
    ("fileFields", "data"): "The file's contents. This is where clues live — a config file, a log excerpt, a leaked password.",
    ("kisscordMsgFields", "content"): "The message text. Markdown works: **bold**, *italic*, `code`, and links.",
    ("kisscordMsgFields", "isMine"): "Send it from the player's own account instead of the contact's.",
    ("kisscordMsgFields", "delayMs"): "Pause in milliseconds before this message appears. Use it to pace a conversation.",
    ("weechatMsgFields", "content"): "The line printed in the IRC channel.",
    ("weechatMsgFields", "isMine"): "Send the line from the player's own nick.",
    ("weechatMsgFields", "delayMs"): "Pause in milliseconds before this line appears.",

    # ── objective ──────────────────────────────────────────────────────────
    ("objective", "description"): "The line shown in the player's quest journal. Keep it an instruction, not a puzzle.",
    ("objective", "hint"): "Revealed when the player asks for a hint. Nudge, don't solve.",
    ("objective", "info"): "Extra detail in the journal's expanded view. Good for lore or background.",
    ("objective", "terminalCommand"): "Suggested command shown in the journal. It runs nothing — it is a copy-pasteable nudge.",
    ("objective", "hidden"): "Keep the objective out of the journal until another objective unlocks it. Use for twists.",

    # ── world ──────────────────────────────────────────────────────────────
    ("world.network", "ipMode"): "Random allocates a fresh public IP each playthrough via Network.randomIp(). Fixed keeps the address you typed — use it when another node refers to this IP by hand.",
    ("world.network", "device"): "The router at the root of the network, plus everything behind it. Routers and splitters carry children; firewalls carry rules.",
    ("world.network", "destroyOnComplete"): "Remove the whole network when the quest ends, so it does not clutter later playthroughs.",
    ("world.wifi", "ssid"): "The network name shown in the in-game Wi-Fi list.",
    ("world.wifi", "users"): "Accounts on the access point's own system. Their files land in /home/<username>/.",
    ("world.wifi", "ports"): "Open ports on the access point itself.",
    ("world.wifi", "children"): "Machines reachable through this access point. Add a router here to build a second network hop.",
    ("world.wifi", "destroyOnComplete"): "Remove the access point when the quest ends.",
    ("world.firewall", "ip"): "The machine these rules protect. Use {{data.targetIp}} to refer to a randomly-allocated router.",
    ("world.firewall", "rule"): "Rules are evaluated in order; the first match wins.",
    ("world.firewall", "removeOnComplete"): "Drop the firewall when the quest ends so the machine is reachable afterwards.",
    ("world.port", "ip"): "The machine whose port you are changing.",
    ("world.port", "action"): "Open makes an existing port reachable. Close blocks it. Add creates a new service; Remove deletes it.",
    ("world.port", "port.external"): "The port number as seen from outside — what nmap reports.",
    ("world.port", "port.internal"): "The port the service listens on inside the machine.",
    ("world.port", "port.service"): "What nmap prints next to the port, e.g. http, ssh, mysql.",
    ("world.port", "port.active"): "Turn off to make the port appear closed.",
    ("world.port", "restoreOnComplete"): "Put the port back the way it was when the quest ends.",
    ("world.domain", "domain"): "The hostname the player types, e.g. vault.corp-internal.net.",
    ("world.domain", "ip"): "The address it resolves to. nslookup and dig will report this.",
    ("world.domain", "vulnerabilities"): "Vulnerabilities the host behind this name exposes. They drive what nuclei and sqlmap report.",
    ("world.domain", "removeOnComplete"): "Drop the DNS entry when the quest ends.",
    ("world.database", "host"): "The address the player points a database client at.",
    ("world.database", "user"): "The login sqlmap or a client uses.",
    ("world.database", "password"): "The password. Give the player a way to find it — a config file, a leaked dump, a cracked hash.",
    ("world.database", "removeOnComplete"): "Drop the database when the quest ends.",
    ("world.files", "target"): "Add creates files; Delete removes them.",
    ("world.files", "parentPath"): "Where the files are mounted. Folders named etc, home, logs or lib are merged into the existing ones rather than replacing them.",
    ("world.files", "files"): "The files and folders to create. A folder named etc, home, logs or lib merges with the machine's existing one.",
    ("world.toolResponse", "command"): "Which built-in command this fakes. Only the listed commands have typed responses; anything else needs a custom command.",
    ("world.toolResponse", "inputUser"): "Only match when the player ran the command against this user.",
    ("world.toolResponse", "inputTarget"): "Only match when the player ran the command against this host.",
    ("world.toolResponse", "removeOnComplete"): "Stop intercepting the command when the quest ends.",

    # ── communication ──────────────────────────────────────────────────────
    ("comms.mail", "from"): "The sender address. Make it a domain the player might look up — it is a lead.",
    ("comms.mail", "subject"): "The subject line in the player's inbox.",
    ("comms.mail", "replyable"): "Let the player answer. Their reply arrives as an event you can trigger on.",
    ("comms.mail", "attachment.name"): "The attachment's filename.",
    ("comms.mail", "attachment.extension"): "The file extension, e.g. txt, pdf, log. The game picks the viewer from this.",
    ("comms.mail", "attachment.content"): "The attachment's contents. For a PDF or image, this is a path to a file you export alongside the mod.",
    ("comms.call", "startIndex"): "Which line of dialogue the call opens on. Use it to resume a conversation mid-script.",
    ("comms.kisscord", "messages"): "The conversation, top to bottom. Use the lock switch on a message to hold it back until an objective completes.",
    ("comms.weechat", "host"): "The IRC server the player connects to.",
    ("comms.weechat", "registerServer"): "Register the server with WeeChat so it appears in the player's server list automatically.",
    ("comms.weechat", "messages"): "The channel log, top to bottom.",
    ("comms.tweet", "accountId"): "Which Twotter account posts this. The account must be declared on the quest.",
    ("comms.tweet", "content"): "The post body, with the same formatting Twotter supports.",
    ("comms.tweet", "likes"): "Starting like count. Cosmetic, but it sells the fiction.",
    ("comms.tweet", "comments"): "Starting reply count.",
    ("comms.tweet", "shares"): "Starting repost count.",
    ("comms.tweet", "views"): "Starting view count.",
    ("comms.tweet", "postedAgo"): "How old the post looks, e.g. \"3h\" or \"2d\".",

    # ── player replies ─────────────────────────────────────────────────────
    ("reply.hackertyper", "surface"): "Where the widget lives: a page on a website, a desktop app, or a phone app.",
    ("reply.hackertyper", "targetRef"): "Which page or app hosts the widget. Must match a website host or app name elsewhere in this mod.",
    ("reply.hackertyper", "text"): "The text that types itself out while the player mashes keys. Make it look like real output — that is the whole illusion.",
    ("reply.hackertyper", "heading"): "The heading above the typing area.",
    ("reply.hackertyper", "charsPerKeypress"): "How many characters each keypress reveals. Higher feels faster and less fiddly.",
    ("reply.input", "commandName"): "The terminal command the player runs, e.g. decrypt. It appears in help output.",
    ("reply.input", "commandDescription"): "The one-line description shown next to the command in help.",
    ("reply.input", "prompt"): "The text printed before the cursor, e.g. \"Passphrase >\".",
    ("reply.input", "matchMode"): "Exactly equals compares the whole answer. Contains accepts it anywhere in the answer. Matches pattern treats the answer as a regular expression.",
    ("reply.input", "expected"): "The accepted answer, or the regular expression when matching by pattern.",
    ("reply.input", "caseSensitive"): "Turn off to accept any capitalisation. Recommended unless case is part of the puzzle.",
    ("reply.input", "successMessage"): "Printed on a match, then the green “Correct” socket fires.",
    ("reply.input", "failureMessage"): "Printed on a miss, then the red “Wrong” socket fires. The player can run the command again.",

    # ── effects ────────────────────────────────────────────────────────────
    ("fx.pay", "amount"): "Credits deposited into the player's bank account.",
    ("fx.pay", "description"): "The label on the bank statement line.",
    ("fx.pay", "fromIBAN"): "The sending account, shown in the transfer details.",
    ("fx.pay", "fromName"): "The sender's name on the statement.",
    ("fx.withdraw", "amount"): "Credits taken from the player's account.",
    ("fx.withdraw", "description"): "The label on the bank statement line.",
    ("fx.notify", "message"): "The text shown. {{runtime.tokens}} are substituted at play time.",
    ("fx.notify", "variant"): "A notification is a persistent popup; a toast slides in and fades on its own.",
    ("fx.notify", "tone"): "Sets the colour and icon: info, success, warning or error.",
    ("fx.setData", "key"): "The name you will read this back with, in a condition or a {{data.key}} token.",
    ("fx.setData", "value"): "The value to store. {{runtime.tokens}} are substituted before it is saved.",
    ("fx.claimQuest", "questName"): "The identifier of the quest to start next. It must exist in this mod or another installed one.",
    ("fx.shell", "command"): "The command executed in the player's terminal, as if they had typed it.",
    ("fx.handbook", "articleId"): "The in-game article to open.",
    ("fx.handbook", "category"): "The handbook section the article sits under.",

    # ── flow control ───────────────────────────────────────────────────────
    ("flow.branch", "source"): "Test against the payload of the event that fired, or against quest data you stored earlier.",
    ("flow.branch", "conditions"): "All clauses must hold for the “Yes” path. Otherwise the “No” path runs.",
    ("flow.delay", "ms"): "How long to wait, in milliseconds. 1000 is one second.",
    ("flow.random", "options"): "One of these is picked at random and stored. Add as many as you like.",
    ("flow.random", "label"): "The value stored if this option is picked.",
    ("flow.random", "storeAs"): "The quest data key the picked value is written to. Read it back with {{data.key}}.",
    ("flow.note", "text"): "Shown on the canvas only. Notes are never exported into the mod.",
    ("flow.note", "width"): "How wide the note is on the canvas, in pixels.",
}

# Section headers this script understands: a shared `const xFields = [ … ]`, or a
# node-type entry `"world.wifi": {` inside NODE_TYPES_REGISTRY.
SECTION = re.compile(
    r'^(?:export )?const (?P<group>\w+)(?::[^=\n]+)?= \[$|^\s{4}(?:"(?P<node>[\w.]+)"|(?P<bare>\w+)):\s*\{$',
    re.M,
)


def main() -> None:
    path = pathlib.Path("src/schema/registry.ts")
    text = path.read_text()

    # Split the file into labelled sections so a key like `content` in the
    # Kisscord group cannot be confused with `content` in the WeeChat group.
    marks = list(SECTION.finditer(text))
    sections: list[tuple[str, int, int]] = []
    for i, m in enumerate(marks):
        name = m.group("group") or m.group("node") or m.group("bare") or "?"
        end = marks[i + 1].start() if i + 1 < len(marks) else len(text)
        sections.append((name, m.end(), end))

    added = 0
    used: set[tuple[str, str]] = set()

    # Process in reverse so inserting text never invalidates earlier offsets.
    for name, start, end in reversed(sections):
        chunk = text[start:end]

        for key, hint in [(k, h) for (ctx, k), h in HINTS.items() if ctx == name]:
            needle = f'key: "{key}"'
            pos = chunk.find(needle)
            if pos < 0:
                continue
            # Skip anything that already carries a hint — the run is idempotent.
            tail = chunk[pos : pos + 400]
            next_key = tail.find('key: "', len(needle))
            scope = tail if next_key < 0 else tail[:next_key]
            if "hint:" in scope:
                used.add((name, key))
                continue
            insert_at = pos + len(needle)
            # Escape for a TS double-quoted string literal.
            esc = hint.replace("\\", "\\\\").replace('"', '\\"')
            chunk = chunk[:insert_at] + f', hint: "{esc}"' + chunk[insert_at:]
            added += 1
            used.add((name, key))

        text = text[:start] + chunk + text[end:]

    path.write_text(text)

    print(f"hints added: {added}")
    missing = [k for k in HINTS if k not in used]
    if missing:
        print("not applied:")
        for ctx, key in sorted(missing):
            print(f"  {ctx}.{key}")


main()
