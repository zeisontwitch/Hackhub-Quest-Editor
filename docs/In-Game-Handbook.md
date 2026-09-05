In-Game Handbook

The Handbook found in-game that explains every command, every hacking procedure, and anything else. Serves as a great reference for how certain hacking routes are supposed to flow and work.

# HackHub Beginner Handbook+

This is a **beginner-first, full-reference handbook** for HackHub. It is written for somebody who may never have used a terminal, database tool or exploit framework before.

## What every major tool page should answer

For each important command/tool/mechanic, this handbook aims to explain:

1. What is it? — in normal English.
2. Why would I use it? — the clue that tells you this is the right tool.
3. Do I install it? — exact in-game install/download/start method when documented.
4. What does the syntax mean? — not just a command to copy.
5. What should I expect to see? — how to recognise useful/successful output.
6. What do I do next? — where the result fits in the mission chain.
7. What usually goes wrong? — beginner troubleshooting.

If a page does not meet that standard, it should be expanded rather than assuming prior cybersecurity knowledge.

## How to read examples

Text inside `<angle brackets>` is a placeholder. Replace it with the value from your own mission or multiplayer target.

`nmap <IP> -sV` 

might become a generated in-game address from your own save.

# The most useful rule in HackHub

**Do not guess the attack. Gather information until the next step becomes obvious.**

A typical chain is:

1. identify a person/company/domain;
2. resolve the domain or discover the IP;
3. scan the host/site;
4. read the service, port, version or vulnerability clue;
5. choose the tool that matches that evidence;
6. obtain credentials, a key, exploit, token or session;
7. perform only the action the objective requires;
8. keep notes and preserve unique files.

## Game-only examples

All targets, accounts, files, tools and workflows described here refer to the **HackHub simulation**. The purpose of this handbook is to explain how the game works in simple terms.

---

# Beginner Workflow

When you have no idea what to do next, use this order.

## 1. Read the objective literally

Write down every noun and value: person, company, domain, email, username, IP, port, filename, service, version, router model, repository, chat room or password clue.

## 2. Do OSINT/recon before hacking

Common first tools:
```lynx <search>
whois <domain-or-IP>
nslookup <domain>
mxlookup <domain>
dig <domain-or-IP>
```

## 3. Scan an IP before choosing an access tool

```
ping <IP>
nmap <IP>
nmap <IP> -sV
```

The `-sV` result is especially useful because service versions can point directly to a compatible Metasploit module.

## 4. Match the evidence

- SSH/FTP + known credentials -> log in.
- SSH/FTP + username but no password -> a wordlist/Hydra route may be intended.
- known vulnerable service/version -> Metasploit may be intended.
- website/database objective -> sqlmap/Database Manager may be intended.
- Wi-Fi objective -> `iwconfig`, Bettercap and Hashcat may be intended.
- firewall-cookie objective -> Wireshark + Kimai + JWT Decoder may be intended.

## 5. Preserve evidence

Copy unique files rather than deleting or overwriting them. In multiplayer, certificates, decoders, exploits and loot can be inventory-backed objects, so the original can matter.

## 6. If the objective does not tick

Re-read the wording. HackHub often expects the **specific action** named by the objective, not merely the same end result.

---

# Desktop and Window Basics

HackHub uses a desktop-style operating system. You will frequently move between the Terminal, browser, File Explorer, mail, chat, Database Manager and networking apps.

## Useful 1.0 desktop behaviour

- Windows can snap to screen edges/zones.
- Active objectives can appear on the desktop.
- The global alert bar surfaces system-wide notifications.
- The Trash Bin stores deleted files instead of immediately destroying them.
- Multi-select supports drag selection, `Ctrl`+click, `Shift`+click and `Ctrl+A`.
- `Esc` clears a multi-selection.
- `F2` renames a selected file on the desktop or in File Explorer.
- Hovering a file shows its full name.

## Beginner layout

A productive layout is:

1. Terminal on one side;
2. objective/Handbook on the other;
3. File Explorer nearby;
4. Notepad for IPs, usernames, ports and passwords.

This reduces the most common beginner problem: discovering a useful value and then forgetting where it came from.

---

# Files, Paths and Folders

Understanding paths solves a huge number of HackHub problems.

## Absolute vs relative paths

An **absolute path** starts at `/`:

```
/home/user/downloads/tool.py
```

A **relative path** starts from your current directory:

```
tool.py
```

## Core navigation

```
pwd
ls
cd <folder>
cd ..
mkdir <folder>
```

- `pwd` shows where you are.
- `ls` shows what is there.
- `cd` changes folder.
- `cd ..` moves one level upward.
- `mkdir` creates a directory.

## Useful game locations

Locations seen in gameplay include:

- `/logs/accounts.log` — account creation/recovery records;
- `/root/logs/terminal.log` — terminal input/output history on builds/content that expose it;
- `/etc/passwd` — user/hash information used by game mechanics;
- `/config/cookies.txt` — cookie/JWT data in relevant missions.

Not every target has every file. Treat these as known game conventions, not guaranteed files on every machine.

---

# Installing Tools and Packages

Some HackHub commands are built in; other tools must be installed or downloaded when a mission needs them.

## The beginner rule

If the Handbook says **install**, do that before trying to run the tool. If it says **downloaded script**, find the file and run it with the required interpreter.

## apt-style packages

```
apt-get install <package>
```

Examples used by HackHub content include:

```
apt-get install python3
apt-get install pip
apt-get install node
apt-get install bettercap
apt-get install hashcat
apt-get install john
apt-get install metasploit
apt-get install subfinder
apt-get install nuclei
```

## Python packages such as sqlmap

Install Python/pip support, then the Python package:

```
apt-get install python3
apt-get install pip
pip install sqlmap
```

Check it with:

```
sqlmap -h
```

## Downloaded Python scripts

A downloaded `.py` file is different from a package installed with `pip`.

Run a downloaded script with:

```
python3 <path-to-script.py>
```

Examples include mission-specific JWT decoders, Fern-style tools, network-tree tools and other downloaded utilities.

## TypeScript/Node scripts

Install Node when the mission/tool requires it:

```
apt-get install node
node <script.ts>
```

## Tools inside other tools

Some things are **not separate installs**. For example, a Metasploit payload such as `bearos/meterpreter/reverse_tcp` is selected inside Metasploit; you do not install that payload with `apt-get`.

## `command not found`

Usually means one of these:

1. the package is not installed;
2. it is a `pip` package and pip/install step is missing;
3. it is a downloaded script and you should run the file with Python/Node;
4. it is a subcommand inside another tool such as Metasploit/Bettercap;
5. the command is multiplayer-only;
6. the guide you are reading is for an old build or another hacking game.

Search this Handbook for the tool name: every major tool page should tell you **what it is, how to obtain/install it, how to start it, what the important options mean, what success looks like, and what to do next**.

---

# Ports and Services Primer

A **port** is the numbered network entry point used by a service. In HackHub, the port state and service determine your next move.

## Common examples

|Port|Common service|What it usually suggests in HackHub|
|---|---|---|
|`21`|FTP|credentials, `ftp`, FileGorilla, or an FTP exploit|
|`22`|SSH|credentials, Hydra, `ssh`, or an SSH exploit|
|`53`|DNS|DNS investigation|
|`80`|HTTP|browser/web reconnaissance|
|`443`|HTTPS|browser/web reconnaissance|
|`9100`|printer|printer-focused mission/tooling when present|

Ports can be randomized or forwarded, so **trust the service label and scan result more than a memorized number**.

## Three important Nmap states

- **OPEN** — the service is exposed.
- **CLOSE/CLOSED** — the port exists but cannot currently be used.
- **FORWARDED** — an external port routes to a service/device behind the network.

A firewall can still block a connection even when a port is open or forwarded.

---

# Version and Accuracy Notes

This handbook is built around **HackHub 1.0.x** and the command/tool behaviour documented through the current post-1.0 patch series.

## What was cross-checked

The guide uses:

- HotBunny's official Content SDK documentation;
- official Steam patch/release notes;
- HotBunny staff devblogs;
- the community transcription of the in-game Handbook;
- community walkthroughs only for clearly marked mission-specific details.

## Why some wiki claims are excluded

Several unofficial wiki pages currently describe commands such as generic `scan`, `connect`, `bruteforce`, Telnet/Netcat flows, tool upgrades and scoring systems that do not match the verified current HackHub command set.

Those are **not** presented here as game features unless independently corroborated.

## Version-sensitive syntax

When a command has changed over time, this guide explains the stable concept and tells you what is known. If your game displays different current usage, follow the live game output.

---

# End-to-End Beginner Example

Imagine an objective says: **Find access to Example Corp's server and retrieve a file.**

## Step 1: Public information

```
lynx "Example Corp"
whois example.test
nslookup example.test
```

Record the resulting IP.

## Step 2: Scan

```
nmap <IP> -sV
```

Suppose it shows SSH open and gives a username clue elsewhere.

## Step 3: Credentials

If the mission supplied a wordlist and expects brute force:

```
hydra -T <IP:PORT> -l <USERNAME> -P <WORDLIST>
```

## Step 4: Connect

```
ssh -h <USERNAME@IP>
```

Follow the current password prompt.

## Step 5: Find the requested file

```
pwd
ls
cd <folder>
ls
cat <file>
```

If the objective needs you to deliver/download it, use the correct copy/file-transfer/GUI action instead of simply reading it.

The exact IP, username, password, port and filename are generated by the game; the **reasoning chain** is what you should remember.

---

# Service → Next Tool Matrix

Use this after `nmap <IP> -sV`.

|What you found|Best next question|Likely game tools|
|---|---|---|
|SSH|Do I have credentials/key?|Hydra, `ssh`, Metasploit if version-vulnerable|
|FTP|Do I have credentials/version?|Hydra, `ftp`, FileGorilla, Metasploit|
|HTTP/HTTPS|What does the site reveal?|Firebear, `lynx`, sqlmap if objective indicates DB vulnerability|
|DNS|What records/history exist?|`dig`, `nslookup`, `dnshistory`|
|forwarded service|Where does it terminate?|Nmap destination + topology/router/firewall|
|printer service|Is internal device reachable?|topology + router/forwarding + PRET mission tool|
|vulnerable version|Is there a matching exploit?|`msfconsole`, `search`, `show options`|
|login + wordlist|Can candidates be tested?|Hydra|

This is a decision aid, not a promise that every service has one fixed solution.

---

# “I Have a Domain” Workflow

If your only clue is a domain:

## Public ownership/context

```
whois <DOMAIN>
lynx <DOMAIN_OR_COMPANY>
```

## Resolve it

```
nslookup <DOMAIN>
dig <DOMAIN>
```

## Mail-specific objective

```
mxlookup <DOMAIN>
```

## Expand subdomains

```
subfinder -d <DOMAIN>
```

## Multiplayer Cloudfire/origin problem

Add:

```
dnshistory <DOMAIN>
probe <DOMAIN>
```

and compare with `shadowlist.onion` clues.

## Then

Once you have a candidate real IP, run Nmap. Do not run Hydra/Metasploit against a domain blindly before you understand which host/service you are actually dealing with.

---

# “I Have an IP” Workflow

## Reachability/context

```
ping <IP>
whois <IP>
geoip <IP>
```

Use only the ones relevant to the mission.

## Services

```
nmap <IP> -sV
```

## Read the result

For each exposed service, record:

```
external port
state
service
version
internal destination (if shown)
```

## Choose the next tool

- credentials -> SSH/FTP;
- wordlist + login -> Hydra;
- vulnerable version -> Metasploit;
- web/database clue -> browser/sqlmap;
- forwarded/internal service -> inspect router/firewall/topology.

The scan should narrow your choices, not create more random guesses.

---

# “I Have Credentials” Workflow

A username/password is useful only if you know **where it belongs**.

## Ask three questions

1. Which service/site produced the credential?
2. Which host/IP exposes that service?
3. Which port/path/login page should receive it?

## Common destinations

- SSH -> `ssh -h user@IP` + current password prompt;
- FTP -> `ftp -h host -u user -p password`;
- router/firewall -> Firebear admin panel;
- Goagle/GoMail/site -> browser login;
- database/application -> the mission's specified app.

## Wrong-password symptoms

Before re-cracking it, make sure you are not:

- using a router password on SSH;
- using a user password as the root password;
- connecting to your own gateway;
- using the internal port number from outside instead of the forwarded external port.

---

# “I Have a Hash or File” Workflow

Identify the artifact before choosing a tool.

## Password hash string

```
john <HASH>
```

when the current objective expects John.

## Wi-Fi capture/PCAP

```
hashcat <CAPTURE_FILE>
```

## Python script

```
python3 <SCRIPT.py> [arguments]
```

## TypeScript script

```
node <SCRIPT.ts>
```

## JWT/cookie

Use the objective's JWT Decoder rather than treating it as a generic password hash.

## Multiplayer artifact

Use the command matching its object type/stage (`openvpn`, `authkey`, `decode`, `appraise`, `crack`).

## Unknown file

Look at:

- filename/extension;
- where you obtained it;
- objective wording;
- README/tool instructions;
- current multiplayer stage.

Do not feed every unknown file into Hashcat.

---

# Reverse TCP Checklist

Use this before deciding the payload is broken.

## Preparation

- [ ]  Metasploit installed
- [ ]  correct file-format exploit selected
- [ ]  `bearos/meterpreter/reverse_tcp` payload selected
- [ ]  correct `LHOST` (your local machine for the listener)
- [ ]  chosen `LPORT`
- [ ]  router forwarding rule enabled to your local IP/LPORT
- [ ]  firewall allows it
- [ ]  generated document/file created
- [ ]  handler running
- [ ]  victim received/opened file through the intended in-game phishing route

## Session

After the callback:

```
show sessions
session <INDEX>
```

## Root route

Inside Meterpreter, if required:

```
rootgrab /etc/passwd
```

Then crack the returned hash with the current objective's password tool.

---

# Router / Firewall Checklist

For the full explanation, search these Handbook pages:

- `Port Forwarding: Start Here`
- `Router Fields Explained`
- `Firewall → Router → Device`
- `Game Walkthrough: Expose Target SSH`
- `Game Walkthrough: Reverse TCP Forward`
- `Firewalls & pfSense: Start Here`
- `Story Example: Firewall + Router`
- `Port Forwarding Troubleshooting`

Use this quick checklist whenever a service **should** be reachable but still refuses connections.

- [ ]  correct public target IP
- [ ]  correct target router/gateway — not accidentally your own router
- [ ]  correct internal device IP
- [ ]  intended service actually exists on that device
- [ ]  intended existing forwarding rule enabled/configured
- [ ]  correct external port
- [ ]  correct internal port
- [ ]  firewall rule is **Allow**, not Deny
- [ ]  configuration saved/applied
- [ ]  fresh `nmap <PUBLIC_IP> -sV` after changes
- [ ]  Nmap shows the expected **service/version/destination**, not merely a blank new OPEN port

## Reverse TCP extra check

The forwarded destination must be **your local listener machine** when preparing a callback to yourself.

## Target-service extra check

When exposing a target's SSH/service, the forwarding destination must be the **target internal machine** and you must be modifying the **target network**.

## The rule to remember

```
FIREWALL = WHETHER traffic is allowed
ROUTER   = WHERE allowed traffic goes
```

---

# Troubleshooting by Symptom

## “Command not found”

Install the package, confirm mode, or check whether it is a downloaded script.

## “File not found”

```
pwd
ls
```

Then use an absolute path.

## “Connection refused / cannot reach”

Rescan, inspect forwarding and firewall, verify external port.

## “Wrong password”

Confirm service/account pairing and current SSH/FTP syntax before cracking again.

## Metasploit fails immediately

Check `show options`, service/version, RHOST/RPORT, network reachability.

## Reverse payload never connects

Check LHOST/LPORT, port forwarding, firewall and handler state.

## Objective does not complete

Perform the exact action named by the objective and make sure previous prerequisite steps are completed.

## Multiplayer artifact rejected

Confirm ownership, correct stage, original vs copy, and recopy to the rented box if mismatch is reported.

## Old guide command does not exist

Trust current in-game `help`/Handbook. Several unofficial wiki pages describe features not present in the verified current build.

---

# Command Quick Reference A–M

|Command|Purpose / key usage|
|---|---|
|`apt-get install <pkg>`|install terminal package|
|`appraise`|MP: evaluate eligible loot|
|`authkey`|MP: use auth-key artifact|
|`bettercap`|launch interactive Wi-Fi/network tool|
|`cat <file>`|display file|
|`cd <dir>`|change directory|
|`clear`|clear terminal display|
|`clearlogs`|MP: operational log-clearing mechanic|
|`cp <src> <dst>`|copy file|
|`crack`|MP: staged cracking command|
|`decode`|MP: decode eligible artifact|
|`deface`|mission/content website defacement action|
|`dig <target>`|DNS/config information|
|`dnshistory <target>`|MP/origin historical DNS clues|
|`echo <text>`|print text|
|`exit`|leave shell/tool context|
|`ftp -h H -u U -p P`|FTP remote access|
|`geoip <IP>`|IP location context|
|`git clone ...`|clone repository|
|`git commit -m ...`|commit repo changes|
|`git init -n ...`|create repo|
|`git pull` / `git push`|sync repo|
|`grep ...`|search/filter text|
|`hashcat <file>`|offline/capture password recovery|
|`help`|list current commands/help|
|`hydra -T IP:PORT ...`|live login wordlist cracking|
|`ifconfig`|network/interface information|
|`iwconfig ...`|visible Wi-Fi information|
|`john <hash>`|crack supported hash|
|`kill <PID>`|stop process|
|`launder`|MP: laundering flow|
|`ls`|list folder|
|`lynx <search>`|OSINT/search|
|`market`|MP: market command|
|`mkdir <dir>`|create folder|
|`msfconsole`|launch Metasploit|
|`mv <src> <dst>`|move/rename|
|`mxlookup <domain>`|mail-server lookup|

---

# Command Quick Reference N–Z

|Command|Purpose / key usage|
|---|---|
|`nmap <IP>`|scan ports/services|
|`nmap <IP> -sV`|scan versions/destination|
|`node <script.ts>`|run TypeScript script|
|`nslookup <domain>`|resolve domain|
|`nuclei -h <hostsfile>`|scan provided host list|
|`openvpn`|MP: use VPN config/certificate|
|`openssl -enc/-dec <text>`|game text encode/decode|
|`ping <IP>`|reachability test|
|`pip install <pkg>`|install Python package|
|`pivot`|MP: staged pivot route|
|`probe <target>`|additional target/origin probing|
|`ps`|list processes|
|`pwd`|current directory|
|`python3 <script.py>`|run Python script|
|`rm <path>`|remove file/folder|
|`ssh -h user@IP`|remote shell; follow current auth prompt|
|`subfinder -d <domain>`|discover subdomains|
|`sudo <cmd>`|run privileged command|
|`sudo -su`|switch to root in documented game flow|
|`systemctl config ...`|root: change existing system config|
|`systemctl restart`|root: restart services|
|`touch <file>`|create empty file|
|`watch <target>`|MP: add to NetworkMonitor|
|`watch off`|MP: stop/remove watch in current context|
|`weechat <IP> <password>`|IRC-like game chat|
|`whois <domain/IP/email>`|registration/ownership recon|
|`>`|overwrite/create from output|
|`>>`|append output|
|`|`|

Interactive Bettercap and Metasploit subcommands are documented on their dedicated pages.

---

# Beginner Glossary

**IP address** — numeric address of a simulated device.

**Public IP** — internet-facing address of a network/router.

**Local/internal IP** — address of a device behind a router.

**Domain** — human-friendly name resolved through DNS.

**DNS** — records connecting domains to infrastructure/services.

**Origin server** — the real server behind a proxy/CDN such as Cloudfire.

**Port** — numbered network entry point.

**Service** — software listening on a port, such as SSH/FTP/HTTP.

**Version** — service software version; often needed to choose an exploit.

**Forwarding** — mapping an external port to an internal device/port.

**Firewall** — rules that allow/deny traffic.

**OSINT** — public-information gathering (`lynx`, sites, social posts, WHOIS, etc.).

**Recon** — gathering technical information before attempting access.

**Enumeration** — listing hosts, services, users, subdomains, records or data.

**Wordlist** — candidate-password file used by Hydra and related game workflows.

**Hash** — one-way password representation used by cracking objectives.

**JWT/cookie** — session/authentication token used by web objectives.

**Exploit** — module/code that takes advantage of a simulated vulnerable service.

**Payload** — code/action run after an exploit; e.g. reverse Meterpreter connection.

**Reverse TCP** — target connects back to your listener.

**Session** — active remote/exploit connection.

**Pivot** — use another compromised/network position to reach the next stage.

**VPS/rented box** — player-rented server used as infrastructure/working machine.

**CDN/proxy** — front end that can mask/protect the origin server.

---

# 15 Habits That Prevent Getting Stuck

1. Run `pwd` and `ls` before blaming a file path.
2. Write down every IP, port, username and password you discover.
3. Use `nmap -sV` before choosing a Metasploit exploit.
4. Trust the **service label** more than a memorized port number.
5. Remember a firewall can block an open/forwarded port.
6. Use OSINT before network tools when you have only a person/company name.
7. Do not use Hydra without a reachable login service and wordlist.
8. Do not use John on the whole passwd file in current builds; crack the returned hash.
9. For reverse TCP, open/forward your listener port **before** waiting for a callback.
10. Keep unique artifacts/files safe; copy before experimenting.
11. Use the exact communication app named by a delivery objective.
12. Re-scan after changing network configuration.
13. Follow current SSH/password prompts instead of an old flag from a guide.
14. In multiplayer, keep originals on your home machine when selling/laundering may need them.
15. When a wiki/guide disagrees with your current game, trust current in-game help/official patch behaviour.

---

# Sources and Coverage

**HackHub Beginner Handbook+ v1.4.2 — Comprehensive Edition**

## Primary verification sources

This edition was built from:

- HotBunny official HackHub Content SDK docs (including the Handbook API);
- official HackHub Steam news/release/patch notes through the current 1.0.x line;
- HotBunny staff development posts for tool/system changes;
- GREEN_ARROW's community “Handbook (WIP)” transcription of the in-game Handbook;
- selected community mission resources for clearly labelled mission-specific scripts/workflows.

## Unofficial wiki policy

Unofficial HackHub wiki pages were checked for possible missing topics, but claims were included only when they matched official/current game evidence. This avoids teaching commands from other games or invented/outdated mechanics.

## What this edition covers

- shell/file commands;
- recon/DNS/network commands;
- Nmap, Hydra, SSH, FTP, Git, scripting;
- Bettercap, Hashcat, John, Metasploit, sqlmap, Wireshark/Kimai;
- downloaded mission tools and important files;
- router/firewall/port-forwarding systems;
- browser/mail/social/app systems;
- story/quest logic without a full spoiler walkthrough;
- all named 1.0 multiplayer-only commands and apps;
- rented servers, domains, Cloudfire, GreyMarket, artifacts, tracing and Streaming Mode;
- current troubleshooting/decision workflows.

Workshop mods can add their own commands/features, so no fixed handbook can document every command from every other mod.

---

#### End of Beginner's Guide

---

# SQL Injection & sqlmap — Explained Simply

This page starts from zero.

## First: what is SQL?

A website often stores information in a **database**: users, email addresses, products, posts, passwords/hashes and other records.

**SQL** is a language applications use to ask a relational database questions such as:

- give me this user's record;
- list the customers;
- update this field;
- show rows matching a search.

## What are MySQL and MariaDB?

**MySQL** and **MariaDB** are database systems/engines. They store the tables and records.

So these three terms are different:

- **MySQL/MariaDB** = the database system.
- **SQL injection (SQLi)** = a weakness in a site/app that lets supplied input interfere with a database query.
- **sqlmap** = the HackHub tool that automates using a SQL-injection weakness when the game provides one.

There is no separate thing you need to install called a “MySQL injection.” You install **sqlmap**.

## SQL injection in plain English

Imagine a web page asks its database:

> “Show me the customer that matches this value.”

A properly protected page treats your value only as **data**. A vulnerable page can accidentally let specially handled input change the **database instruction** itself.

That mistake is SQL injection.

In HackHub, you normally do **not** need to hand-write real SQL-injection strings. The game gives you `sqlmap` to identify/use the simulated vulnerability.

## When should a beginner think “SQL injection”?

Good clues include:

- the objective talks about a website/database;
- a discovered subdomain is marked `SQL_INJECTION` by the game's vulnerability workflow;
- the story tells you to find records in a site database;
- you find a web/database route but do not have normal Database Manager credentials.

An open web port by itself is **not** proof of SQL injection.

## The beginner chain

A common HackHub chain is:

```
find domain -> find subdomains -> scan for vulnerable site -> install sqlmap -> list tables -> read required table -> use the information
```

The next pages walk through that one piece at a time.

---

# sqlmap — Install, Find the Target & List Tables

## 1. Install what sqlmap needs

HackHub content has used the Python/pip package flow:

```
apt-get install python3
apt-get install pip
pip install sqlmap
```

Then check that it exists:

```
sqlmap -h
```

If `sqlmap -h` opens its help, the installation is working.

## 2. Do not guess the vulnerable URL

Find it from **your own save**. HackHub target names can differ, so copying somebody else's domain from a video can send you to the wrong place.

One documented game workflow is:

```
apt-get install subfinder
subfinder -d <DOMAIN>
```

Subfinder saves discovered subdomains to a file. A mission can then have you scan that list with Nuclei:

```
apt-get install nuclei
nuclei -h <SUBDOMAIN_FILE>
```

If the game reports a result such as:

```
[VULNERABLE] - <subdomain> [SQL_INJECTION]
```

that is the clue that `sqlmap` is appropriate for that simulated site.

## 3. List the database tables

HackHub's commonly documented syntax is:

```
sqlmap -u <VULNERABLE_DOMAIN> -tables
```

Example with placeholders:

```
sqlmap -u <crm.example.game> -tables
```

The important part is the **full vulnerable domain/subdomain from your save**, not just an unrelated server IP.

## What does “table” mean?

A database is like a workbook, and a **table** is roughly like one sheet inside it.

A site might have tables conceptually named:

```
users
customers
orders
articles
```

The names in your game are generated by the mission/content. Use what `sqlmap` actually returns.

## Example result

You may see output conceptually like:

```
Listing tables...
Found 2 tables:
users
customers
```

That does **not** mean you are finished. It tells you what containers of data exist. Now choose the table the objective actually cares about.

## If `sqlmap` says the target is wrong/not injectable

Check:

1. Did you use the **vulnerable subdomain**, not only the main company domain?
2. Did Nuclei/the mission actually identify SQL injection?
3. Are you using the URL/domain from your own current save?
4. Is the website reachable through the current firewall/forwarding setup?
5. Does `sqlmap -h` show the command syntax your current build expects?

---

# sqlmap — Read a Table, Understand Results & Continue

Once `-tables` gives you the table names, choose the table connected to the objective.

## Read a named table

Current HackHub community examples use:

```
sqlmap -u <VULNERABLE_DOMAIN> -table <TABLE_NAME>
```

Some mission/build examples use the explicit dump form:

```
sqlmap -u <VULNERABLE_DOMAIN> -dump -table <TABLE_NAME>
```

If one form is rejected in your current build, run:

```
sqlmap -h
```

and follow the syntax shown by the live game.

## What does “dump” mean here?

It means **display/extract the rows from that simulated database table** so you can inspect the records needed by the mission.

It does not mean “delete” the database.

## How to read the result

A table can contain **columns** such as:

```
email | username | password | role
```

and **rows** such as individual people/accounts.

A beginner mistake is to crack or use the first account shown. Instead:

1. read the mission/article/email clue;
2. identify the correct person or role;
3. find that exact row;
4. copy the relevant value;
5. only then continue to password cracking or the next objective.

## If the password is a hash

A hash can look like a long random-looking string rather than a readable password.

That means you have **not necessarily recovered the password yet**.

If the objective expects John:

```
apt-get install john
john <HASH>
```

Use the recovered plaintext password only where the game objective requires it.

## sqlmap vs Database Manager

Use **sqlmap** when the game exposes an SQL-injection route and you need to discover/read database data without normal credentials.

Use **Database Manager** when you have already gained the database access/credentials that the objective expects and need a graphical view or edit.

## sqlmap is not Metasploit

- `sqlmap` = web/database injection route.
- Metasploit = exploit framework for matching vulnerable services/modules and supported payloads.

Finding a MySQL/MariaDB-looking service does not automatically mean “use Metasploit.” Follow the mission evidence. Some HackHub story paths intentionally use the vulnerable **web subdomain** with sqlmap instead.

---

# SQL / MySQL Beginner Glossary

Use this page when database words start blending together.

**Database** — organised collection of data.

**DBMS / database engine** — software that manages a database. MySQL and MariaDB are examples.

**SQL** — language used to query/change relational database data.

**SQL injection / SQLi** — vulnerability where application input can interfere with the SQL query the application sends to its database.

**sqlmap** — HackHub command/tool used to automate the game's SQL-injection workflow.

**Database / schema** — high-level container/structure for data. Exact terminology varies by database engine.

**Table** — named collection of related rows, similar to a sheet in a workbook.

**Column** — one field/type of information, such as `email`, `role` or `password`.

**Row / record** — one complete item/person/account in the table.

**Hash** — one-way representation of a password. It is not automatically the original password.

**Dump** — in this context, read/export the table data for inspection. It does not mean delete it.

**Vulnerable subdomain** — the particular site/subdomain the game has marked as having the SQL-injection weakness. This can matter more than the company's main domain or raw server IP.

## One-sentence example

> “Nuclei found SQL injection on the CRM subdomain, so I used sqlmap to list its tables, read the customers table, found the required account row, then cracked the returned hash with the password tool named by the objective.”

---

# Metasploit

### Introduction to Metasploit

Metasploit is a penetration testing tool used to detect and test security vulnerabilities.

It is used by ethical hackers and cybersecurity professionals to identify weaknesses in systems and improve defenses.

However, it can also be used by malicious actors for attacks, so it should be used carefully and within legal boundaries.

Installation

`apt-get install metasploit`

Usage

`msfconsole`

---

### How to Hack with Metasploit?

Metasploit is divided into exploits. Although the usage of each exploit is different, it works in more or less the same way.

We cannot use Metasploit alone, we need to use some tools along with it.

For example, we need to use **nmap** to learn which services are running on the system we want to infiltrate, which ports are active.

According to the results we found, if a port is open and we know the running version, we can usually infiltrate this system.

Let's get started.

---

### Scanning the Target

For example, let's say our target's IP address is **11.22.33.44**.

We should start our hack by scanning the target first.

`nmap 11.22.33.44 -sV`

The result we got:

|PORT|STATE|SERVICE|VERSION|DESTINATION|
|---|---|---|---|---|
|21|OPEN|ftp|vsftpd 2.3.5|192.168.1.2|
|22|CLOSE|ssh|openssh 1.8.6|192.168.1.2|
|80|CLOSE|http|nginx 7.23.4|192.168.1.2|

From here we understand that port 21 is open and the service running in the background is **"vsftpd version 2.3.5"**.

Now we can start using metasploit.

`msfconsole`

### Searching Exploit

We know that our target has an open port and a running service. Next, we need to find an exploit that fits it.

`search [running service name]`

**"vsftpd 2.3.5"** was running on our target port.

We need to look for a suitable exploit for vsftpd.

`search vsftpd`

|#|Name|Disclosure Date|Rank|Description|
|---|---|---|---|---|
|0|auxiliary/dos/ftp/vsftpd|2020-02-03|normal|VSFTPD Denial of Service|

We found a usable exploit. We need to test it.

In order to use the exploit we found after searching, we need to use the **"use"** command.

`use [exploit name or index]`

For this example

`use 0`

Or

`use auxiliary/dos/ftp/vsftpd`

### Making Configurations

We found our exploit and used it with the **"use"** command.

Now we need to configure the module we are using.

`show options`

After using this command we displayed the current settings of the module.

|Name|Current Settings|Required|Description|
|---|---|---|---|
|RHOST||yes|The target host|
|RPORT|21|yes|The target host|
|Version|1.0.0|yes|The target host|

We must fill in the fields with Required = **"yes"**

We fill these fields with the **"set"** command.

`set RHOST 11.22.33.44`

`set Version 2.3.5`

Note: Some fields may be filled by default, you should replace them with information about your target.

Once you have filled in all the required fields you can start the attack.

### Attacking

Now that we have made all the settings, we can start the attack.

Usually this command is **"exploit"**. However, sometimes there may be other commands. You can learn by typing "help".

`exploit`

If everything is correct you will have infiltrated the system and metasploit will give you a **meterpreter** session.

---

### Rootgrab

This metasploit tool get root password hash from passwd file.

Usage (In meterpreter) `rootgrab /path/to/passwd`

Example `rootgrab /etc/passwd`

Hint Usually the passwd file is located under /etc.

---

### Metasploit Payloads

You can add payloads to some Metasploit exploits. These payloads are code scripts that will run on the target system.

The most well-known is `bearos/meterpreter/reverse_tcp`

Usage `set payload <payload name>`

Example `set payload bearos/meterpreter/reverse_tcp`

---

### Metasploit Reverse TCP

In some cases, most of the paths to the target system are closed, and we can't access them with our attacks. However, the target can open a way for us to enter, called Reverse TCP.

The most common way to deceive someone is through files. Seemingly harmless Word documents can carry malware that doesn't appear to be hidden.

The exploit we will use here is `exploit/multi/fileformat/office_word_macro`

Usage

- `search office_word_macro`
- `use exploit/multi/fileformat/office_word_macro`
- `set payload bearos/meterpreter/reverse_tcp`
- `show options`
- `set LHOST 192.168.1.2`
- `set LPORT 4444`
- `run (to create a malware word document)`
- `handler (to start the listener)`
- Send file to target

When the connection comes

- With _Ctrl+C_ exit handler.
- `show sessions`
- `session <session index>`

**Important**  
Here, we've set the payload's LPORT (i.e., local port) to 4444. You can set this to any port you like. However, remember, you must open this port from the modem interface of the network you're connected to. Otherwise, the payload won't work.

---

# Metasploit: Start Here

Metasploit is HackHub's exploit framework. The key skill is not memorizing exploits — it is matching an **open service + version** to a compatible module.

## Install and launch

```
apt-get install metasploit
msfconsole
```

## Core loop

Inside Metasploit:

```
search <SERVICE>
use <MODULE_OR_INDEX>
show options
set <OPTION> <VALUE>
exploit
```

Some modules use `run` instead of `exploit`; type the tool's help when the selected module expects different execution.

## What you need before opening Metasploit

Run:

```
nmap <IP> -sV
```

Write down:

- external port;
- service;
- service version;
- destination/internal host if shown.

Without that evidence, Metasploit becomes guesswork.

---

# Metasploit Exploit Workflow

Suppose Nmap shows an open FTP service with a version.

## Search

```
search <service-name>
```

## Select

```
use <index>
```

or:

```
use <full-module-name>
```

## Inspect requirements

```
show options
```

Common fields include:

- `RHOST` — target host/IP;
- `RPORT` — target port;
- `Version` — vulnerable service version;
- payload-specific fields such as `LHOST` and `LPORT`.

## Set values

```
set RHOST <IP>
set RPORT <PORT>
set Version <VERSION>
```

Then:

```
exploit
```

## If it fails

Check, in order:

1. port is reachable;
2. firewall/forwarding is correct;
3. module matches the **service and version**;
4. every required option is filled;
5. you used the correct external port.

---

# Payloads Explained in Simple Terms

A **payload** is what you want HackHub to run **after** you have a way to deliver or trigger it.

Think of the pieces like this:

- **Exploit** = the way in / the delivery method.
- **Payload** = the thing carried through that route.
- **Listener / handler** = your machine waiting for the payload to call back.
- **Session** = the live connection you get after it works.
- **Meterpreter** = the special interactive session HackHub gives you for supported Metasploit payloads.

A useful analogy is a parcel:

> The exploit is the courier route. The payload is what is inside the parcel. The handler is you waiting at the delivery address. The session is the successful delivery.

## Do I install the payload separately?

**No.** In the documented HackHub flow, install **Metasploit**, then select a supported payload from inside `msfconsole`.

```
apt-get install metasploit
msfconsole
```

The documented reverse payload is:

```
bearos/meterpreter/reverse_tcp
```

## What does `reverse_tcp` mean?

Normally you connect **to** a target. A reverse connection works the other way around:

1. you prepare a listener;
2. the target opens/runs the generated payload in the game;
3. the target then connects **back to you**;
4. Metasploit receives that callback and creates a session.

That is why your listening port must be reachable.

## The four values beginners confuse

### `RHOST`

**Remote Host** — the target you are attacking with a network exploit.

### `RPORT`

**Remote Port** — the target service port.

### `LHOST`

**Local Host** — your HackHub machine/interface that should receive the callback.

### `LPORT`

**Local Port** — the port on your side where the handler waits.

For a file-format/phishing payload, `LHOST` and `LPORT` are especially important because the generated file needs to know where to call back.

## HackHub's Word-macro payload flow

A documented file-format module is:

```
exploit/multi/fileformat/office_word_macro
```

A beginner-friendly flow is:

```
apt-get install metasploit
msfconsole
search office_word_macro
use exploit/multi/fileformat/office_word_macro
set payload bearos/meterpreter/reverse_tcp
show options
set LHOST <YOUR_LOCAL_IP>
set LPORT <YOUR_LISTENER_PORT>
run
handler
```

Then use the **mission's intended in-game phishing/mail route** to deliver the generated document.

## What is `show options` doing?

It is your checklist. Before running an exploit or generating a payload, use:

```
show options
```

Look for anything marked as required. If a required field is empty, fill it before continuing.

## Why port forwarding matters

If the target is meant to call back to a machine behind your HackHub router, the router needs to know which internal machine should receive that incoming connection.

So the simple chain is:

```
payload runs -> target calls your LPORT -> router forwards it -> handler receives it -> session opens
```

If any link in that chain is wrong, you can generate a perfectly good payload and still get no session.

## When the callback succeeds

Inside Metasploit:

```
show sessions
session <INDEX>
```

You are now inside the supported Meterpreter session. Commands such as `rootgrab` belong **inside that session**, not in your normal terminal.

## If nothing happens

Check these in order:

1. Did you install and open Metasploit?
2. Did you select a payload supported by that exploit?
3. Did `show options` show any missing required values?
4. Is `LHOST` your correct HackHub listener machine/interface?
5. Is `LPORT` actually available on your current network?
6. Is the router forwarding the incoming port to your listener machine?
7. Is the handler running?
8. Did you use the exact delivery method the mission asked for?
9. Did the victim/event actually trigger the generated file?

## The main lesson

**Exploit and payload are not the same thing.** The exploit creates an opportunity; the payload defines what happens when that opportunity succeeds.

---

# Meterpreter, Sessions and `rootgrab`

A successful supported Metasploit exploit can create a Meterpreter session.

## List sessions

```
show sessions
```

## Enter one

```
session <INDEX>
```

## `rootgrab`

Inside a Meterpreter session, HackHub provides:

```
rootgrab /etc/passwd
```

This attempts to obtain the root password/hash information used by the game. The root password itself is not simply exposed in `/etc/passwd` by the normal file contents in current mechanics.

## Next step

If `rootgrab` returns a hash rather than the clear password, use the password-cracking tool the objective expects (for example John) on the **hash**.

## Important

`rootgrab` is a Meterpreter command. If you type it in an ordinary local terminal with no Meterpreter session, you are in the wrong context.

---

#### End of Metasploit

---

# Online World

# Wireshark

Wireshark is HackHub's packet-monitoring application. It visualizes data sharing between IPs and is used directly by some missions.

## Core idea

Wireshark does not crack a password by itself. It captures/observes simulated network traffic so you can find a useful packet, cookie or token generated by another action.

## Broad capture in mission content

Some firewall-cookie objectives have you set Source and Destination filters to `*` and start capturing so all relevant traffic is visible.

## What to look for

Depending on the objective:

- source/destination IPs;
- request/response events;
- cookie/session/JWT-looking values;
- credentials or data generated by a supporting attack script.

## Common pairing

**Wireshark + Kimai + JWT Decoder** is a known game workflow for extracting cookie-based firewall login information.

---

# Kimai + Wireshark + JWT Workflow

This is a **mission-specific game workflow** for cookie-based websites/firewall credentials.

## What you need

- Wireshark;
- a Kimai attack script;
- a JWT Decoder script/tool;
- the target firewall/IP.

## Workflow

1. Open Wireshark.
2. Use broad source/destination filters such as `*` when the mission expects all traffic.
3. Start capture.
4. Run the Kimai script against the target:

```
python3 <kimai-script> <TARGET_IP>
```

5. Repeat as needed until useful cookie/token traffic appears.
6. Select/copy the token from Wireshark.
7. Decode it with the mission's JWT Decoder:

```
python3 <jwt-decoder-script> <TOKEN>
```

8. Use the resulting in-game credential in the target firewall/login page.

## Why repeated attempts can be normal

The game logic can require multiple Kimai-generated requests before a useful token appears. Do not assume the script is broken after one run if the objective/traffic indicates the attack is working.

---

# Database Manager

Database Manager is the graphical app for viewing/manipulating databases you have legitimately reached within a HackHub objective.

## Typical role

A mission may have you:

1. discover a server/site;
2. use sqlmap or another route to gain database access;
3. open Database Manager;
4. inspect tables/records;
5. find, alter or extract the specific row the objective describes.

## Beginner mistake

Do not randomly edit tables. Record the table/field/value named by the objective, make only the required change, and verify the objective before closing the app.

## Dynamic tables

Current patches fixed dynamically added tables not appearing correctly, so a table created/added by current content should show in Database Manager when the mission has actually exposed it.

---

# Fern and Router Login

Fern is a **mission/tool script** used to derive the simulated router/modem interface credential from the router model.

## Find the model

Open the router/modem interface in Firebear — often via the local gateway supplied by the game/network — and note the model shown by the interface.

## Run Fern

The script is typically a Python download, for example:

```
python3 <path-to-fern.py>
```

Enter the router model when prompted.

## After credentials are found

Log into the router's web interface and make the exact network change the objective requires, such as a port-forwarding rule.

## Reverse TCP example

For a listener on local machine/port `4444`, forward the chosen external port to your local IP and internal port `4444`, then verify the rule is active before starting the Metasploit handler.

The exact gateway, model, password and ports are generated by the current mission/save — never copy another player's values.

---

# How HackHub Networks Work

HackHub's network model treats IPs as devices that can sit behind routers/firewalls rather than every IP being a flat standalone server.

## Think in layers

The exact device order depends on the network shown by the mission, but a protected story network can look like this:

```
Internet / public IP
        |
 firewall / gateway
        |
  router / modem
        |
 internal devices
    |      |      |
 server   PC   printer
```

Other networks can combine these jobs differently, so use the mission topology rather than assuming every network is identical.

## Consequence

A service running on an internal machine may be reachable externally only because the router forwards an external port to it.

That is why Nmap can show a **DESTINATION** internal IP and a **FORWARDED** external port.

## Two separate questions

1. **Firewall:** Is the traffic allowed to get through this security layer?
2. **Routing/port forwarding:** Once allowed, which internal device/port receives it?

A correct password cannot fix a path that is blocked before it reaches the service.

For the full beginner walkthrough, continue with pages **51 through 52B**.

---

# Routers, Modems and Port Forwarding

Port forwarding is one of the easiest HackHub systems to misunderstand because **opening a service is usually a two-part job**:

1. the **router** must send the incoming port to the correct internal device;
2. the **firewall** must allow that traffic to pass.

A password, exploit or payload can be completely correct and still fail if either part is wrong.

## The beginner picture

Think of a HackHub network like a building:

```
Internet
   |
public IP
   |
[ FIREWALL ]  -> decides ALLOW or DENY
   |
[ ROUTER ]    -> decides WHICH internal device gets the port
   |
   +---- 192.168.x.2  PC
   +---- 192.168.x.3  Server
   +---- 192.168.x.4  Another device
```

The firewall is the **security guard**. The router is the **receptionist**.

The guard can allow the visitor into the building, but the receptionist still needs to know which room to send them to.

## What a port-forward rule means

A rule normally contains:

- **External port** — the port visible from outside the network;
- **Internal/local IP** — the device behind the router that should receive the traffic;
- **Internal port** — the port/service on that internal device;
- **Enabled/status** — whether the rule is actually active.

Conceptually:

```
PUBLIC_IP:EXTERNAL_PORT
          |
          v
       ROUTER
          |
          v
INTERNAL_IP:INTERNAL_PORT
```

Example using placeholders:

```
Public router port 22
        -> 192.168.x.4 port 22
```

That means somebody reaching the router's public IP on port 22 is sent to the SSH service on `192.168.x.4:22`.

## When HackHub expects you to use it

Typical game situations include:

- exposing SSH or another service on a machine behind a target router;
- making a reverse-TCP listener on **your own** machine reachable;
- story missions that explicitly tell you to open/forward a port;
- troubleshooting a service Nmap shows as closed/forwarded.

## Never guess which router

Before changing anything, ask:

> **Whose service am I trying to make reachable?**

If you are exposing a target's SSH service, change the **target network's router**.

If you are preparing a reverse payload to call back to your computer, change **your own current network's router** so the callback reaches your listener.

This distinction is extremely important in HackHub. Current story fixes specifically prevent a mission step from completing when you accidentally forward the port on your own router instead of the intended target network.

See the next pages for the fields, firewall relationship and complete in-game examples.

---

# Router Port-Forward Fields Explained

When HackHub shows a router/modem port-forwarding panel, the names can vary slightly by device/UI version, but the important values are the same.

## 1. External Port

This is the port somebody uses on the **public/router side**.

Think:

> "Which door number is visible from outside?"

If external port `22` is forwarded, an outside scan may reach that rule through port 22 on the public IP.

## 2. Internal / Local IP

This is the private IP of the device **behind the router** that should receive the traffic.

Example format:

```
192.168.x.4
```

This is **not automatically the router IP** and it is not automatically your own PC. Use the topology/Nmap destination/objective to identify the intended child device.

## 3. Internal Port

This is the port the service is actually using on the internal device.

For example, if the internal machine's SSH service listens on 22:

```
External port: 22
Internal IP:    192.168.x.4
Internal port:  22
```

means:

```
PUBLIC_IP:22 -> 192.168.x.4:22
```

## External and internal ports do not have to match

Conceptually a router can map one outside port to a different internal port. The important thing in HackHub is to follow the mission/service data rather than assuming the values.

## 4. Enabled / Status

A rule that exists but is disabled does nothing.

On router interfaces that show a slider/toggle, make sure the intended existing rule is actually active, then save/apply the configuration.

## The three-value check

Before saving, read the rule back to yourself:

> "Traffic arriving on **external port X** goes to **internal IP Y** on **internal port Z**."

If you cannot say that sentence confidently, do not press on to Metasploit/SSH yet.

---

# Firewall → Router → Device: Follow One Packet

This page explains why HackHub can still show a connection failure after you "opened the port."

Suppose an internal machine has SSH on port 22.

## Stage 1 — traffic reaches the public network

You connect or scan the **public IP**:

```
nmap <PUBLIC_IP> -sV
```

## Stage 2 — firewall decision

The firewall checks its rule.

```
Port 22 = DENY
```

Result: traffic stops here.

Changing the router behind it will not help until the firewall permits the path.

If the rule is:

```
Port 22 = ALLOW
```

traffic can continue toward the router.

## Stage 3 — router forwarding decision

The router now asks:

> "Which machine behind me owns incoming port 22?"

A correct rule might conceptually say:

```
External 22 -> 192.168.x.4 : 22
```

## Stage 4 — internal service

The internal machine must actually have the service you expect.

```
192.168.x.4:22 -> SSH / OpenSSH
```

If you forward port 22 to a machine that has no SSH service there, Nmap may show a useless/blank result rather than the service you were trying to expose.

## The complete successful chain

```
PUBLIC IP : 22
      ↓
FIREWALL allows 22
      ↓
ROUTER forwards 22
      ↓
192.168.x.4 : 22
      ↓
SSH service answers
```

## Why beginners get stuck

Changing **only one** layer feels like it should be enough:

- firewall Allow but no forwarding -> traffic has nowhere useful to go;
- forwarding correct but firewall Deny -> traffic never reaches the forward;
- both correct but wrong internal IP -> wrong machine;
- both correct but wrong internal port -> wrong service;
- everything correct on the wrong network -> your intended target never changes.

Whenever you change a rule, run a fresh Nmap scan against the correct public endpoint before moving to the next hacking tool.

---

# Game Walkthrough: Expose a Target SSH Service

Use this pattern when a HackHub objective wants you to make a service on a **target's internal machine** reachable from outside.

The exact IPs and ports in your save can differ. Use the values the game gives you.

## Example situation

You know:

```
Target public IP:        <PUBLIC_IP>
Target router:           <ROUTER>
Internal target machine: <LOCAL_IP>
Wanted service:          SSH
Service port:            <SSH_PORT>
```

## Step 1 — scan before changing anything

```
nmap <PUBLIC_IP> -sV
```

Record whether the wanted service is `CLOSED`, `FORWARDED` or already `OPEN`, and note any **DESTINATION** internal IP.

## Step 2 — make sure you are on the target network

This is the most important check.

Do **not** open your own home router just because it is easy to reach. In story missions, identify the firewall/router belonging to the target organisation/person.

## Step 3 — firewall first when the topology requires it

Open the target firewall/pfSense panel using the credentials obtained through the mission.

Change the relevant rule from **Deny** to **Allow**, then save/apply it.

If the firewall is protecting access to the router panel itself, this step is what makes the router manageable.

## Step 4 — open the target router

Use Firebear to reach the router/modem admin interface specified by the mission/topology.

Find the existing port-forwarding/service rule if one exists.

## Step 5 — forward to the correct local device

Conceptually you want:

```
External port: <SSH_PORT>
Internal IP:   <LOCAL_IP of target machine>
Internal port: <SSH_PORT>
Enabled:       YES
```

Do not create a second random rule just because you can. If the game supplied an existing disabled rule for the real service, enable/configure that intended rule.

## Step 6 — save/apply

Make sure the router says the configuration was saved and the rule is enabled.

## Step 7 — scan the PUBLIC IP again

```
nmap <PUBLIC_IP> -sV
```

A good result is not merely "there is now an open number." You want the scan to show the **actual intended service/version/destination**.

For SSH, you want the entry associated with SSH/OpenSSH to become reachable.

## Step 8 — only now use the access tool

Once the real service is exposed, use the mission's intended next step: SSH credentials, Hydra, Metasploit, etc.

## If Nmap shows two copies of the same port

That can mean you added a new generic rule while the original service rule stayed closed. Go back and check whether you modified the intended existing rule and destination rather than creating an unrelated duplicate.

---

# Game Walkthrough: Port Forwarding for Reverse TCP

This is different from opening a target's SSH service.

With a **reverse TCP payload**, the target tries to call **back to you**. Therefore the forwarding rule normally belongs on the network where **your listener machine** sits.

## The flow

```
Victim opens in-game payload
          ↓
payload calls your network
          ↓
YOUR router receives LPORT
          ↓
YOUR router forwards LPORT
          ↓
your local PC running Metasploit
          ↓
handler creates session
```

## Step 1 — identify your listener IP

On the machine where Metasploit will run:

```
ifconfig
```

Record the local/internal IP shown for that machine.

## Step 2 — choose the listener port

In Metasploit you set an `LPORT`.

Example placeholder:

```
set LPORT <LISTENER_PORT>
```

## Step 3 — open your router/modem panel

Configure a forwarding rule so incoming traffic on that listener port goes to **your local Metasploit machine** on the same required port.

Conceptually:

```
External port: <LPORT>
Internal IP:   <YOUR_LOCAL_IP>
Internal port: <LPORT>
Enabled:       YES
```

## Step 4 — firewall

If your current HackHub network has a firewall layer, make sure the listener traffic is **Allowed** as well.

## Step 5 — configure Metasploit

For the documented HackHub reverse payload flow:

```
msfconsole
use exploit/multi/fileformat/office_word_macro
set payload bearos/meterpreter/reverse_tcp
set LHOST <YOUR_LOCAL_IP>
set LPORT <LPORT>
show options
```

Use the current game's command help/module output if your build presents a slightly different run/handler flow.

## Step 6 — start the handler before expecting the callback

The forwarding rule creates the road to your computer. The handler is the program actually waiting at the end of that road.

Both must exist.

## Common wrong setup

Do **not** forward the listener port to the victim's internal IP. A reverse callback is trying to reach **your listener**, so the router destination must be your listening machine.

## Four things that must agree

```
Metasploit LPORT
       =
router external port
       =
router internal port (normally in this flow)
       =
port the handler is listening on
```

and the router's internal destination must be your correct local IP.

---

# Firewalls and pfSense

The firewall and router do **different jobs** in HackHub.

- **Router/port forwarding:** where should incoming traffic go?
- **Firewall:** is that traffic allowed to pass at all?

You often need **both** configured correctly.

## Simple analogy

Imagine traffic wants to reach an internal SSH server:

```
Internet
   |
   v
FIREWALL: "Is this allowed?"
   |
   v
ROUTER: "Which internal IP gets it?"
   |
   v
192.168.x.4:22 (SSH)
```

If the firewall says **Deny**, the traffic stops even if the router forwarding is perfect.

If the firewall says **Allow**, but the router forwards to the wrong local IP, the traffic reaches the wrong machine.

## Current pfSense-style control

Current HackHub builds use a clear **Allow / Deny** control for pfSense-style firewall rules.

For a mission, do not turn everything to Allow. Find the rule/port the objective actually requires and change only what is needed.

## Typical in-game workflow

1. identify the correct firewall device/network;
2. obtain the firewall/admin credentials through the mission's intended route;
3. open the firewall panel in Firebear;
4. find the relevant rule or port;
5. change it to **Allow**;
6. save/apply the change;
7. reach/configure the router if the service also needs forwarding;
8. run a **fresh Nmap scan** against the public target IP.

## Why the firewall may come before the router

Some HackHub story networks put the firewall in front of the router-management path. In that layout, you must first allow the traffic that makes the router reachable, then configure the router to forward the service toward the internal device.

So a mission can effectively be:

```
ALLOW through firewall
        ↓
reach target router
        ↓
forward router port
        ↓
internal service becomes reachable
```

## Lockout warning

Do not create broad Deny rules just to experiment. Current patches protect/repair important story rules, but the safest approach is still to change the smallest rule required by the objective.

---

# Story Example: Firewall + Router (Spoiler-Light)

One of the clearest HackHub examples is the **Journalist's Sister** network sequence.

This page explains the networking lesson without giving you another player's generated IP/password.

## What the current quest is teaching

The important idea is that the target machine sits behind **more than one network control**.

Conceptually:

```
outside
  ↓
Interpol/target firewall
  ↓
target router
  ↓
Carl / internal target machine
```

## Why opening your own router does nothing

Earlier versions made it easy to reach the wrong router first. Current patches changed the quest order so the firewall step makes the intended target router reachable before the port-opening objective can complete.

If you forward port 22 on your **local/home network**, Carl's SSH state will not change.

## Correct reasoning sequence

1. follow the mission until you have the credentials/access for the **target firewall**;
2. use the firewall panel to **Allow** the traffic the mission requires;
3. reach the **target/Interpol router**, not your own router;
4. identify the correct **LAN/internal IP** of the intended machine;
5. enable/configure the intended forwarding rule toward that machine;
6. save the router configuration;
7. run `nmap <TARGET_PUBLIC_IP> -sV` again;
8. confirm the real SSH/OpenSSH entry is now reachable before trying to log in/exploit it.

## Why port 80 may also appear in the story

The web/router/firewall management path can use web traffic, while the final service you want may be SSH. That is why a mission can involve **allowing web access to a management interface** and separately **opening/forwarding SSH** toward the internal target.

Do not treat every port mentioned in the chain as though it belongs to the same device or service.

## Current-version note

HackHub has had several fixes around this mission, TP-Link/pfSense port controls and stale Nmap state. On a current build, rescan after saving.

If your scan shows a duplicate blank port while the actual OpenSSH entry remains closed, re-check the intended existing rule/internal destination rather than assuming the exploit is broken.

---

# Port Forwarding Troubleshooting

Use this before changing exploits, passwords or payloads.

## Symptom: "I opened the port but Nmap still says CLOSED"

Check:

1. Did you configure the **correct network/router**?
2. Is the rule actually **enabled**?
3. Did you save/apply it?
4. Is the firewall rule **Allow**?
5. Is the internal/local IP the machine that really runs the service?
6. Is the internal port the service's actual port?
7. Did you rescan the correct **public IP** after the change?

## Symptom: "Nmap shows OPEN but there is no service/version"

This often means you created a port rule but did not point it at the real service.

Do not accept "OPEN" by itself as proof. Compare:

```
PORT
STATE
SERVICE
VERSION
DESTINATION
```

You want the intended service entry to become reachable.

## Symptom: "I see two port 22 entries"

You may have added a second generic rule while the original SSH forwarding/service entry stayed closed.

Go back to the router and check the intended existing rule, its destination and enable/status control.

## Symptom: "Router looks correct but connection still fails"

The firewall can still block it.

Think:

```
forwarding = WHERE
firewall   = WHETHER
```

Both must be correct.

## Symptom: "Firewall is Allow but nothing changes"

The router may still have no valid mapping, or you may be allowing the wrong port/rule.

## Symptom: "Reverse TCP says handler started but no session arrives"

Check a different set of values:

- `LHOST` = your listening machine;
- `LPORT` = chosen listener port;
- your router forwards that `LPORT` to **your local IP**;
- firewall allows it;
- handler is running;
- victim actually opened the generated in-game file through the intended story flow.

## Symptom: "Objective won't tick"

HackHub objectives often check the exact target state. A rule on the wrong router or a newly-created blank open port may not satisfy a step that expects the existing service to be opened toward a particular internal machine.

## Final verification loop

```
CHANGE ONE THING
      ↓
SAVE / APPLY
      ↓
FRESH NMAP SCAN
      ↓
READ SERVICE + DESTINATION
      ↓
ONLY THEN CONTINUE
```

---

# Firebear Browser and Websites

The browser is a major investigation tool, not just decoration.

## What to inspect

- company landing pages and staff information;
- login pages;
- router/firewall/admin panels;
- repositories and README files;
- Goagle search/account pages;
- Twotter posts/profiles;
- mail links;
- GreyMarket and multiplayer provider sites;
- hidden/darknet sites when the game gives you the lead.

## IP + port browsing

HackHub's browser can work with IP/port-style targets used by network devices and service panels.

## Bookmarks

Current 1.0 patches fixed bookmark behaviour on `www`-prefixed sites and keep newly added bookmarks visible immediately.

## External links

Current security fixes prevent in-game content from silently opening arbitrary real websites or requesting camera/microphone/screen access. External addresses require user approval.

---

# GoMail, Email and Phishing

Email is used for both ordinary mission communication and social-engineering objectives.

## Read every relevant message

A mail can contain:

- target IP/domain;
- username/password clue;
- attachment;
- exact reply text required by an objective;
- phishing template/delivery instruction.

## Phishing workflow

Some Metasploit payload missions create a malicious document, then require you to deliver it using an in-game phishing template/mail flow. The victim opening it triggers the simulated reverse TCP connection.

## Attachment objectives

Current builds enforce that you actually own/download a required quest file before you can attach/send it to satisfy a delivery objective.

## Account records

Account creation details are logged in `/logs/accounts.log` in relevant systems; current multiplayer logging includes the email field where needed by objectives.

---

# Logs and Useful Records

HackHub intentionally gives you logs that can save you when you forgot a value.

## Account log

```
cat /logs/accounts.log
```

Use it to recover details of accounts you created in supported systems. In current multiplayer, GoMail account creation is recorded there correctly.

## Terminal history log

Some current installations/content expose:

```
/root/logs/terminal.log
```

This records terminal input/output and can recover a lost IP, username or command result.

## Log Viewer

Use the graphical Log Viewer for long records if that is easier. Current fixes allow long account lines to be viewed rather than being permanently hidden behind an ellipsis.

## Multiplayer distinction

`clearlogs` is a specific multiplayer command/mechanic discussed in the multiplayer section. Do not confuse it with `clear`, which only clears your terminal display.

---

# File Explorer, Trash and File Picker

## File Explorer

Use it for:

- visually browsing folders;
- dragging/copying files;
- multi-select;
- renaming with `F2`;
- inspecting full filenames;
- remote trees when legitimately mounted/opened by the game.

## Trash Bin

Normal current deletions go to the recycle/trash system rather than disappearing immediately. Protected/read-only/quest files can refuse deletion.

## OpenFileDialog

HackHub 1.0 added a system-wide open-file picker used by apps/content that need you to choose a file.

## Remote-tree safety

Current versions disable “Open Terminal Here” on certain hacked/mounted/FTP remote trees because it previously created a local terminal incorrectly rooted in someone else's filesystem. Use the actual remote session/tool instead.

---

# Notepad, Editors and Viewers

These apps help you work with information collected during missions.

## Notepad

Keep a simple table of:

```
Target:
Domain:
Public IP:
Internal IP:
Port:
Service/version:
Username:
Password/hash:
Next step:
```

## Code editor / Code++ style scripting

Use the code editor for TypeScript/Node or game scripting when a quest/tool requires code. Save scripts with clear names and run them through the correct interpreter.

## Document Viewer

Open evidence/readme/mission documents. Some objectives specifically complete when evidence is **read**, including through the GUI.

## Log Viewer

Use for long log files and account/terminal history.

The beginner advantage of GUI apps is visibility; the terminal advantage is speed and composability. Use both.

---

# Kisscord, WeeChat and Chat

HackHub has several communication systems with different roles.

## Kisscord

Discord-like direct/chat interactions used heavily by quests. Messages can unlock as objectives progress and can require file attachments.

## WeeChat

IRC-like terminal chat entered with the `weechat` command when a mission supplies a host/password.

## Multiplayer Chat

HackHub 1.0 adds a dedicated multiplayer Chat app. Current features include:

- replies and @mentions with notifications;
- pinned messages;
- jumping from pin/reply to the referenced message;
- “Jump to present” when reading old history.

## Objective advice

If a mission asks you to **send** information or a file, do it through the exact communication app named by the objective. Merely obtaining the file does not always complete a delivery step.

---

# Objectives and Quest Logic

HackHub objectives can unlock in sequence and often expect a particular evidence/action chain.

## Why “I already did it” may not count

An objective can require the game event produced by:

- running a scan;
- reading a file;
- opening a site;
- sending a particular message/attachment;
- making a specific firewall/forwarding change;
- using a named tool.

Reaching the same end state by a different route may not generate the event the quest expects.

## Randomized data

Many target IPs, credentials, ports, versions and network layouts are generated per save/session. Use the **method**, not another player's literal values.

## Desktop objectives

HackHub 1.0 can show active objectives directly on the desktop. Keep them visible while working through a long chain so you know which step is currently unlocked.

---

# Story, Side Jobs and Choices

This handbook stays **spoiler-light** while explaining how the content is structured.

HackHub includes a main story (including the Journalist's Sister line), side missions and other jobs. Player choices were added so later/final story content can change based on decisions.

## What remains consistent

Regardless of story branch, the core problem-solving loop is similar:

1. read mail/chat/objective;
2. do public OSINT;
3. map domain/IP/network;
4. identify service/version/credentials;
5. use the specific access technique;
6. retrieve/change/deliver the requested evidence;
7. wait for the next objective/message.

## Best beginner practice

Do not use a walkthrough's fixed IP/password. Copy only the **sequence of tools** and substitute the values generated in your own save.

---

# Important Game Sites and Services

HackHub's web ecosystem is part of the gameplay. Names you may encounter include:

## Information / communication

- Goagle and Goagle Mail;
- Twotter;
- HackHub/Hackhub feed and job content;
- repositories/GitHub-style site;
- Dox board;
- `shadowlist.onion` for multiplayer origin-leak information;
- Netrun hints via phone.

## Multiplayer commerce/infrastructure

- GreyMarket;
- DigitalSea (Droplets/VPS);
- ArizonaWebServices (Instances/cloud servers);
- Namecheep (domains/DNS);
- GoDiddy (domains/DNS + privacy positioning);
- Cloudfire (CDN/proxy/origin masking).

## Mission-specific sites

Banks, ecommerce, corporate, government and other generated/company pages can contain login panels, staff clues and infrastructure leads.

Treat websites as data sources. Read the page before deciding which terminal command comes next.

---



---

#### End of Online World

---

# Accounts

### How to recover your account?

If you have created an account, the system automatically keeps a log of it. To see these logs, review the /logs/accounts.log file.

`/logs/accounts.log`

---

# NTLM and Credential Systems

HotBunny added NTLM-style systems/hacking methods as part of HackHub's expanded networking/tool layer.

For beginners, the important idea is that **not every credential problem is a Hydra problem**. The objective may ask you to obtain or transform credential material through a particular service, packet/token, hash or exploit route.

## Decision rule

- live login + wordlist -> Hydra;
- returned password hash -> John or the designated cracking tool;
- Wi-Fi capture -> Hashcat;
- cookie/JWT -> Wireshark/Kimai/JWT Decoder route;
- root hash via Meterpreter -> `rootgrab`, then crack the returned hash;
- NTLM-specific objective -> follow the exact NTLM tool/step named by that content.

This page avoids inventing generic real-world NTLM commands that the game has not documented as core terminal syntax.

---

# Digging

### How to Find User Password in Remote Connection?

When you access a system, you may need users' passwords. Passwords are stored in an encrypted form in the operating system.

These passwords are stored in this file:

`/etc/passwd`

If you want, you can decrypt this file completely or the hashes in it one by one.

To do this, a tool is required.

`apt-get install john`

then

`john <hash>`

---

### Identifying the Firewall

Before we begin the credential extraction procedure, we must determine the firewall’s IP address.

Let’s assume the target firewall IP is **44.55.66.77**.

---

### Required Tools

To perform this operation, you will need the following:

- **Wireshark** – Used for monitoring network packets
- **Kimai Attack Script** – Downloadable from _hackdb.net_
- **JWT Decoder** – Also available at _hackdb.net_

These three tools work together to capture and decode authentication tokens.

---

### Preparing Wireshark

Open **Wireshark** and configure it for maximum visibility.

In the **Source** and **Destination** filters, enter:

`*`

This allows Wireshark to capture all incoming and outgoing data without restriction.

After setting the filter, press **Start** to begin live packet capturing.

You should now see a constant flow of traffic in the packet list.

---

### Generating Traffic With Kimai

Next, we must generate activity toward the target firewall to force it to produce session-related data.

From your terminal, launch the Kimai script targeting the firewall:

`python3 ./kimai.py [ip address]`

Example:

`python3 ./kimai.py 44.55.66.77`

Each execution _may_ or may not result in a captured cookie.

Because of this, you must run the Kimai script repeatedly until a usable token appears in Wireshark.

While Kimai is running, Wireshark should display a continuous stream of packets.

---

### Finding the Cookie in Wireshark

Monitor the **Info** column in Wireshark.

When a cookie or token appears, it will usually be displayed as a short encoded string or session reference.

Continue running Kimai and monitoring the packets until a cookie-like entry becomes visible.

Once it appears, the data has been successfully captured.

Click on the packet to view its detailed contents, then copy the token.

---

### Decoding the Token

Now that you have the captured token, use the JWT Decoder tool.

Run the decoder script as follows:

`python3 ./jwt_decoder.py [token]`

Example:

`python3 ./jwt_decoder.py eyJhbGciOiJIUzI1NiIsInR5cCI6...`

The decoder will process the token and reveal its contents.

Among the decoded fields, you will find the firewall’s login credentials.

---

### Conclusion

At this stage:

1. The firewall IP was identified
2. Wireshark was configured to capture all traffic
3. Kimai generated forced traffic to obtain a token
4. A cookie was found inside Wireshark capture
5. The token was decoded using the JWT Decoder
6. Firewall login credentials were extracted successfully

---

# `whois`

WHOIS is an information-gathering command.

```
whois <domain-or-IP-or-email>
```

HackHub uses WHOIS for ownership/registration clues and, in 1.0 multiplayer infrastructure, to help investigate domains and possible origin information.

## When to use it

Use WHOIS when you have:

- a domain and need an owner/registrar clue;
- an IP and need registration context;
- an email connected to a target;
- a Cloudfire/origin-hunting problem.

## Multiplayer registrar difference

Current multiplayer gives registrars different privacy behaviour: GoDiddy includes WHOIS privacy while Namecheep exposes registration information. That means WHOIS can be much more useful against a Namecheep-registered domain.

---

# `nslookup` and `mxlookup`

## Resolve a domain

```
nslookup <domain>
```

Use this when the mission gives you a hostname/domain but you need an IP to scan.

## Find the mail server

```
mxlookup <domain>
```

Use this when the task involves mail infrastructure, mail logs or identifying the server that handles a company's email.

## Beginner decision

- Need the site's/server's IP? Start with `nslookup`.
- Need where mail is handled? Use `mxlookup`.
- Need deeper DNS/record/config information? Move to `dig`.
- Need past DNS/origin clues in multiplayer? Use `dnshistory`.

---

# `dig`

`dig` displays deeper DNS/network information used by several HackHub systems.

```
dig <domain-or-IP>
```

## Why it matters

It can reveal values that are useful for:

- DNS investigation;
- network/configuration objectives;
- origin-IP hunting;
- copying configuration values into `systemctl config` in content that asks you to modify a system.

Current builds format `systemctl config` data in a copy-friendly `key: value` style compatible with information shown by `dig`.

## Do not confuse it with Nmap

`dig` answers DNS/config-style questions. `nmap` answers **which network services/ports are exposed**.

---

# `lynx` and `geoip`

## `lynx`

HackHub uses `lynx` as an information-gathering/search tool.

```
lynx <search>
```

Search is case-insensitive in current builds. It is often useful before any network hacking because it can reveal company names, people, domains or mission leads.

## `geoip`

```
geoip <IP>
```

Returns location information for an IP when a mission cares about geographical/origin context.

## Beginner lesson

A mission mentioning a **person, article, company, address or public clue** may be asking for OSINT first, not a port scan. If you have no IP yet, `lynx` is often a better first move than blindly running network tools.

---

# `probe` and `dnshistory`

These commands became especially important with HackHub 1.0 infrastructure and origin-IP hunting.

## `dnshistory`

Use it to investigate historical DNS information. In multiplayer, it is one of the explicit tools for finding a real origin server hidden behind Cloudfire.

```
dnshistory <target>
```

If your current build prints slightly different usage, follow the live command help.

## `probe`

`probe` performs additional target probing and is another tool in the 1.0 origin-discovery chain.

```
probe <target>
```

## Typical origin workflow

When a company site is protected by Cloudfire, cross-check:

1. `whois`
2. `dig`
3. `dnshistory`
4. `probe`

Then compare those results with clues from `shadowlist.onion` and the target's current DNS.

---

# Subfinder and Nuclei

These are reconnaissance/pentesting-style tools used by HackHub content.

## Subfinder

Discover subdomains:

```
subfinder -d <DOMAIN>
```

Example:

```
subfinder -d example.test
```

Use discovered hosts as leads for `nslookup`, browser inspection or other recon.

## Nuclei

The in-game Handbook has documented Nuclei as taking a hosts file:

```
nuclei -h <HOSTS_FILE>
```

A hosts file contains one target/domain per line.

## Workflow

```
subfinder -d <domain>
# save useful hosts to a text file
nuclei -h <hosts-file>
```

These tools answer different questions: Subfinder expands the host list; Nuclei checks provided hosts for supported vulnerability patterns in the simulation.

---

# Domains, DNS, CDN and Origin IP

A domain is a name. DNS resolves that name to infrastructure. A CDN/proxy such as **Cloudfire** can sit in front of the real origin server.

## Normal domain recon

```
whois <domain>
nslookup <domain>
dig <domain>
subfinder -d <domain>
```

## Hidden origin in multiplayer

HackHub 1.0 explicitly supports origin hunting with:

```
dnshistory <target>
whois <target>
dig <target>
probe <target>
```

Clues can also feed into `shadowlist.onion`.

## Defender lesson

If you run infrastructure, merely putting Cloudfire in front of a site is not enough if old DNS or registration data exposes the origin.

## Attacker lesson

Do not attack the Cloudfire front end and assume it is the real host. Collect several independent clues and identify the underlying origin first.

---

# Goagle, Twotter and OSINT

Public information is often the first stage of a HackHub objective.

## Goagle

Use search/account/sign-in pages to follow public leads. HackHub 1.0 added an OAuth-style account consent/sign-in flow to the Goagle ecosystem.

## Twotter

Twotter was heavily rebuilt for 1.0 and supports richer posts/media, bookmarks, detail/status pages, profiles/search and multiplayer integration.

## What to extract

- employee names;
- usernames/handles;
- email patterns;
- company/domain names;
- clues in photos/posts;
- relationships between NPCs;
- links to repositories/articles/sites.

## Cross-check

If a Twotter post gives you a company but not its technical target, follow with `lynx`, WHOIS/DNS or browser research rather than immediately guessing an IP.

---

# Scripting

(Zeis' Important Note: This may only apply to the Multiplayer-version of the game, because `node` works there but it doesn't in the singleplayer game. Everything that follows up until `End of Scripting` should be viewed in a multiplayer context, which is wholly irrelevant for creating story quests and often unusable in singleplayer).

## Create Your Own Program

### How do I create my own program?

You can automate hacking or other things by creating your own custom programs.

You can do this with the **Code++** application.

Hackhub supports **TypeScript** language for scripting.

You can use the default TypeScript syntax. Additionally, Hackhub has functions and libraries defined for managing the game.

### Code++ Editor Features

- **Tabbed editing** - Open and work on multiple files at once. Drag tabs to reorder them.
- **Themes** - Choose from 20 color themes (Dracula, Tokyo Night, Catppuccin, etc.) in Settings.
- **Fonts** - Pick your preferred font family and size in Settings.
- **IntelliSense** - Full autocomplete and type checking for all built-in APIs.
- **Import support** - Split code across files with `import`/`export` (see "Modules & Imports").

### I wrote the code, But how do I run it?

After writing a program, you need the "node.js" package to run it.

`apt-get install node`

Then run the typescript file you saved.

`node /path/to/yourprogram.ts`

You can also press the **Play** button in Code++ to run the active file directly.

---

### Converting code to command

After writing a program, we run it with the "node" command. So how do we turn this program into a terminal command?

If you put the code file you created into the "lib" folder, that file will now run as a special command.

Example:

`/lib/myprogram.ts`

In terminal:

`myprogram`

Another example:

`/lib/custom-tool.ts`

`custom-tool`

---

### Modules & Imports

You can split your code across multiple files and import/export between them using standard TypeScript syntax.

### Exporting

Use `export` to make functions, classes, or variables available to other scripts.

```
// utils.ts
export function greet(name: string) {
    println("Hello, " + name + "!");
}

export const VERSION = "1.0";

export async function doWork() {
    println("Working...");
    await sleep(1000);
    println("Done.");
}
```

### Importing

Use `import` to bring in exports from another file. Paths are relative to the current file.

```
// main.ts
import { greet, VERSION, doWork } from "./utils";

greet("World");
println("Version: " + VERSION);
await doWork();
```

### How It Works

- Files are resolved relative to the importing file's directory (sibling files).
- The `.ts` extension is optional - `"./utils"` and `"./utils.ts"` both work.
- All built-in functions (`println`, `sleep`, `prompt`, `Shell`, `Networking`, etc.) work inside imported modules.
- Imports are resolved recursively - imported files can import other files.

### Multi-File Project Example

```
// scanner.ts
export async function scanTarget(ip: string) {
    const subnet = await Networking.GetSubnet(ip);
    if (!subnet) throw "No subnet found!";
    const ports = await subnet.GetPorts();
    return ports;
}
```

```
// main.ts
import { scanTarget } from "./scanner";

const ip = await prompt("Target IP: ");
const ports = await scanTarget(ip);
println("Open ports: " + ports.join(", "));
```

### Type Support

The Code++ editor provides full IntelliSense for imports. When you type `import { } from "./file"`, the editor will autocomplete exported symbols from that file.

---

### Lib - System

Basic I/O functions for your scripts.

### Printing Output

```
println("Hello World!");
println(42);
```

### Colored Output

```
println({ text: "Success!", color: "green" });
println({ text: "Error!", color: "red", backgroundColor: "#333" });
```

### Inline Colored Text

```
println([
  { text: "Status: ", color: "white" },
  { text: "OK", color: "green" }
]);
```

### Print Table

Display data in a formatted ASCII table.

```
printTable([
  { Name: "SSH", Port: 22, Status: "open" },
  { Name: "HTTP", Port: 80, Status: "closed" }
]);
```

### New Line

```
newLine();
```

### User Input

```
const ip = await prompt("IP Address: ");
println(`You entered: ${ip}`);
```

### Password Input (hidden)

```
const pass = await prompt({ label: "Password: ", password: true });
```

---

### Lib - Shell

Manage the terminal from your scripts.

### Terminal Lock

Lock terminal input during long operations.

```
await Shell.lock();     // Locks input
await Shell.unlock();   // Unlocks input
await Shell.isLocked(); // -> boolean
```

### Clear Terminal

```
await Shell.clear();
```

### Arguments

Get command-line arguments passed to your script.

Example: `myprogram -ip 192.168.1.1 -port 21`

```
const args = Shell.GetArgs();
// -> ["-ip", "192.168.1.1", "-port", "21"]
```

### Execute Commands

Run terminal commands from your script.

```
await Shell.Process.exec("nmap 192.168.1.1 -sV");
```

With working directory options:

```
// Run in a specific subdirectory
await Shell.Process.exec("cat passwords.txt", {
  cwd: "documents"
});

// Run with absolute path
await Shell.Process.exec("ls", {
  cwd: "/home/user/desktop",
  absolute: true
});
```

### Reading Output

exec() returns the command's output as text, so your script can use it.

```
const output = await Shell.Process.exec("nslookup freshfoods.com");
const ip = output.match(/\d+\.\d+\.\d+\.\d+/)?.[0];
println(`IP Address: ${ip}`);
```

Use `silent` when you only want the value and not the output on screen.

```
const output = await Shell.Process.exec("nslookup freshfoods.com", {
  silent: true
});
```

---

### Lib - Packages

To check if a package is installed

```
checkLib(packageName: string) -> Promise<boolean>
```

Example

```
await checkLib("lynx")
```

Returns true if package installed, and false for not installed.

### Installing Package

```
installLib(packageName: string) -> Promise<boolean>
```

Example

```
const  isInstalled = await  installLib("lynx");
println(isInstalled); // Returns true or false.
```

---

### Lib - Debug

You can use the game's developer console to log your output. Use the "F1" key to do this.

```
Debug.Log("Hello World!");
```

```
Debug.Error("This is error!");
```

---

### Lib - Thread

Used for thread operations.

### To wait

```
sleep(timeout: number (ms)) -> Promise<void>
```

```
println("Loading...");
await sleep(2500); // Waits 2.5 seconds
println("Done.");
```

---

### Lib - File System

Manage files and directories on the computer.

Most methods accept an optional `options` parameter:

- `absolute` - resolve path from root instead of current directory
- `recursive` - create intermediate directories automatically (Mkdir, WriteFile)

### Current Working Directory

```
const info = await FileSystem.cwd();
println(info.name);          // "desktop"
println(info.currentPath);    // "desktop"
println(info.absolutePath);   // "/home/user/desktop"
```

### Navigate Directories

```
await FileSystem.SetPath("documents");
await FileSystem.SetPath("/home/user", { absolute: true });
```

### List Files

```
const files = await FileSystem.ReadDir(".");
if (!files) throw "Cannot access directory!";
for (const file of files) {
  println(`${file.name} - ${file.isFolder ? "folder" : file.extension}`);
}
```

### Read File

```
const content = await FileSystem.ReadFile("notes.txt");
println(content);
```

### Write File

Creates a new file or overwrites an existing one.

```
await FileSystem.WriteFile("output.txt", "Hello World!");

// Auto-create parent directories
await FileSystem.WriteFile("deep/path/file.txt", data, {
  recursive: true
});
```

### Create Directory

```
await FileSystem.Mkdir("my-folder");
await FileSystem.Mkdir("path/to/folder", { recursive: true });
```

### Delete File or Folder

```
await FileSystem.Remove("old-file.txt");
```

---

### Lib - Networking

Network operations and subnet analysis.

### Validate IP Address

```
await Networking.IsIp("192.168.1.1"); // true
await Networking.IsIp("abc");         // false
```

### Get Subnet

```
const subnet = await Networking.GetSubnet("11.22.33.44");
if (!subnet) throw "Subnet not found!";
println(subnet.ip);    // "11.22.33.44"
println(subnet.lanIp); // "192.168.1.2"
```

### Subnet Methods

```
const subnet = await Networking.GetSubnet(ip);

// Get the router of this subnet
const router = await subnet.GetRouter();

// List open port numbers
const ports = await subnet.GetPorts(); // -> number[]

// Check if a specific port is open
const isOpen = await subnet.PingPort(22); // -> boolean

// Get detailed port information
const portData = await subnet.GetPortData(22);
if (portData) {
  println(portData.service);  // "ssh"
  println(portData.version);  // "OpenSSH 8.2"
  println(portData.external); // 22
  println(portData.internal); // 22
  println(portData.target);   // "192.168.1.2"
}
```

---

### Lib - Networking.Wifi

Wireless network scanning and attack tools (similar to Bettercap).

### List Interfaces

```
const interfaces = await Networking.Wifi.GetInterfaces();
for (const iface of interfaces) {
  println(`${iface.name} - monitor: ${iface.monitor}`);
}
// wlan0 - monitor: true
// wlan1 - monitor: false
```

### Scan Networks

Requires a monitor-mode capable interface (e.g. `wlan0`).

```
const networks = await Networking.Wifi.Scan("wlan0");
for (const ap of networks) {
  println(`${ap.ssid} | ${ap.bssid} | Ch:${ap.channel} | Signal:${ap.signal}`);
}
```

### Deauthentication Attack

Send deauth frames to disconnect clients from an access point.

```
await Networking.Wifi.Deauth("wlan0", targetBssid);

// With custom packet count
await Networking.Wifi.Deauth("wlan0", targetBssid, { packets: 10 });
```

### Capture WPA Handshake

Captures the WPA handshake and saves it as a `.pcap` file in the current directory.

```
const pcapFile = await Networking.Wifi.CaptureHandshake("wlan0", bssid);
println(`Saved: ${pcapFile}`); // "networkname.pcap"
```

### Full Example - Wi-Fi Cracker

```
const ifaces = await Networking.Wifi.GetInterfaces();
const mon = ifaces.find(i => i.monitor);

const networks = await Networking.Wifi.Scan(mon.name);
const target = networks[0];

await Networking.Wifi.Deauth(mon.name, target.bssid);
const pcap = await Networking.Wifi.CaptureHandshake(mon.name, target.bssid);

const password = await Crypto.Hashcat.Decrypt(pcap);
println(`Password: ${password}`);

await Networking.Wifi.Connect(target.bssid, password);
```

### Connect

Joins an access point by SSID or BSSID. Throws when the target cannot be found, when several networks share the same SSID, or when the passphrase is rejected.

```
await Networking.Wifi.Connect("HOME_5Ghz", "letmein123");

// Leave the passphrase out and you are asked for it on the terminal (masked input)
await Networking.Wifi.Connect(target.bssid);
```

### Current Connection

```
const ap = await Networking.Wifi.GetCurrent();
println(ap ? `Connected: ${ap.ssid}` : "Offline");
```

### Disconnect

Returns `false` when there was no connection to drop.

```
await Networking.Wifi.Disconnect();
```

---

### Lib - Crypto

Cryptographic utilities and password cracking.

### Hashcat - Crack Wi-Fi Passwords

Decrypt captured `.pcap` files to reveal Wi-Fi passwords.

```
const password = await Crypto.Hashcat.Decrypt("capture.pcap");
println(`Cracked: ${password}`);
```

With path options:

```
// Resolve from a specific directory
await Crypto.Hashcat.Decrypt("capture.pcap", { cwd: "downloads" });

// Resolve from root
await Crypto.Hashcat.Decrypt("capture.pcap", { absolute: true });
```

### Hash Utilities

```
// Generate MD5 hash
const hash = Crypto.Hash.md5("hello world");

// Encrypt a password (stores mapping for later decryption)
const encrypted = await Crypto.Hash.encrypt("mypassword");

// Decrypt a previously encrypted hash
const original = await Crypto.Hash.decrypt(encrypted);
println(original); // "mypassword"
```

---

### Lib - HackDB

Access the exploit database programmatically.

### List All Exploits

```
const exploits = await HackDB.ListExploits();
for (const exploit of exploits) {
  println(`${exploit.title} - ${exploit.service} ${exploit.version}`);
}
```

### Search Exploits

```
const results = await HackDB.SearchExploits("ftp");
printTable(results.map(e => ({
  Title: e.title,
  Service: e.service,
  Version: e.version
})));
```

### Download Exploit

```
// Download to ~/downloads (default)
await HackDB.DownloadExploit("sqlmap");

// Download to a specific directory
await HackDB.DownloadExploit("wordlist", "tools");

// Download with absolute path
await HackDB.DownloadExploit("kimai", "/home/user/desktop", {
  absolute: true
});
```

---

### Lib - NTLM

NTLM authentication attack library.

### Check NTLM Service

Check if a target has NTLM authentication enabled.

```
const hasNtlm = await NTLM.Check("11.22.33.44");
if (!hasNtlm) throw "No NTLM service found.";
```

### Connect & Dump Hashes

```
const connection = await NTLM.Connect("11.22.33.44");
const instance = await connection.GetInstance("2"); // NTLM version
await instance.Dump("admin"); // Dumps the user's NTLM hash
```

### Full Example

```
const ip = "11.22.33.44";

if (await NTLM.Check(ip)) {
  println("NTLM service found, connecting...");
  const conn = await NTLM.Connect(ip);
  const ntlm = await conn.GetInstance("2");
  await ntlm.Dump("admin");
  println("NTLM hash dumped successfully.");
}
```

---

# Git and Repositories

HackHub has an in-game Git/repository system for scripts and shared files.

## Initialize

```
git init -n <REPO_NAME>
```

## Commit

```
git commit -m <MESSAGE>
```

## Push

```
git push
```

## Pull

```
git pull
```

## Clone

```
git clone <REPOSITORY_SLUG> <PATH>
```

Example:

```
git clone example-hack-tool /home/user/repo-folder
```

## Useful behaviour

Repositories can be public or private in the game. Current versions render repository README Markdown and recognize both `readme.txt` and `readme.md`.

If you move a useful script out of a cloned repository, use a current build: older versions had file-ID bugs around cloned content that have since been fixed.

---

# Python, pip and Node

HackHub supports scripts used by missions and community tools.

## Python

Install Python when needed:

```
apt-get install python3
```

Run:

```
python3 <PATH_TO_SCRIPT>
```

Example:

```
python3 /downloads/net_tree.py
```

## pip

```
apt-get install pip
pip install <PACKAGE>
```

For example, `sqlmap` has been delivered through the Python/pip flow in game content.

## Node / TypeScript

```
apt-get install node
node <SCRIPT.ts>
```

HackHub's scripting environment has become increasingly capable, including scripts that can execute shell commands and interact with Wi-Fi in supported versions.

## Good habit

Keep downloaded scripts in clearly named folders and read their mission instructions/README before running them. A script can expect arguments in a completely different order from a built-in terminal command.

---

#### End of Scripting

---

# Suspicion

### What is Suspicion Level?

Suspicion level, as the name suggests, indicates your level of suspicion in the game.

Be careful what you do when hacking or baiting someone!

---

### How does my level of Suspicion increase?

Your level of suspicion in the game usually increases when you make an incomplete or incorrect action during the hacking phase or while sending phishing emails.

### Hacking

- When you access a system, you need to find the access logs.
- Afterwards, you should delete the log stating that you have obtained a shell and not touch the other logs, otherwise the missing logs will be noticed by the system administrators.

### Phishing Emails

- When sending a phishing email, make sure you enter the data correctly or you will attract suspicion!

---

### How to reduce Suspicion?

- You can change your connected Wi-Fi network, this will change the IP and DNS address, which will reduce your suspicion level.

---

### What happens at high levels of suspicion?

- If your suspicion level is 50% or higher, there is a possibility that you can be hacked at any time. These hacks include mini games, if you succeed in these mini games, you will avoid the hack, if you fail, you will be penalized such as losing your money.
- If the suspicion level reaches 100%, you will be seized by federal authorities and lose all your money.

---

# Phone, Netrun and Suspicion

The phone is an active part of HackHub's mission/UI system.

## Netrun

HackHub 1.0 added the **Netrun** phone app and uses it to surface darknet hints in supported content.

## Suspicion

The phone includes a Suspicion app in relevant content/modes. Treat suspicion/attention indicators as feedback that your actions can have consequences rather than as a reason to spam tools faster.

## Calls/dialogues

Some quests deliver branching phone dialogues. Read the wording carefully because story choices can affect later missions/endings.

## UI behaviour

Current patches ensure the phone draws over app windows so it remains usable when the desktop is busy.

---

# Heat, Reputation and Tracing

Multiplayer adds consequences that do not behave exactly like ordinary singleplayer jobs.

## Heat / reputation

Aggressive or careless activity can draw attention. Treat the online world as persistent/shared rather than a disposable quest network.

## Tracing

While attacking a network, you can observe that others/NPCs are interacting with the same target, and your own source IP can become visible through the same systems.

## Practical implications

- Avoid assuming your home connection is anonymous.
- Rented servers/proxy-style infrastructure can move where your activity appears to originate.
- Watch/NetworkMonitor features help track target activity.
- Higher-tier jobs may require more staged access rather than one command.

## Important

The exact balance of heat/reputation/tracing can change across multiplayer patches. Use the current UI indicators as the source of truth for penalties and timers.

---

# Staged Hacking and Surveillance

Multiplayer hacks can be **staged/gated** rather than allowing every action immediately.

## Meaning

You may need to collect/activate prerequisites before the next breach step is available, such as:

- VPN certificate/config;
- authentication key;
- decoded artifact;
- cracked target material;
- exploit/loot obtained from a previous stage;
- suitable network route/pivot.

## Surveillance

The watch/surveillance system can show observer/NPC aliases and target activity. This is why the right response to “command refuses to run” is often to check the required artifact/stage rather than retrying the same command repeatedly.

## Beginner rule

Treat the multiplayer objective/status UI like a dependency list. Complete prerequisites in the order the game exposes them.

---

#### End of Suspicion

---

# Python Modules 1

(Zeis' Note: These are Singleplayer Tools and important for advanced and expert quests - even some beginner ones.)

### Python Module: Evil-Rm

Connect to a remote machine and execute a command.

Installing `pip install evil-rm`

Usage `evil-rm -i <ip address> -u <username> -H <hash>`

**Important** To use Evil-RM, you need to know the username and password hash of a user on the target device. For this, we recommend reviewing NTLM tools.

Example `evil-rm -i 47.189.132.4 -u alex -H 09bb63bf7635f9cfd50f022e7a3b0dba`

---

### Python Module: Fern

A tool for cracking router passwords if the router model is publicly available.

Usage

- Download fern.py from hackdb.net.
- Install python `apt-get install python3`
- `python3 fern.py`
- Enter router model.

Example `python3 /home/user/downloads/fern.py` `Router Model > WN087A2`

---

### Python Module: JWT Decoder

This exploit decodes JWT tokens and manipulates their payload to bypass security and escalate privileges. It's commonly used to exploit weak or absent JWT signature validation mechanisms.

Usage

- Download jwt_decoder.py from hackdb.net.
- Install python `apt-get install python3`
- `python3 jwt_decoder.py <jwt token>`

Example `python3 /home/user/downloads/jwt_decoder.py eyJ...`

---

### Python Module: Kimai

Kimai is vulnerable to SameSite-Cookie-Vulnerability-session-hijacking. The attacker can trick the victim to update or upgrade the system, by using a very malicious exploit to steal his vulnerable cookie and get control of his session.

Kimai is known to be effective on firewalls.

Usage

- Download kimai.py from hackdb.net.
- Install python `apt-get install python3`
- Start listening on Wireshark.
- `python3 kimai.py <ip address>`
- Kimai may not be able to steal a cookie 100% of the time. If you can't get a cookie, try again.

Example `python3 /home/user/downloads/kimai.py 46.20.15.34`

---

### Python Module: Net Tree

This exploit leverages an IP address as input to generate a complete network topology. Using active and passive scanning techniques, the tool identifies routers, switches, and connected devices, along with their open ports and services. The output is visualized using a tree-like structure for better readability.

Usage

- Download net_tree.py from hackdb.net.
- Install python `apt-get install python3`
- `python3 net_tree.py <ip address>`

Example `python3 /home/user/downloads/net_tree.py 46.20.15.34`

---

### Python Module: Pret

PRET is a new tool for printer security testing developed in the scope of a Master's Thesis at Ruhr University Bochum. It connects to a device via network or USB and exploits the features of a given printer language.

Usage

- Download pret.py from hackdb.net.
- Install python `apt-get install python3`
- `python3 pret.py <ip address>`

Example `python3 /home/user/downloads/pret.py 46.20.15.34`

**Important**

- PRET requires the printer to be reachable via its LAN IP address with port 9100 (RAW printing) open. If port 9100 is closed, PRET cannot communicate with the printer.

---

### Python Module: pyUserEnum

pyUserEnum is a tool for enumerate users on a subnet.

Usage

- Download pyUserEnum.py from hackdb.net.
- Install python `apt-get install python3`
- `python3 pyUserEnum.py <ip address>`

Example `python3 /home/user/downloads/pyUserEnum.py 46.20.15.34`

---

### Python Module: Sqlmap

Sqlmap is a tool for testing and exploiting SQL injection vulnerabilities.

Installing `pip install sqlmap`

Usage `sqlmap -u <url> <options>` or `python3 sqlmap.py -u <url> <options>`

List of available options

- Listing tables: `sqlmap -u <url> -tables`
- Dump table data: `sqlmap -u <url> -dump -table <table name>`

Example usage  
Let's say our target is bestecommerce.com and there is a SQL vulnerability.

`sqlmap -u bestecommerce.com -tables`

Result

|Table name|
|---|
|Products|
|Users|

Then `sqlmap -u bestecommerce.com -dump -table Products`

Result

|Product ID|Product Name|Price|
|---|---|---|
|1|Phone|499$|
|2|Computer|999$|

---

### Python Module: WigleNet

WigleNet is a tool to find all devices in a specific location.

Usage

- Download wiglenet.py from hackdb.net.
- Install python `apt-get install python3`
- `python3 wiglenet.py -lat <latitude> -long <longitude>`

Example `python3 /home/user/downloads/wiglenet.py -lat 145.06 -long 68.592`

---

#### End of Python Modules 1

---

#### End of Handbook
