/**
 * What each game event IS, in the author's language.
 *
 * The picker used to show only the payload field names ("command, args"),
 * which say what can be matched but never what fires. Each entry here says
 * when the event fires and what the payload identifies, weaving in any
 * field whose name alone means nothing (`cId`, `isMine`, `allFilled`).
 *
 * Sourcing, by decreasing strength: verbatim SDK docs where they exist
 * (Terminal.Command, Browser.Meta, the SSH pair); quest-template usage that
 * playtesting has proven (scp raising SSH.FileDownload, Terminal.Command
 * covering session and mod commands); the in-game handbook's tool chapters
 * (explorer's remote trees, fern's router recovery, openssl, python3); and
 * for the rest, the event name plus its SDK-declared payload. Where the
 * exact firing moment is unverifiable (a scan starting vs reporting), the
 * wording stays neutral about it rather than guessing.
 *
 * A structural test pins that every catalogue event has an entry, so the
 * next SDK regen breaks the suite until its new events are explained too.
 */
export const EVENT_DOCS: Record<string, string> = {
    /* ── Reconnaissance & terminal ─────────────────────────────────── */
    "Terminal.Cat": "The player reads a file with cat. The payload names the file, and may carry its contents.",
    "Terminal.Cd": "The player changes folder with cd. Match `path` to where they went.",
    "Terminal.Command":
        "Fires whenever the player runs a command — in the terminal, inside a remote session, or a custom command a mod added. " +
        "Match `command` by name; `args` carries the rest of the line.",
    "Terminal.Dig": "The player runs dig against a target. Match `target` to the address or domain they asked about.",
    "Terminal.Explorer": "The player browses a remote machine's files in File Explorer. Match `ip` to the machine.",
    "Terminal.Geoip": "The player looks up an address with geoip. Match `ip` to the address they asked about.",
    "Terminal.Ifconfig": "The player runs ifconfig. The payload reports their own terminal's address.",
    "Terminal.InstallPackage": "The player installs a package with apt. `pkg` is the package; `cId` is the machine it lands on.",
    "Terminal.Ls": "The player lists files with ls. The payload identifies one entry it shows.",
    "Terminal.Lynx.Lookup":
        "Lynx returns the details of a lookup. To match what the player searched for, use Terminal: Lynx search instead.",
    "Terminal.Lynx.Search": "The player searches for someone with lynx. The payload is the search text itself.",
    "Terminal.Mxlookup": "The player resolves a domain's mail servers with mxlookup. It carries the domain and the address it resolved to.",
    "Terminal.NmapScan": "The player scans an address with nmap. Match `ip` to the target; `versionScan` tells whether they probed versions too.",
    "Terminal.Nslookup": "The player resolves a domain with nslookup. It carries the domain and the address it resolved to.",
    "Terminal.Openssl": "The player runs openssl on a file. Match `file` to the file they encoded or decoded.",
    "Terminal.Ping": "The player pings an address. `isUp` tells whether it answered.",
    "Terminal.Whois": "The player looks up a domain with whois. It carries the domain and the record the game returned.",

    /* ── Directory brute-force & browser ───────────────────────────── */
    "Terminal.Dirhunter": "Dirhunter finishes sweeping a host for hidden paths. Match `host` to the site; `results` lists the paths it found.",
    "Browser.Meta":
        "Fires when a page opens in the browser. The payload is the parsed address — host, path, query and all — so a condition can match any part of it.",
    "Browser.WebsiteOpened": "The player opens a website in the browser. Match `url` to the page, or `siteName` to the site.",

    /* ── Access & exploitation ─────────────────────────────────────── */
    "Terminal.FTP.Connect": "The player connects to a machine with ftp. Match `ip` (and `port`, when given) to where they connected.",
    "Terminal.Hydra":
        "Hydra reports on a brute-force run against an address and port: the wordlist it used, and the credentials — but only when it found any.",
    "Terminal.Hydra.Try": "One login attempt inside a hydra run. Match the username and password it tried.",
    "Terminal.SSH.Connected": "The player connects to a machine over SSH. The payload is the server's address as a plain string.",
    "Terminal.SSH.Disconnected": "The player disconnects an SSH session. The payload is the server's address as a plain string.",
    "Terminal.SSH.FileDownload": "The player pulls a file down over SSH — this is the event scp raises. The payload names the file.",
    "Terminal.SSH.Shutdown": "The player shuts down a machine over an SSH session. Match `ip` to the machine.",
    "Metasploit.Event": "A notice from the exploit framework itself — progress, errors and session chatter. Match `type` to the kind of notice.",
    "Metasploit.Event.Try": "The player launches an exploit at a target. It carries the exploit, the target address, and the options it runs with.",
    "Metasploit.Meterpreter.Connected": "A meterpreter session opens: the exploit worked and the player is in. Match `ip` to the breached machine.",
    "Metasploit.Msfconsole": "The player opens the metasploit console. It carries no details — it only marks the moment.",
    "Metasploit.Rootgrab": "Rootgrab pulls a file off a rooted machine. It carries the address and the file it took.",
    "Metasploit.Search": "The player searches for an exploit module. Match `search` to what they typed; `matchedModules` lists what the game offered.",
    "Metasploit.SetOption": "The player sets an option on the armed exploit. `allFilled` tells whether every option now has a value and the exploit is ready.",
    "Metasploit.ShowOptions": "The player asks to see an exploit's options. It names the module they are arming.",
    "Metasploit.Use": "The player arms an exploit module with `use`. It names the module they picked.",
    "Meterpreter.Download": "The player downloads a file inside a meterpreter session. It carries the machine and the file.",
    "RemoteConnection.Disconnected": "A remote session closes — ssh, ftp, meterpreter, whichever it was. `service` names it when the game says.",
    "RemoteConnection.Established": "A remote session opens — ssh, ftp, meterpreter, whichever it was. `service` names it when the game says.",

    /* ── Cracking & vuln scanning ──────────────────────────────────── */
    "Fern.FindPassword": "Fern derives a router login from its model. `model` is the router; `user` carries the account it recovered.",
    "Hashcat": "A hashcat password-recovery run reports. The payload identifies the run.",
    "John.DecryptHash": "John cracks a hash. The payload carries the hash and the password it found.",
    "Nuclei.Item": "Nuclei flags one vulnerability on a host. The payload carries the finding.",
    "Nuclei.Results": "A nuclei scan reports: the hosts it covered and the file it wrote.",
    "Sqlmap.DumpTable": "Sqlmap dumps a database table. Match `host` to the server and `tableName` to the table it took.",
    "Sqlmap.ListTables": "Sqlmap lists a database's tables. Match `host` to the server it mapped.",
    "Subfinder.Results": "Subfinder reports the subdomains it found for a domain.",
    "Subfinder.Try": "Subfinder is run against a domain. Match the domain; the findings arrive separately with Subfinder: Results.",

    /* ── Bettercap & Wi-Fi ─────────────────────────────────────────── */
    "Bettercap.Close": "The player closes bettercap. It carries no details.",
    "Bettercap.NetProbe": "The player toggles bettercap's network probe. `active` tells whether probing is now on.",
    "Bettercap.NetShow": "The player lists discovered devices in bettercap. It carries no details.",
    "Bettercap.Open": "The player opens bettercap. It carries no details — it only marks the moment.",
    "Bettercap.WifiDeAuth": "The player runs a deauth attack in bettercap. It carries no details to match on.",
    "Bettercap.WifiRecon": "The player scans for wireless networks in bettercap. It carries no details to match on.",
    "Network.WifiConnected": "The player joins a wireless network. It carries the address they got, and the network name when the game says it.",

    /* ── Network & infrastructure ──────────────────────────────────── */
    "Database.Connected": "The player connects to a database. Match `ip` to the server; `database` names the database when one is picked.",
    "Database.DataUpdate": "A database table changes underneath the player. It names the table and carries the new data.",
    "Network.PortChanges": "A port opens or closes on a machine. `active` tells which: true means it just opened.",
    "Network.UserActivity": "A user on a networked machine comes online or drops off. `online` tells which.",
    "NetworkPacketTransfer": "A packet travels from one address to another. Match the sender, the receiver, or the kind of traffic.",
    "PFSense.Changes": "Someone changes the pfSense firewall's configuration. The payload carries the settings before and after.",
    "PFSense.Login": "Someone logs into the pfSense firewall at an address.",

    /* ── Files ─────────────────────────────────────────────────────── */
    "Files.Deleted": "The player deletes a file. It names the file.",
    "Files.Open": "The player opens a file in an app. `app` names the app; `data` describes what opened.",
    "Files.Transfer": "A file moves up or down: `type` is DOWNLOAD or UPLOAD, and `file` names what moved.",
    "Python3.ExecFile": "The player runs a Python script. `file` is the script; `args` carries what they passed it.",

    /* ── E-mail ────────────────────────────────────────────────────── */
    "Mail.AccountCreated": "The player creates a mail account. It carries the address and password.",
    "Mail.AccountLoggedIn": "The player logs into a mail account. Match `email` to the account.",
    "Mail.MailboxOpened": "The player opens a mailbox. The payload describes one mail inside it.",
    "Mail.Read": "The player opens and reads a mail. Match the sender, the subject, or any word in it.",
    "Mail.Received": "A mail lands in the player's inbox — sent by the quest, an NPC, or another mod. Match the sender or subject.",
    "Mail.Sent": "The player sends a mail. Match who it went to, or what it says.",

    /* ── Social & chat ─────────────────────────────────────────────── */
    "Kisscord.FriendAdded": "Someone is added as a contact on Kisscord. It names who.",
    "Kisscord.Messaging": "A chat message moves in a Kisscord channel. `isMine` tells whether the player sent it.",
    "Twotter.AccountCreated": "The player creates a Twotter account. It names the account.",
    "Twotter.AccountLogin": "The player logs into a Twotter account. It names the account.",
    "Twotter.AccountLogout": "The player logs out of a Twotter account. It names the account.",
    "Twotter.Post": "One of the quest's scripted tweets goes out. It carries the quest and which tweet it was.",
    "Twotter.PostSeen": "The player looks at a tweet. It identifies the post and who wrote it.",
    "Twotter.ProfileSeen": "The player opens someone's Twotter profile. It names who.",
    "WeeChat.Connected": "The player connects to a chat server on WeeChat. Match `host` to the server.",
    "WeeChat.Disconnected": "The player leaves a chat server on WeeChat. Match `host` to the server.",
    "WeeChat.Message": "A chat message arrives on WeeChat. It names the server, the sender, and the message.",

    /* ── Bank, quest & misc ────────────────────────────────────────── */
    "AppStore.Downloaded": "The player downloads an app. The payload names it as a plain string.",
    "Bank.AccountCreated": "A bank account is opened. It carries the account id and IBAN.",
    "Bank.Logout": "The player logs out of the bank. It names the account they left.",
    "Bank.Transfer": "Money moves between accounts. It carries the amount, the sender and the receiver.",
    "BCC.News.Opened": "The player opens a news article. Match `articleId` to the story.",
    "Process.Killed": "The player kills a running process. It names the process and its id.",
    "Quest.Claimed": "The player claims a quest. It names the quest.",
    "Wireshark.Started": "The player starts a packet capture in Wireshark. Match `interface` to where they listen.",
    "Wireshark.Stopped": "The player stops a packet capture in Wireshark. Match `interface` to where they were listening.",
};

/** The plain-language explanation of an event, if it is a known one. */
export function eventDoc(name: string): string | undefined {
    return EVENT_DOCS[name];
}
