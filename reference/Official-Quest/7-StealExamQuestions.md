# Steal Exam Questions

1. Receive SMS from "BJarni Sanz"

"Add me on kisscord: Bjarni_Sanz61"

2. Open Kisscord and add Bjarni_Sanz61 -> Bjarni_Sanz61 messages player. | Note: All player replies use Typewriter effect

Bjarni_Sanz61: Whats up dude! How are you?
Player: Good, and you?
Bjarni_Sanz61: Everything is fine, thank you. I have a question, could you help me with something?
Player: What would you like me to do?
Bjarni_Sanz61: I'm currently in the university cafe and the professor is sitting next to me. I'm sure he has our exam on his computer.
Bjarni_Sanz61: Can you access the professor's computer and steal the exam file?
Player: Man... this is quite a hassle.
Bjarni_Sanz61: Dude, please... If I fail this course, I can't graduate.
Player: All right all right. I will handle it. What was the professor's name?
Bjarni_Sanz61: His name is Hulda Sichantha.
Bjarni_Sanz61: Thank you very much, I am waiting to hear from you.

3. The hack

- Research on the professor and try to find an IP address from linked places.

`lynx Hulda Sichantha`

Result:
Scanning social media platforms...
No data found.
Searching for contact information...
No data found.
Checking for IP address activity...
No data found.
Locating physical address...
No data found.
Searching web for additional information...
Info(s): Lecturer at "Jenkins and Sons University"

`lynx Jenkins and Sons University`

Result:
Scanning social media platforms...
No data found.
Searching for contact information...
No data found.
Checking for IP address activity...
IP Addresses: 203.186.219.156
Locating physical address...
No data found.
Searching web for additional information...
No data found.

- Create a network map of target school's network

`python3 net_tree.py 203.186.219.156`

This opens a NetTree GUI with the following contents:

Router: 203.186.219.156 | LAN: 192.168.1.1

Connected to the Router are:
Host: 135.141.104.201 | LAN: 192.168.1.2
Host: 89.80.101.48 | LAN: 192.168.1.3
Host: 75.191.191.136 | LAN: 192.168.1.4
Host: 140.63.153.180 | LAN: 192.168.1.5
Host: 25.13.2.252 | LAN: 192.168.1.6

- Find the right target by trying one by one

`whois 135.141.104.201`
Result:
Server: 135.141.104.201
Contact Name: Masami Matsumoto
Contact Mail: masami-matsumoto@mail.biz
Status: ACTIVE

`whois 89.80.101.48`
Result:
Server: 89.80.101.48
Contact Name: Mohan Goldstein
Contact Mail: mohan.goldstein@hotmail.info
Status: ACTIVE

`whois 75.191.191.136`
Result:
Server: 75.191.191.136
Contact Name: Susan Brown
Contact Mail: susan+brown687@uol.dev
Status: ACTIVE

`whois whois 140.63.153.180`
Result:
Contact Name: Hulda Sichantha
Status: ACTIVE

- Look up target ports. Use "-sV" flag for detailed inspection

`nmap 140.63.153.180 -sV"

Result:
PORT	STATE	SERVICE	VERSION	DESTINATION
21	CLOSE	ftp		192.168.1.5
22	OPEN	ssh	OpenSSH 4.33.50	192.168.1.5
443	CLOSE	https		192.168.1.5
8080	CLOSE	http		192.168.1.5

- Open a metasploit session and gain access

`msfconsole` -> `search ssh` -> `use 0` -> `set rhost 140.63.153.180` -> `set rport 22` -> `set version 4.33.50' -> exploit

- Download the exam files

`explorer` to open a GUI file browser -> navigate to "Root/Home/Hulda_sichantha8/Desktop/Exams" and download "2024-fall-exam.docx"

- (Optional) navigate to "Root/logs" -> open "sys.log" -> Select entries that show player was here and delete them (not doing so increases suspicion level) - log entries show established and dropped connections and from which IP (player) they came

-> exit meterpreter session

- Send the exam file to your friends

Open Kisscord -> Open Bjarni_Sanz61 chat -> drag 2024-fall-exam.docx file into the chat or add it through the file upload button
Player (typewriter): Here is your exam!
(Player sends message)
Bjarni_Sanz61: Dude I can't believe you!!!! Thank you sooooo much...

Quest autocompletes here

Bjarni_Sanz61's kisscord status switches to "Offline".