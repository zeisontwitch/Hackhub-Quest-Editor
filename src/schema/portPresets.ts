/**
 * Common-port presets for the network device editor.
 *
 * Each preset fills a port row with values taken from a named source — never
 * invented. Where no source gives a version (SMTP/POP3/IMAP), the version is
 * left blank for the author to fill from their scan: a wrong version breaks
 * the quest, a blank one just waits.
 *
 * Service strings are lowercase, matching in-game nmap output (`ssh`, `http`)
 * and the working reference mod. Web servers report service `http` with the
 * server in the version (`nginx 7.23.4`) — again, as the game's own scan
 * shows them.
 */
export interface PortPreset {
    id: string;
    /** Shown in the dropdown, e.g. "SSH · port 22". */
    label: string;
    /** Where these values come from. Not rendered — documentation. */
    source: string;
    external: number;
    internal: number;
    service: string;
    /** Blank when no verified version exists — the author fills it. */
    version: string;
}

export const PORT_PRESETS: PortPreset[] = [
    {
        id: "ssh",
        label: "SSH · port 22",
        source: "The in-game-tested break-in: Harbour's quest exploits exactly this.",
        external: 22,
        internal: 22,
        service: "ssh",
        version: "OpenSSH 6.4.0",
    },
    {
        id: "ftp",
        label: "FTP · port 21",
        source: "The handbook's own metasploit walkthrough breaks in here.",
        external: 21,
        internal: 21,
        service: "ftp",
        version: "vsftpd 2.3.5",
    },
    {
        id: "http-nginx",
        label: "Web (nginx) · port 80",
        source: "As an in-game nmap scan reports it.",
        external: 80,
        internal: 80,
        service: "http",
        version: "nginx 7.23.4",
    },
    {
        id: "http-apache",
        label: "Web (Apache) · port 80",
        source: "Player knowledge: a commonly-seen in-game version.",
        external: 80,
        internal: 80,
        service: "http",
        version: "Apache 2.4.49",
    },
    {
        id: "mysql",
        label: "MySQL · port 3306",
        source: "The working reference mod runs this on nearly every machine.",
        external: 3306,
        internal: 3306,
        service: "mysql",
        version: "MariaDB 4.1.3",
    },
    {
        id: "smtp",
        label: "SMTP · port 25",
        source: "Common mail port; no verified in-game version yet.",
        external: 25,
        internal: 25,
        service: "smtp",
        version: "",
    },
    {
        id: "pop3",
        label: "POP3 · port 110",
        source: "Common mail port; no verified in-game version yet.",
        external: 110,
        internal: 110,
        service: "pop3",
        version: "",
    },
    {
        id: "imap",
        label: "IMAP · port 143",
        source: "Common mail port; no verified in-game version yet.",
        external: 143,
        internal: 143,
        service: "imap",
        version: "",
    },
];
