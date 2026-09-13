# The Journalist's Sister Part 1

The moment the previous quest completes, a new contact (harveymack) is added to kisscord and an Email from "harveymack@bccnews.com" arrives

1. The Email

"Subject: I need your help

Hello,

I don't know if you know me... I am a well-known journalist at BCC News.

I have a sister. She went on a trip 2 weeks ago. It would normally last 5 days but I still haven't heard from her. The police haven't even been dealing with her properly for a week. Maybe it's something people who don't like me do, I don't know...

My friend recommended you, maybe you can help.

I really need help.

If you want to help, you can reach me on kisscord.

harveymack"

2. Message Harvey

Open Kisscord and click on harveymack's chat. All player messages use the Typewriter effect.

Player: Hi, how can i help you?
harveymack: Hi, as I told you in the mail, I haven't heard from my sister.
harveymack: police literally don't care, I'm so confused
Player: What exactly do you want from me?
harveymack: My friend recommended you, he has received work from you before.
harveymack: Please help me, I need to find my sister.
Player: Ok I will help but you need to give me information
harveymack: My sister travels all the time, that's her job. Her name is Alina Mack
Player: Okay, I'll do some research.
harveymack: Thank you very much.

3. The hack

- Investigate the missing person

`lynx Alina Mack`

Result:
Scanning social media platforms...
Accounts: Twotter account was found with the registered username @alinamack
Searching for contact information...
No data found.
Checking for IP address activity...
No data found.
Locating physical address...
No data found.
Searching web for additional information...
No data found.

- Gather information about where the girl is staying

Open Twotter and search for "alinamack" ->
Shows 10 tweets ranging from "a year ago" to "9 months ago" all the way down to "8 days ago", each weet talking about how she's excited to travel. The second to last tweet reads "Something very strange happened today. I have a feeling something is going on at the Grand Hotel" ->

`lynx Grand Hotel`

Scanning social media platforms...
No data found.
Searching for contact information...
No data found.
Checking for IP address activity...
No data found.
Locating physical address...
No data found.
Searching web for additional information...
Info(s): 
5-star hotel located in Florida.
-------------------------
It is known that it generally provides accommodation services to important people, politicians and heads of state.
-------------------------
Website: grandhotel.com

- Find the IP address of the hotel

`whois grandhotel.com`

Result:
Whois results not found.
 
`nslookup grandhotel.com`
 
Result:
Server: grandhotel.com
Address: 34.189.23.85

- Find an open port

`nmap 34.189.23.85 -sV`

Result:
PORT	STATE	SERVICE	VERSION	DESTINATION
21	CLOSE	ftp	vsftpd 5.31.29	
22	CLOSE	ssh	openssh 6.40.28	
25	CLOSE	smtp	postfix 3.97.71	
3306	CLOSE	mysql	mariadb 9.78.39

4. Talk to the journalist

Open kisscord and harveymack's chat. All player responses use the Typewriter effect.

Player: I did some research and found the hotel where she was staying.
Player: I got access to the hotel's information, but I couldn't make any attacks, they have a secure system.
Player: I will continue my research tomorrow.
harveymack: Ok, thanks 😞

-- Screen Fades to Black and shows "1 Day Later"

# The Journalist's Sister Part 2

1. Talk with the journalist

Open kisscord and harveymack's chat. All player responses use the Typewriter effect.

Player: I'm going to talk to a friend who is in Florida today.
Player: He will go to the Grand Hotel and give me remote access there.
harveymack: Oh god, thanks. I hope we find something there.
Player: I hope so.

The moment the player sends "I hope so.", a new kisscord contact is added: "tayLoR". 

- Talk with Taylor

Open kisscord chat with tayLoR:

Player: what's up fella?
tayLoR: yoo, im fine. what u doing?
Player: I'm looking for a missing girl. I need your help.
tayLoR: how can i help you?
Player: you need to go to the Grand Hotel and provide me with information to access it remotely.
tayLoR: now?
Player: yes
tayLoR: ok. wait

-- Screen fades to black and shows "1 Hour Later..."

tayLoR: im here, in lobby. What should i do rn?
Player: Give me an access point so I can infiltrate the hotel from outside
tayLoR: ok.
tayLoR: I installed malware on the lobby internet. It will allow you to access it from outside. Ip address: 129.216.180.210
tayLoR: I can't do anything more, I'm drawing too much attention, everyone is looking at me.
Player: Good, rest on me. Leave now.
tayLoR: ok cya

tayLoR's kisscord status switches to AFK

- Generate the network map tree of the hotel lobby

`python3 net_tree.py 129.216.180.210`

This opens a NetTree GUI with the following contents:

Router: 129.216.180.210 | LAN: 192.168.1.1 | ESSID: Grand Hotel Lobby

Connected to the Router are:

Host: 219.136.35.240 | LAN: 192.168.1.2 | HOST: Reception
Host: 205.46.127.45 | LAN: 192.168.1.3
Host: 40.147.242.107 | LAN: 192.168.1.4
Host: 11.149.67.115 | LAN: 192.168.1.5
Host: 165.84.176.220 | LAN: 192.168.1.6

´nmap 219.136.35.240 -sV`

Result: 
PORT	STATE	SERVICE	VERSION	DESTINATION
21	CLOSE	ftp		192.168.1.2
22	CLOSE	ssh		192.168.1.2
23	OPEN	telnet	Telnet 3.61.42	192.168.1.2
80	CLOSE	http		192.168.1.2
139	CLOSE	smb		192.168.1.2
445	CLOSE	smb		192.168.1.2

- Hack into the reception device using metasploit

`msfconsole` -> `search telnet` -> `use 0` (exploit/telnet/telnet_access) -> `set rhost 219.136.35.240` -> `set rport 23` -> `set version 3.61.42` -> `exploit`

- Download the file with the customers staying at the hotel.

`explorer` to open a GUI file browser -> navigate to "Root/Home/Micelle/Desktop" and download "Customers List.xlsx"

- (Optional) navigate to "Root/logs" -> open "sys.log" -> Select entries that show player was here and delete them (not doing so increases suspicion level)
Log entries:
"Shell Access | Remote user 68.250.77 obtained a shell using port "23"."
"Connection | 68.250.18.77 established a remote connection."

-> exit meterpreter session

- Examine the list and find the room number where the girl is staying

Open the downloaded file -> Shows a table with #, ROOM, FIRSTNAME, LASTNAME

- Research the names of the people staying in the room next to the girl's room.

According to the customer list, Alina Mack was in room 207. Room 206 had "Carlos Fuchs" in it and room 208 had "Abu Zahir Al-Karim" in it.

`lynx Carlos Fuchs`

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
No data found.

`lynx Abu Zahir Al-Karim`

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
Info(s):
Source: International Security Agency Report
-------------------------
Date: July 14, 2007
-------------------------
Details: Abu Zahir Al-Karim was named as one of the terrorists who planned the bombing in Vienna, Austria in 2007. The attack resulted in an explosion at a cafe in the city's historic center, killing 35 people. The Jihad terrorist organization claimed responsibility for the incident, and Al-Karim was reported to have provided the explosives needed for the attack.
-------------------------
==================================================
-------------------------
Source: Regional Intelligence Agency
-------------------------
Date: March 22, 2010
-------------------------
Details: Abu Zahir Al-Karim has close ties to the "Jihad" organization operating in the city of Al-Qahir. It is known that he is responsible for the financing and logistics of the cell structures in the city. Abu Zahir Al-Karim fled to Al-Qahir to hide from security forces, especially after the Vienna attack.
-------------------------
==================================================
-------------------------
Source: National Counter-Terrorism Unit
-------------------------
Date: June 5, 2020
-------------------------
Details: Abu Zahir Al-Karim plays a key role in providing weapons and ammunition by transferring money he obtained illegally to terrorist organizations. It is known that he was provided with large amounts of financial support, especially after the Vienna attack, and that he used this money for the organization.

- Research the group that the people you find are affiliated with.

`lynx Jihad' 

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
Info(s):
Source: International Institute for the Study of Terrorism
-------------------------
Date: May 12, 1998
-------------------------
Details: Jihad Organization is a terrorist organization that took root in the Middle East in the late 1990s. The organization ideologically advocates radical Islamist views and organizes attacks against Western countries under the name of "jihad." Especially with the strategic vision of its leader Abu Hamid Al-Najjar, the organization has begun to be effective in countries outside the Middle East.
-------------------------
==================================================
-------------------------
Source: European Security Agency (ESA)
-------------------------
Date: July 17, 2007
-------------------------
Details: Jihad Organization has been involved in many terrorist acts in Europe. The bomb attack in Vienna in 2007 in particular caused a great repercussion for the organization in the Western world. The attack revealed that the organization was conducting long-term operations on the continent, and it was determined that important names such as Abu Zahir Al-Karim were involved in this action.
-------------------------
==================================================
-------------------------
Source: Local Security Forces
-------------------------
Date: October 5, 2010
-------------------------
Al-Qahir is known as one of the main bases of the Jihad Organization. The organization carries out arms and explosives smuggling, militant training and intelligence activities through underground cell structures in the city. Leading figures such as Abu Zahir Al-Karim have led important operations in this region.
-------------------------
==================================================
-------------------------
Source: US Counterterrorism Office
-------------------------
Date: March 3, 2015
-------------------------
Jihad Organization is listed as a terrorist organization by the US State Department. The organization is seen as having connections to the global terror network and is particularly active in conflict zones such as Syria, Iraq and Yemen. It is also notable for its radical propaganda and attempts to gather financial support against Western countries.

- Talk with journalist and send room list

Open kisscord and message harveymack. All player responses use the Typewriter effect:

Player: Hi, i found something strange.
("Customers List.xlsx" file gets automatically attached to the next message.)
Player: This is list of guests staying at this hotel
Player: The name of the man staying in the room next to your sister's room caught my attention.
Player: The guy's name is Abu Zahir, I investigated the guy and found out that he is a member of a terrorist organization.
Player: He was a high-ranking person at Jihad operating in Al-Qahir.
harveymack: Holy shit! I know them, I've reported and prevented many of the actions they were about to take.
harveymack: Many members of the organization were caught because of me.
harveymack: Do you think it has something to do with that?
Player: Do you think this is a coincidence? This organization is most likely involved. Possibility of them kidnapping your sister is very high. Because they entered and exited on the same day as your sister.
harveymack: So what do we do?
Player: I'll do some more research and make sure. We're still not sure if your sister was kidnapped.
harveymack: Ok I am waiting...

-- Screen fades to black with "6 Hours Later..."

# The Journalist's Sister Part 3

1. Talk with taylor.

Open tayLoR's kisscord chat. All player responses use the Typewriter effect:

Player: Hi Taylor, it's me again.
tayLoR: Hi, what did you do? Were you able to take care of your business at the hotel?
Player: I got it. I need to ask you something. I'm trying to reach someone. I did some research but couldn't find any contact information. Can you help me?
tayLoR: I don't have any knowledge about those things but I know someone. He knows these things well, if you want I can give you his username, try talking.
Player: Sure, send it.
tayLoR: cyberCrow
tayLoR: His name is Victor. He is a cold person, he doesn't like to talk much, get straight to the point.
Player: Ok, thx.

"cyberCrow" gets automatically added to the player's contact list.

2. Talk with Victor.

Open cyberCrow's kisscord chat. All player responses use the Typewriter effect:

Player: Hi Victor. My friend Taylor recommended you. I hope we can do business together. I need someone's contact information.
cyberCrow: We'll work. First send $100 to this account RU99N135M674EW8BBOJMCI78X then write the man's name and surname. The rest is on me.
Player: ok.

- Send $100 to Victor's bank account.

Player opens their bank account on lcb.com and transfers $100 to the IBAN previously provided.

- Send the name of the kidnapper to Victor.

Player messages cyberCrow on kisscord (typewriter effect):

Player: I sent the money. Our man's name is Abu Zahir Al-Karim
cyberCrow: I'll take care of it.

-- Screen fades to black with "1 Hour Later..."

cyberCrow: The man left no trace like a ghost. However, he uses a phone registered to someone else. He has not made any phone calls or anything on that line. He only uses whatsapp. LTE IP address: 227.118.52.205
Player: Thanks, this works for me.

3. Monitor outgoing network traffic via target's IP address using Wireshark.

Player opens Wireshark app -> Enters "227.118.52.205" into "Source" field and clicks the Play button -> 21 misc "KeepAlive" events fire until Event 22. Destination: api.whatsupp.com | Protocol: TCP | Length: 936 | Info: HTTP Request (more random KeepAlive requests afterwards)

- Examine the packet containing important information. 

Player clicks on the api.whatsupp.com entry.



Result:
Frame: 1022: 936 bytes
Source: 227.118.52.205
Destination: api.whatsupp.com
Protocol: TCP
Info: HTTP Request
Request:
                            Headers:
                                Access-control-allow: *
                                Origin:
                                Cache-Control: no-cache
                                Content-Type: application/json
                                Cross-Origin-Resource: cross-origin
                            Body: {"message":"I got the girl, we are coming."}
                            Response:
                            Headers:
                                Access-control-allow: *
                                Origin:
                                Cache-Control: no-cache
                                Content-Type: application/json
                                Cross-Origin-Resource: cross-origin
                            Body: {"message":"Be careful with the girl, don't let her nose bleed. Boss will kill us."}
							
4. Talk to the journalist about the situation

Open kisscord and message harveymack. All player responses use the Typewriter effect:

Player: After a long investigation, unfortunately, I was sure that your sister had been kidnapped.
harveymack: Damn it!
harveymack: What the hell are we gonna do now?
Player: First of all, we'll calm down. Is there anything on your mind?
harveymack: No, I can't think right now...
Player: Okay, so I'll try to reach out to these guys and find out what they want.
harveymack: Ok, I'm waiting to hear from you again.

-- Screen fades to black with "1 Day Later" and closes all programs and windows. All kisscord contacts except for harveymack set status to "Offline".

# The Journalist's Sister Part 4

1. Find the target's location information by ip address.

`geoip 227.118.52.205`

Result:
Country: Jilvania
City: Al-Qahir
Latitude: 95.5504
Longitude: 182.0594

- Find all devices in this location.

`python3 wiglenet.py -lat 95.5504 -long 182.0594`

Result:
+--------+-----------------+-----------+----------+----------+----------+
| Type   | IP Address      | longitude | latitude | City     | Country  |
+--------+-----------------+-----------+----------+----------+----------+
| DEVICE | 210.229.227.117 | 182.0594  | 95.5504  | Al-Qahir | Jilvania |
| ROUTER | 1.206.189.25    | 182.0594  | 95.5504  | Al-Qahir | Jilvania |
+--------+-----------------+-----------+----------+----------+----------+

2. Hack devices at the location and try to obtain contact information.

`nmap 210.229.227.117 -sV`

Result:
PORT	STATE	SERVICE	VERSION	DESTINATION
49816	FORWARDED	http	Nginx 1.25.37	192.168.1.2

`msfconsole` -> `search http` -> `use 0` (exploits/http/nginx_chunked_size) -> `set rhost 210.229.227.117` -> `set rport 49816` -> `set version 1.25.37` -> `exploit` 

`explorer` to open a GUI file browser -> navigate to "Root/Home/Omar.Ibnazad8/Desktop" and find "readme.txt" there -> download it

that readme.txt contains:

"Contact me from weechat. IP: 196.179.140.180 Password: fortuna"

3. Contact via the IP address you found.

`weechat 196.179.140.180 fortuna`
Opens a weechat session. All player responses use the Typewriter effect.

Server: [09:09:2026 14:17:56] Zeis connected to the server.
abduLkhaLid: Welcome, we knew you would reach us.
Player: Don't hurt the girl.
Player: What do you want?
abduLkhaLid: We have 3 requests in total. We will tell you the other one after we finish one.
abduLkhaLid: If you fulfill our demands, we will hand over the girl without any harm.
Player: Okay. What are your requests?
abduLkhaLid: First, let's start with your first task. We want you to share a news story on our behalf on the BCC News website.
abduLkhaLid: We will send you the content of the news by e-mail. If you complete the first task, we will send you a new communication IP address and you will receive your next task.
Zeis: Okay, I will do it.
Server: [14:19:50] abduLkhaLid disconnected from the server.

4. Talk with the journalist.

Open harveymack's kisscord chat. All player responses use the Typewriter effect:

Player: I contacted the guys, they already knew I was going to hack them. They left me their IP address and I talked to the guys.
harveymack: Are you serious? So what did they say?
Player: I asked what they wanted, they want 3 things from me. But they only told me one. If I can do it they will tell me the other. And when it's done they say they will release the girl.
harveymack: So what did they want?
Player: They want me to hack BCC News and enter a news story about them. They sent the news via e-mail.
harveymack: Please do it. For my sister.
Player: I will do it. But you will help me.
Player: I will try to hack into the system and find an editor account. You will enter the news.
harveymack: Okay. Makes sense. I'll wait for you to deliver account then.

# The Journalist's Sister Part 5

1. Player receives Email with instructions to download the content

"Subject: News Content
From: abdul.khalid@qahirmail.com

Upload the content we provide to bcc.com.

Attachment: news_content.docx"

(Clicking on the attachment downloads the file)

2. Send file to Journalist

Open kisscord -> "news_content.docx" is already automatically attached to harveymack's chat but not sent yet -> Typewriter effect on whatever player writes:

Player: This is the document the guys sent. You're going to put this in the news. (file sends wen player sends message)
harveymack: Ok, I need an account. I'm waiting...

3. Go to bcc.com website and try to find any useful information

Player goes to the news website bcc.com (the games' spoof on bbc.com) which is a website that gets reused for another quest later down the line - and finds the top article right now reads:

"BCC NEWS BREAKING - Harvey Mack's Sister, Alina Mack, Mysteriously Vanishes!

Alina Mack, 25, has been reported missing after she was last seen at the Grand Hotel in Florida three days ago. Witnesses say she appeared to be alone before disappearing without a trace. Her phone was later found turned off, raising concerns about her safety."

Opening that article, the player can see the article is written by "Clara Mendes", but the player needs an editor account, not a journalist's account, so this is a red herring. Reading through the article, the player sees the final line: "Editor: Moses Endo"

4. Find the site's IP address

Objectives tell the player to find the IP address, which is good because most players would try to find as much info about Clara Mendes and Moses Endo and possibly get stuck.

`whois bcc.com`

Result:
Server: 179.155.65.202
Status: ACTIVE

- Scan target ports.

`nmap 179.155.65.202 -sV`

Result:
PORT	STATE	SERVICE	VERSION	DESTINATION
21	CLOSE	ftp	vsftpd 9.23.1	192.168.1.2
22	CLOSE	ssh	OpenSSH 5.1.61	192.168.1.2
23	CLOSE	telnet	Telnet 8.29.54	192.168.1.2
25	CLOSE	smtp	Postfix 2.39.58	192.168.1.2
3389	CLOSE	rdp	FreeRDP 1.19.0	192.168.1.2
5646	CLOSE	http	Apache 4.7.32	192.168.1.2
9183	FORWARDED	mysql	MariaDB 6.69.65	192.168.1.2
30303	CLOSE	https	Apache 1.41.56	192.168.1.2
30363	CLOSE	imap	Courier 3.32.48	192.168.1.2
50050	CLOSE	http	Apache 4.3.9	192.168.1.2
54394	CLOSE	pop3	Dovecot-pop3d 8.51.15	192.168.1.2

- Attack from vulnerable port.

`msfconsole` -> `search mysql` -> `use 0` (auxiliary/scanner/mysql/mysql_login) -> `set rhost 179.155.65.202`-> `set rport 9183` -> `set version 6.69.65` -> `exploit`

Result:
[*] 179.155.65.202:9183 - Launching attack.
[*] 179.155.65.202:9183 - Banner: 9183 (auxiliary/scanner/mysql/mysql_login) ver: 6.69.65
[*] Attack failed.
[*] Backdoor service could not be accessed.
[*] No guest account or online user found.

5. Talk to the Journalist

Open kisscord -> harveymack chat -> Player responses use Typewriter effect:

Player: I tried really hard but I couldn't hack into their system. It has a more secure system than I thought. I'll do a more comprehensive hack tomorrow.
harveymack: BCC is solid. Anyway, try to handle it.

-- Screen fades to black with "1 Day Later"

# The Journalist's Sister Part 6

1. Install subfinder tool.

`apt-get install subfinder` 

(Note: Player will have this tool for good and can use it whenever. Player could've installed it the moment they first launched the game if the player had known about it, but this is the first mention in-game of it.)

2. Find all subdomains of bcc.com

`subfinder -d bcc.com`

Result (layout looks like it's game generated like with metasploit and other tools):
[INF] Enumerating subdomains for bcc.com
bcc.com
subdued-ethyl.bcc.com
unlined-outlaw.bcc.com
trim-napkin.bcc.com
uniform-fisherman.bcc.com
sudden-accelerator.bcc.com
normal-precedent.bcc.com
perky-minor.bcc.com
courageous-ectoderm.bcc.com
pleased-petticoat.bcc.com
agitated-tail.bcc.com
stupendous-video.bcc.com
alert-plain.bcc.com
discrete-adviser.bcc.com
posh-tomatillo.bcc.com
purple-descent.bcc.com
edible-citizen.bcc.com
pitiful-printer.bcc.com
grubby-pension.bcc.com
long-cemetery.bcc.com
self-reliant-appliance.bcc.com
shameless-pinstripe.bcc.com
finished-scarification.bcc.com
stiff-sideboard.bcc.com
hot-yarmulke.bcc.com
everlasting-sarong.bcc.com
timely-mantua.bcc.com
bustling-waist.bcc.com
accurate-pop.bcc.com
glum-omelet.bcc.com
spanish-sailor.bcc.com
pushy-heroine.bcc.com
good-natured-hydrolyse.bcc.com
wasteful-slime.bcc.com
slimy-wedding.bcc.com
ashamed-linseed.bcc.com
unripe-ceramics.bcc.com
uneven-providence.bcc.com
jumbo-casket.bcc.com
nervous-outset.bcc.com
clear-cut-intent.bcc.com
actual-horst.bcc.com
rusty-pulse.bcc.com
wiggly-transparency.bcc.com
international-assist.bcc.com
somber-wilderness.bcc.com
corrupt-formula.bcc.com
utter-roundabout.bcc.com
nice-mortise.bcc.com
amused-swanling.bcc.com
wrong-resource.bcc.com
international-resolve.bcc.com
aged-promise.bcc.com
realistic-role.bcc.com
well-documented-spirit.bcc.com
frank-presume.bcc.com
flashy-thunderbolt.bcc.com
mean-diagram.bcc.com
faint-nucleotidase.bcc.com
clear-distinction.bcc.com
exhausted-futon.bcc.com
personal-cauliflower.bcc.com
stupendous-ectoderm.bcc.com
massive-gallery.bcc.com
spiffy-individual.bcc.com
extra-large-language.bcc.com
glossy-toaster.bcc.com
tense-hornet.bcc.com
known-pacemaker.bcc.com
tasty-coin.bcc.com
elliptical-utilization.bcc.com
dull-expense.bcc.com
well-lit-cheese.bcc.com
alive-ad.bcc.com
[INF] Found 74 subdomains for bcc.com in 38118 milliseconds
[INF] Saved to /home/Zeis/bcc.com.txt

(Note: These subdomains look auto-generated to me)

3. Install nuclei tool.

`apt-get install nuclei`

(Note: Same as with subfinder, player has it for good now, but could've installed it all along had they known about it)

4. Search for vulnerabilities on found domains

`nuclei -h /home/Zeis/bcc.com.txt`

Result (again, layout is likely game driven):
[ NOT VULNERABLE ] - bcc.com
[ NOT VULNERABLE ] - subdued-ethyl.bcc.com
[ NOT VULNERABLE ] - unlined-outlaw.bcc.com
[ NOT VULNERABLE ] - trim-napkin.bcc.com
[ NOT VULNERABLE ] - uniform-fisherman.bcc.com
[ NOT VULNERABLE ] - sudden-accelerator.bcc.com
[ NOT VULNERABLE ] - normal-precedent.bcc.com
[ NOT VULNERABLE ] - perky-minor.bcc.com
[ NOT VULNERABLE ] - courageous-ectoderm.bcc.com
[ NOT VULNERABLE ] - pleased-petticoat.bcc.com
[ NOT VULNERABLE ] - agitated-tail.bcc.com
[ NOT VULNERABLE ] - stupendous-video.bcc.com
[ NOT VULNERABLE ] - alert-plain.bcc.com
[ NOT VULNERABLE ] - discrete-adviser.bcc.com
[ NOT VULNERABLE ] - posh-tomatillo.bcc.com
[ NOT VULNERABLE ] - purple-descent.bcc.com
[ NOT VULNERABLE ] - edible-citizen.bcc.com
[ NOT VULNERABLE ] - pitiful-printer.bcc.com
[ NOT VULNERABLE ] - grubby-pension.bcc.com
[ NOT VULNERABLE ] - long-cemetery.bcc.com
[ NOT VULNERABLE ] - self-reliant-appliance.bcc.com
[ NOT VULNERABLE ] - shameless-pinstripe.bcc.com
[ NOT VULNERABLE ] - finished-scarification.bcc.com
[ NOT VULNERABLE ] - stiff-sideboard.bcc.com
[ NOT VULNERABLE ] - hot-yarmulke.bcc.com
[ NOT VULNERABLE ] - everlasting-sarong.bcc.com
[ NOT VULNERABLE ] - timely-mantua.bcc.com
[ NOT VULNERABLE ] - bustling-waist.bcc.com
[ NOT VULNERABLE ] - accurate-pop.bcc.com
[ NOT VULNERABLE ] - glum-omelet.bcc.com
[ NOT VULNERABLE ] - spanish-sailor.bcc.com
[ NOT VULNERABLE ] - pushy-heroine.bcc.com
[ NOT VULNERABLE ] - good-natured-hydrolyse.bcc.com
[ NOT VULNERABLE ] - wasteful-slime.bcc.com
[ NOT VULNERABLE ] - slimy-wedding.bcc.com
[ NOT VULNERABLE ] - ashamed-linseed.bcc.com
[ NOT VULNERABLE ] - unripe-ceramics.bcc.com
[ NOT VULNERABLE ] - uneven-providence.bcc.com
[ NOT VULNERABLE ] - jumbo-casket.bcc.com
[ NOT VULNERABLE ] - nervous-outset.bcc.com
[ NOT VULNERABLE ] - clear-cut-intent.bcc.com
[ NOT VULNERABLE ] - actual-horst.bcc.com
[ NOT VULNERABLE ] - rusty-pulse.bcc.com
[ NOT VULNERABLE ] - wiggly-transparency.bcc.com
[ NOT VULNERABLE ] - international-assist.bcc.com
[ NOT VULNERABLE ] - somber-wilderness.bcc.com
[ NOT VULNERABLE ] - corrupt-formula.bcc.com
[ NOT VULNERABLE ] - utter-roundabout.bcc.com
[ VULNERABLE ] - nice-mortise.bcc.com [ SQL_INJECTION ]
[ NOT VULNERABLE ] - amused-swanling.bcc.com
[ NOT VULNERABLE ] - wrong-resource.bcc.com
[ NOT VULNERABLE ] - international-resolve.bcc.com
[ NOT VULNERABLE ] - aged-promise.bcc.com
[ NOT VULNERABLE ] - realistic-role.bcc.com
[ NOT VULNERABLE ] - well-documented-spirit.bcc.com
[ NOT VULNERABLE ] - frank-presume.bcc.com
[ NOT VULNERABLE ] - flashy-thunderbolt.bcc.com
[ NOT VULNERABLE ] - mean-diagram.bcc.com
[ NOT VULNERABLE ] - faint-nucleotidase.bcc.com
[ NOT VULNERABLE ] - clear-distinction.bcc.com
[ NOT VULNERABLE ] - exhausted-futon.bcc.com
[ NOT VULNERABLE ] - personal-cauliflower.bcc.com
[ NOT VULNERABLE ] - stupendous-ectoderm.bcc.com
[ NOT VULNERABLE ] - massive-gallery.bcc.com
[ NOT VULNERABLE ] - spiffy-individual.bcc.com
[ NOT VULNERABLE ] - extra-large-language.bcc.com
[ NOT VULNERABLE ] - glossy-toaster.bcc.com
[ NOT VULNERABLE ] - tense-hornet.bcc.com
[ NOT VULNERABLE ] - known-pacemaker.bcc.com
[ NOT VULNERABLE ] - tasty-coin.bcc.com
[ NOT VULNERABLE ] - elliptical-utilization.bcc.com
[ NOT VULNERABLE ] - dull-expense.bcc.com
[ NOT VULNERABLE ] - well-lit-cheese.bcc.com
[ NOT VULNERABLE ] - alive-ad.bcc.com

[INF] Scan completed in 56890ms

5. Install pip tool.

`apt-get pip`

(I don't think I need to mention that players keep these tools. Same goes for the next item.)

6. Install sqlmap tool.

`pip install sqlmap`

7. List all tables in the database with sql injection.

`sqlmap -u nice-mortise.bcc.com -tables`

Result:
*] Found 1 tables:
+------------+
| Table Name |
+------------+
| users      |
+------------+

- Dump all data from the table.

Result:
Dumping table: users...
[*] Found 20 rows:
+----+------------------------------+----------------------------------+
| id | email                        | password                         |
+----+------------------------------+----------------------------------+
| 1  | adamu+prieto@bcc.com         | f46e020a2c9a1129a731f63d788b8fd1 |
| 2  | gunnar_jimenez332@bcc.com    | 8971e7fdab70b8d30daa8270af1d5067 |
| 3  | francis-cheruiyot480@bcc.com | ef8c6222d1903c08089321caf01fcece |
| 4  | robert+schmid@bcc.com        | 5deae9a80b0ddbcdd826687415c7c9b1 |
| 5  | yu.howells@bcc.com           | de9230f4ee22f5b44aa5ba0f2e16cf9e |
| 6  | chanah+meng816@bcc.com       | b04bf925521d4ad2742f64c014ea379d |
| 7  | krishna+omondi@bcc.com       | 4c33ad28d419c1dc3921e81db3f11f80 |
| 8  | anita-yin517@bcc.com         | ee7236d46c2ae57b8b77017f45220c09 |
| 9  | emikokjartansson744@bcc.com  | e8663106dfa0427a551f2abd82f676d2 |
| 10 | somsakbarasa323@bcc.com      | 6a8a5c089835be29d82022cf867841d6 |
| 11 | yelena.moreno428@bcc.com     | 9a2949669a358b061829eab2c3c7706a |
| 12 | moses.endo596@bcc.com        | 1eef2ed29ebc81347aa56dce2995da6d |
| 13 | adiy-ndlovu@bcc.com          | 37a88604009e8fae0885cef6677b2731 |
| 14 | tamararai530@bcc.com         | b43e5323854747d7b9bb51fea3162e40 |
| 15 | franciscomabaso460@bcc.com   | 77f029b7660cc246d8764167ea189533 |
| 16 | francisca+petrov@bcc.com     | 498b6ace97ee2ad94634274abf00f69a |
| 17 | sawatlange@bcc.com           | 059a7b6a9c95c99e2702b747cf1a55e8 |
| 18 | moshe+hernandez233@bcc.com   | 67c9eb48bd63537c8772583411ad2e7f |
| 19 | yurutkowski538@bcc.com       | 35f3f820208464e51a4d1453c4683e97 |
| 20 | masami_davies@bcc.com        | 21ab15a75556c4fa0e072a9cc3ebefa5 |
+----+------------------------------+----------------------------------+

`sqlmap -u nice-mortise.bcc.com -dump -table users`

8. Install john tool

`apt-get install john`

- Find the editor account and decrypt the password

`john 1eef2ed29ebc81347aa56dce2995da6d`

Result:
Cracked: mybaby

9. Send editor account to Journalist

Kisscord -> harveymack -> Typewriter effect

Player: I found the account. Email: moses.endo596@bcc.com Password: mybaby
harveymack: Ok rest is on me. I'll send you the news when it's published.
Player: Ok, im waiting.

-- Screen fades to black with "1 hour later..."

# The Journalist's Sister Part 7

1. Talk with the journalist.

Kisscord -> harveymack -> Typewriter effect

harveymack: I uploaded the news. Its published now.
Player: Ok. I'll check it.

2. Check the news on BCC.

Player goes to bcc.com -> Previous breaking news has moved one spot down, new leading news article reads "The Government's Bloody Secrets Exposed! Leaked Documents Shock the Nation!"

Clicking on the article advances to next objective: 

3. Contact Jihad member again

`weechat 196.179.140.180 fortuna`
Opens a weechat session. All player responses use the Typewriter effect.

Server: [10:09:2026 10:49:45] Zeis connected to the server.
Player: Hey, im back. I published the news you wanted.
abduLkhaLid: Great. We saw it already.
abduLkhaLid: Your next task is to send $1 million into the bank account we will provide.
abduLkhaLid: IBAN: JL6512345678901234567890554, send money to this account.
Player: Wtf? I don't have that much money.
abduLkhaLid: We don't care. You have 24 hours to send the money. If you don't, we will kill the girl.
abduLkhaLid: We will contact you again after 24 hours.

4. Talk with the journalist again

Kisscord -> harveymack -> Typewriter effect

Player: I contacted them again. They want 1 million dollars.
harveymack: What? I don't have 1m dollars.
Player: I don't have too. What are we going to do?
harveymack: Damn! We need to find a way to get the money.
Player: Are u talking about stealing money from someone?
harveymack: Yes. We need to find a way to get the money. For my sister.
Player: Ah, fuck it. I'll do it.
harveymack: Thank you so much. You'll be hero after saving my sister.

# The Journalist's Sister Part 8

1. Find something you can steal money from.

Player goes to bcc.com again -> Previous breaking news has moved one spot down, new leading news article reads "2025 Top Taxpaying Companies Revealed" -> Article reads:

"The 2025 list of top corporate taxpayers has been released by BCC. Leading the rankings are companies from various industries including finance, logistics, food, and energy. This year’s top 5 taxpaying companies are:

1.Argent Holdings
2.Meridian Textiles
3.Verdant Foods
4.Luma Logistics
5.Verdane X

Analysts note that while some companies are well-known globally, others are up-and-coming firms with a growing influence in their respective sectors. Full financial statements and corporate profiles will be updated in the next quarter."

Player uses lynx to scan all available names (finding nothing) until they find:

`lynx Verdane X`

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
Info(s): Domain: verdane-x.com

Neither Goagle nor going to the address works (no results/404).

`whois verdane-x.com`

Result:
Server: 94.239.7.87
Contact Name: Joan Jiang
Contact Mail: joan.jiang@bol.info
Status: ACTIVE

(Note: The name and email address here is auto-generated, not hardcoded)

`lynx Joan Jing`

Result:
Scanning social media platforms...
No data found.
Searching for contact information...
Email(s): joan.jiang@bol.info
Checking for IP address activity...
IP Addresses: 94.239.7.87
Locating physical address...
No data found.
Searching web for additional information...
No data found.

`nmap 94.239.7.87 -sV`

Result:
PORT	STATE	SERVICE	VERSION	DESTINATION
1897	CLOSE	mysql	MariaDB 4.82.25	192.168.1.2
3008	FORWARDED	pop3	Dovecot-pop3d 8.52.41	192.168.1.2
12366	FORWARDED	https	Apache 7.83.83	192.168.1.2
36916	CLOSE	ssh	OpenSSH 9.84.6	192.168.1.2

`msfconsole` -> `search apache`-> `use 0` (exploit/multi/http/apache_normalize_path_rce) -> `set rhost 94.239.7.87` -> `set rport 12366` -> `set version 7.83.83` -> `exploit`

Meterpreter session establishes (user: weylin) -> `explorer` to open GUI file explorer -> navigate to Root/Home/Weylin/Desktop/Reports ->

There are 3 files: "financial_q1_2025.txt", "q1_project_notes.txt", "readme.txt" -> Opening "financial_q1_2025" advances the Objective

financial_q1_2025 reads:

"Company Financial Report Q1 2025

Transactions:
- Invoice 2025-001: Paid 2,000,000 USD to AlphaTech
- Invoice 2025-002: Paid 5,000,000 USD to Nova Energy
- Invoice 2025-003: Paid 750,000 USD to Beta Supplies"

"q1_project_notes.txt" reads:

"Q1 2025 Project Notes

- Project Alpha: Completed phase 1
- Project Beta: Delayed due to supply chain
- Project Renewable: Partner verification pending, initial payments processed to partner ref NVE-PRC-042
- Project Delta: Internal testing ongoing"

Before disconnecting, player can grab the game-generated "passwd" file from Root/Etc, clean logs from Root/logs, and grab the "cookies.txt" file from Root/Home/Weylin/Config

2. Find Manager's email address

Player uses lynx to search all companies on the financial_q1_2025 report. The only hit:

`lynx Nova Energy`

Scanning social media platforms...
Accounts: Twotter account was found with the registered username @novaenergy
Searching for contact information...
No data found.
Checking for IP address activity...
No data found.
Locating physical address...
No data found.
Searching web for additional information...
No data found.

- Player goes to that twotter account. There's only one tweet:

"📣 We're proud to introduce two key members of our financial operations team:
💼 Ethan Caldwell – promoted to Finance Manager, leading our strategic fund planning.
💳 Isabelle Grant – appointed Senior Finance Specialist, overseeing high-value transaction workflows.

Welcome to your new roles!
#NovaEnerji #TeamUpdate #Finance"

- Player uses lynx again to search those names. The only hit:

`lynx Ethan Caldwell`

Result:
Scanning social media platforms...
No data found.
Searching for contact information...
Email(s): ethan.caldwell@novaenergy.com
Checking for IP address activity...
No data found.
Locating physical address...
No data found.
Searching web for additional information...
No data found.

3. Install mxlookup tool

`apt-get install mxlookup`

Again, player has this tool for good now if they didn't have it before.

4. Find the mail Server

`mxlookup ethan.caldwell@novaenergy.com`

Result:
Mail Server: novaenergy.com
Host: 199.111.214.249

5. Hack into mail server

´nmap 199.111.214.249 -sV`

Result:
PORT	STATE	SERVICE	VERSION	DESTINATION
25	OPEN	smtp	Postfix 3.44.79	192.168.1.2

`msfconsole` -> `search smtp` -> `use 0` (auxiliary/scanner/smtp/smtp_enum) -> `set rhost 199.111.214.249` -> `set rport 25` -> `set version 3.44.79` -> `exploit`

- Find an open mail request logs

`explorer` to open GUI file browser -> navigate to Root/Home/Glutton/Server and open open "request-logs.log"

Has a list of 11 log entries all using the exact same format but with auto-generated @novaenergy.com email addresses and IPs. The relevant one for the quest: 

"Connection | Mail send request from ethan.caldwell@novaenergy.com ip: 48.243.250.213 | Sep 7, 10:52"

Before leaving, player can go into Root/logs and delete the traces they left behind.

6. Try to hack into Ethan's computer

`nmap 48.243.250.213 -sV`

Result:
PORT	STATE	SERVICE	VERSION	DESTINATION
23	CLOSE	telnet	Telnet 1.24.76	192.168.1.2
25	OPEN	smtp	Postfix 2.12.6	192.168.1.2
80	OPEN	http	Apache 9.87.64	192.168.1.2
143	CLOSE	imap	Courier 6.54.0	192.168.1.2
443	OPEN	https	Apache 1.55.15	192.168.1.2
3306	CLOSE	mysql	MariaDB 2.29.35	192.168.1.2
8080	CLOSE	http	Apache 8.32.98	192.168.1.2
15564	FORWARDED	pop3	Dovecot-pop3d 3.23.40	192.168.1.2
26080	CLOSE	ftp	vsftpd 5.33.97	192.168.1.2
28921	FORWARDED	rdp	FreeRDP 2.35.66	192.168.1.2
31715	FORWARDED	ssh	OpenSSH 2.8.54	192.168.1.2

`msfconsole` -> `search smtp` -> `use 0` (auxiliary/scanner/smtp/smtp_enum) -> `set rhost 48.243.250.213` -> `set rport 25` -> `set version 2.12.6` -> `exploit`

Result:
[*] 48.243.250.213:25 - Launching attack.
[*] 48.243.250.213:25 - Banner: 25 (auxiliary/scanner/smtp/smtp_enum) ver: 2.12.6
[*] Attack failed.
[*] Backdoor service could not be accessed.
[*] No guest account or online user found.

The problem is that the PC isn't online.

7. Make Ethan go online by sending a phishing email.

Open Email -> Compose:

To: ethan.caldwell@novaenergy.com

Click on the dropdown next to the subject field, select `Online User` and fill in the red underlined "Full name" with "Ethan Caldwell" (eact spelling is critical, misspelling results in Suspicion increase)

-> Send and wait for reply

Reply arrives from Ethan:

"Hi,

I’m getting online now. Please give me a moment."

A couple seconds later, another email arrives:

"I’m online now. Let me know what you need."

8. Hack into Ethan's computer.

`msfconsole` -> `search smtp` -> `use 0` (auxiliary/scanner/smtp/smtp_enum) -> `set rhost 48.243.250.213` -> `set rport 25` -> `set version 2.12.6` -> `exploit`

Or simply "exploit" if the previous metasploit session was still up and everything was unchanged.

- Find and decrypt the email cookie

Navigate to `Root/Home/ethan/Config` and open or download the cookies.txt file (I believe this is game generated with every email account that's linked to a computer/system).

Cookies.txt contains:

"mail.goagle.com;eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImV0aGFuLmNhbGR3ZWxsQG5vdmFlbmVyZ3kuY29tIiwicGFzc3dvcmQiOiJza2lwcGVyMSJ9.ImV5SmhiR2NpT2lKSVV6STFOaUlzSW5SNWNDSTZJa3BYVkNKOS5leUpsYldGcGJDSTZJbVYwYUdGdUxtTmhiR1IzWld4c1FHNXZkbUZsYm1WeVoza3VZMjl0SWl3aWNHRnpjM2R2Y21RaU9pSnphMmx3Y0dWeU1TSjkuNzhlYzZmYzk5NTJjZGQ4NDEzYmI4NTg5ZjI0ZTdlMmQ1MmYzZThmZDRhZjdmMmZjYzg4OTI3NzIzMmNmMGNkZSI"

`python3 jwt_decoder.py python3 jwt_decoder.py eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImV0aGFuLmNhbGR3ZWxsQG5vdmFlbmVyZ3kuY29tIiwicGFzc3dvcmQiOiJza2lwcGVyMSJ9.ImV5SmhiR2NpT2lKSVV6STFOaUlzSW5SNWNDSTZJa3BYVkNKOS5leUpsYldGcGJDSTZJbVYwYUdGdUxtTmhiR1IzWld4c1FHNXZkbUZsYm1WeVoza3VZMjl0SWl3aWNHRnpjM2R2Y21RaU9pSnphMmx3Y0dWeU1TSjkuNzhlYzZmYzk5NTJjZGQ4NDEzYmI4NTg5ZjI0ZTdlMmQ1MmYzZThmZDRhZjdmMmZjYzg4OTI3NzIzMmNmMGNkZSI`

Result:
Decoding...
Done, result:

{
    "header": {
        "alg": "HS256",
        "typ": "JWT"
    },
    "payload": {
        "email": "ethan.caldwell@novaenergy.com",
        "password": "skipper1"
    },
    "signature": "ImV5SmhiR2NpT2lKSVV6STFOaUlzSW5SNWNDSTZJa3BYVkNKOS5leUpsYldGcGJDSTZJbVYwYUdGdUxtTmhiR1IzWld4c1FHNXZkbUZsYm1WeVoza3VZMjl0SWl3aWNHRnpjM2R2Y21RaU9pSnphMmx3Y0dWeU1TSjkuNzhlYzZmYzk5NTJjZGQ4NDEzYmI4NTg5ZjI0ZTdlMmQ1MmYzZThmZDRhZjdmMmZjYzg4OTI3NzIzMmNmMGNkZSI"
}

Before leaving the meterpreter session, player can erase logs again (Root/logs) to not increase Suspicion level.

# The Journalist's Sister Part 9

1. Login to Ethan's e-mail account.

Go to Goagle Mail -> log out of Player account -> Log in to Ethan's account (ethan.caldwell@novaenergy.com / skipper1)

Players find the email they sent Ethan earlier and can delete it (purely cosmetic, no suspicion change either way)

- Find Isabelle's e-mail address.

In the "Sent" folder, players find an email to "isabelle.grant@novaenergy.com":

"Subject: Transfer Confirmation - $300,000 USD

Hi Isabelle,

Please initiate a wire transfer of **$300,000 USD** to the account below:

- Bank: Liberty Central Bank
- Account Name: Tyrell Import Group
- IBAN: IM3374UW6G4Y8Y16T11423PCJRG76

Please process the transfer by EOD and notify me once it's done.

Regards,
Ethan Caldwell
Finance Manager
NovaEnergy Corporation"

- Send a fake transfer mail to Isabelle.

Players, still logged into Ethan's account, click on "Compose" and enter "isabelle.grant@novaenergy.com" into the "To" field. This automatically fills in the Subject ("Urgent Wire Transfer - $1,000,000 USD") -> Typewriter effect on email body:

"Hi Isabelle,

Please initiate a wire transfer of $1,000,000 USD to the account below:

- Bank: Liberty Central Bank
- IBAN: JL6512345678901234567890554

Ensure this is processed today without delay, and please confirm with me once it's completed.

Regards,
Ethan Caldwell
Finance Manager
NovaEnergy Corporation"

-> Click Send

2. Talk to the Journalist

Open kisscord -> harveymack chat -> Player responses use Typewriter effect:

Player: I think I've got the money covered.
harveymack: Wait, what?
harveymack: How did you do that?
Player: I recently saw a post on twotter where a company that does a lot of business announced its new staff.
Player: Luckily, the people they shared it with were new finance people, so I stole their email accounts and sent them fake transfer emails. I hope this works.
harveymack: Please god let it work...

-- Screen fades to black with "2 Hours Later"

3. Talk to the Jihad members.

`weechat 196.179.140.180 fortuna`
Opens a weechat session. All player responses use the Typewriter effect.

abduLkhaLid: We got the money. Nice work.
abduLkhaLid: Now you need to do your last task.
Player: What's the last task?
abduLkhaLid: This won't be easy like the others.
abduLkhaLid: Hack into Interpol and delete everything they have about the Jihad group.
Player: Are you crazy? That's impossible.
abduLkhaLid: You have to do it. Otherwise, the girl will be killed.
Player: Ok ok, I'll do it.
abduLkhaLid: We'll be here when the job is done, telling you how to get the girl back.
Server: [11:45:08] abduLkhaLid disconnected from the server.

4. Talk to the journalist Again

Kisscord -> harveymack chat -> Player responses use Typewriter effect:

Player: I got the last task. I'll hack into Interpol and delete everything they have about the Jihad group.
harveymack: Shit, it looks like impossible.
harveymack: But I believe you can do it.
Player: I'll do my best.
harveymack: Thanks.

# The Journalist's Sister Part 10

1. Find someone working on Interpol.

Lynx, BCC.com and Goagle give nothing when searching for "Interpol", but searching on Twotter reveals this account:

"The Blue Table Bistro
@thebluetable

☕ Gourmet coffee & confidential cuisine. Serving the world's finest institutions with speed and absolute discretion for over 20 years. 🔒 Trust our service."

This tweet is what revealed the account:

"We're celebrating a milestone! 🥳 For 20+ years we have proudly served and maintained the absolute trust of global institutions like INTERPOL. Security is just as important as the service.

#TrustedSupplier #DiscretionAssured #GlobalPartnership"

`lynx The Blue Table Bistro`

Result:
Scanning social media platforms...
Accounts: Twotter account was found with the registered username @thebluetable
Searching for contact information...
No data found.
Checking for IP address activity...
No data found.
Locating physical address...
No data found.
Searching web for additional information...
Info(s): High-profile supplier providing confidential catering services to international institutions, including INTERPOL, for over 20 years. Claims customer discretion is a top priority.
-------------------------
Website: thebluetable.com

WHOIS reveals nothing, but `nslookup thebluetable.com`does.

Result:
Server: thebluetable.com
Address: 227.18.184.252

nmap reveals no open ports.

`python3 net_tree.py 227.18.184.252`

The Net_Tree GUI opens and shows a medium-sized network. One router at the top, all other "Host"'s connected to it:

(Note: I believe all IPs are auto-generated here)

Router: 227.18.184.252 | LAN: 192.168.1.1

Host: 155.116.95.98 | 192.168.1.2
Host: 112.215.229.67 | LAN: 192.168.1.3
Host: 225.2.208.142 | LAN: 192.168.1.4
Host: 187.159.90.96 | LAN: 192.168.1.5
Host: 231.89.39.65 | LAN: 192.168.1.6
Host: 229.181.171.0 | LAN: 192.168.1.7
Host: 168.115.129.183 | LAN: 192.168.1.8
Host: 235.221.163.170 | LAN: 192.168.1.9
Host: 107.199.170.63 | LAN: 192.168.1.10
Host: 108.4.200.203 | LAN: 192.168.1.11

Player scans one network after the next until they hit 229.181.171.0 (LAN: 192.168.1.7):

`nmap 229.181.171.0 -sV`

Result:
PORT	STATE	SERVICE	VERSION	DESTINATION
25	CLOSE	smtp	Postfix 1.47.13	192.168.1.7
80	CLOSE	http	Apache 2.59.2	192.168.1.7
443	CLOSE	https	Apache 6.90.73	192.168.1.7
3306	OPEN	mysql	MariaDB	192.168.1.7
10859	CLOSE	pop3	Dovecot-pop3d 5.47.26	192.168.1.7
12437	CLOSE	ssh	OpenSSH 2.30.45	192.168.1.7
30347	CLOSE	ftp	vsftpd 5.88.9	192.168.1.7
32230	CLOSE	imap	Courier 1.27.98	192.168.1.7
63055	CLOSE	telnet	Telnet 8.84.80	192.168.1.7

MySQL is open but it doesn't have a version number, so metasploit won't work. SQL Injection is the way in.

`subfinder -d thebluetable.com`

The subdomains are auto-generated - except for the key one (crm.thebluetable.com)

Result:
acceptable-airmail.thebluetable.com
golden-individual.thebluetable.com
astonishing-shadowbox.thebluetable.com
bruised-grandson.thebluetable.com
unconscious-pantyhose.thebluetable.com
crm.thebluetable.com
rural-populist.thebluetable.com
prime-postbox.thebluetable.com
dearest-cop-out.thebluetable.com
crafty-dependency.thebluetable.com
thebluetable.com

[INF] Found 11 subdomains for thebluetable.com in 5947 milliseconds
[INF] Saved to /home/Zeis/thebluetable.com.txt

`nuclei -h /home/Zeis/thebluetable.com.txt`

Result:
[ NOT VULNERABLE ] - acceptable-airmail.thebluetable.com
[ NOT VULNERABLE ] - golden-individual.thebluetable.com
[ NOT VULNERABLE ] - astonishing-shadowbox.thebluetable.com
[ NOT VULNERABLE ] - bruised-grandson.thebluetable.com
[ NOT VULNERABLE ] - unconscious-pantyhose.thebluetable.com
[ VULNERABLE ] - crm.thebluetable.com [ SQL_INJECTION ]
[ NOT VULNERABLE ] - rural-populist.thebluetable.com
[ NOT VULNERABLE ] - prime-postbox.thebluetable.com
[ NOT VULNERABLE ] - dearest-cop-out.thebluetable.com
[ NOT VULNERABLE ] - crafty-dependency.thebluetable.com
[ NOT VULNERABLE ] - thebluetable.com

`sqlmap -u crm.thebluetable.com -tables`

Result:
Listing tables...
[*] Found 1 tables:
+------------+
| Table Name |
+------------+
| customers  |
+------------+

`sqlmap -u crm.thebluetable.com -dump -table customers`

All of these except the key one is auto-generated.

Result:
Dumping table: customers...
[*] Found 48 rows:
+--------------------+-----------------------------+--------------------+
| name               | email                       | job                |
+--------------------+-----------------------------+--------------------+
| Alexander Cai      | mpho.marin98@bcc.com        | Orchestrator       |
| Susanne Gunnarsson | chan+nowakowski977@bcc.com  | Planner            |
| Barbara Cai        | sibongile-valdez537@bcc.com | Architect          |
| Ana-Maria Saeli    | chanmichalski@bcc.com       | Administrator      |
| Jennifer Gu        | kabiru_maluleke@bcc.com     | Agent              |
| Somkhit Wekesa     | adam-allen@bcc.com          | Supervisor         |
| George Du-Plessis  | sergiomorgan@bcc.com        | Representative     |
| Andri Ono          | alexey+saidu@bcc.com        | Analyst            |
| Prani Muhammad     | kevinwambua@bcc.com         | Orchestrator       |
| Bongani Ortiz      | yhudiyt_smirnov@bcc.com     | Associate          |
| Maria-Pilar Mhamid | jasonadebayo362@bcc.com     | Representative     |
| Katsumi Alonso     | latdayakovleva262@bcc.com   | Assistant          |
| Dariusz Jones      | uriy.audu@bcc.com           | Analyst            |
| Alina Kristinsson  | yoshiko_jin@bcc.com         | Designer           |
| Eunice Ortiz       | otieno.mwangi27@bcc.com     | Facilitator        |
| Rong Adamczyk      | jose-manuel.lal702@bcc.com  | Administrator      |
| Abdullahi Gu       | suwit_sunday@bcc.com        | Associate          |
| Ryoko Maina        | masao.harrison@bcc.com      | Supervisor         |
| Xin Gonzalez       | yong.mahlangu710@bcc.com    | Specialist         |
| Susanne Mokoena    | justyna+lehmann628@bcc.com  | Assistant          |
| Yong Pfeiffer      | shigerupeng243@bcc.com      | Assistant          |
| Ian Muhammad       | qiang.haruna@bcc.com        | Representative     |
| Suman Mthembu      | fiona-ansari@bcc.com        | Assistant          |
| Reiko Muhammadu    | steinunn+peretz463@bcc.com  | Designer           |
| Fernando Sawicki   | franegorova@bcc.com         | Director           |
| Suresh Baba        | teruko+hasna@bcc.com        | Planner            |
| Lin Zulu           | chan+cohen55@bcc.com        | Executive          |
| Pricha Wambua      | tatyana.kucharski@bcc.com   | Facilitator        |
| Roy Mbatha         | pavel.ray@bcc.com           | Associate          |
| Marek Yao          | kjartan.venter883@bcc.com   | Agent              |
| Andrea Siebert     | andrea.siebert@interpol.int | Interpol Assistant |
| Miykhal Khan       | wanjiru-vega@bcc.com        | Designer           |
| Sunil Ogawa        | janusz+joseph@bcc.com       | Coordinator        |
| Anna Gupta         | samran_deng563@bcc.com      | Specialist         |
| Heike Kamau        | sombun.king613@bcc.com      | Officer            |
| Willem Nowakowski  | pieter+mutuku@bcc.com       | Producer           |
| Latda Goto         | kjartan-wairimu@bcc.com     | Director           |
| Reiko Gao          | urmila.watson@bcc.com       | Analyst            |
| Pushpa De-Jong     | xiaoli+mutua208@bcc.com     | Coordinator        |
| Mercy Bevan        | atlivargas91@bcc.com        | Director           |
| Dmitriy Mabaso     | miykhal.bowen@bcc.com       | Consultant         |
| Suman Schulz       | chanallen107@bcc.com        | Supervisor         |
| Kabiru Xu          | janet.yamamoto740@bcc.com   | Executive          |
| Lin Odhiambo       | lilian-ruiz@bcc.com         | Specialist         |
| Mitsuo Nakamura    | emiko-begam554@bcc.com      | Architect          |
| Anita Walczak      | ajay_ramirez55@bcc.com      | Producer           |
| Wanphen Ntuli      | hong-levy816@bcc.com        | Representative     |
| Ram Deng           | kiyoshi_avraham@bcc.com     | Director           |
+--------------------+-----------------------------+--------------------+

`lynx Andrea Siebert`

Scanning social media platforms...
Accounts
:
Twotter account was found with the registered username @andrea_siebert
Searching for contact information...
Email(s): andrea.siebert@interpol.int
Checking for IP address activity...
No data found.
Locating physical address...
No data found.
Searching web for additional information...
Info(s):
Works as an executive secretary at Interpol.
-------------------------
Known for her love of cats.
-------------------------
Often works early mornings.

- Leads the player to Andrea Siebert's twotter account.

One of her tweets from 2 hours ago shows that's she about to board a plane - it has a real picture of a female hand holding an airplane ticket from "FlySAS - Scandinavian Airlines" in it (the airplane company is obviously not real and made up for this game, and the real picture was photoshopped to insert the logo)

Clicking on her twotter account also gives the next objective:

2. Use a Office Word Macro exploit.

`msfconsole` -> `search office` -> `use 0`(exploit/multi/fileformat/office_word_macro) 

This gives the next objective: "Set payload to Office Word Macro."

`show options`

Result:
Name             Current Settings   Required   Description                                                  
--------------   ----------------   --------   -------------------------------------------------------------
CUSTOMTEMPLATE                      no         A docx file that will be used as a template to build the     
                                               exploit                                                      
FILENAME         msf.docm           yes        The Office document macro file (docm)                        
PAYLOAD                             yes        The payload to use           

`set payload bearos/meterpreter/reverse_tcp`

Player keeps unfinished metasploit session open in the background to return to in a bit.

- Open router admin panel (https://192.168.1.1)

In the in-game browser, player navigates to that address.

- Find admin password of router

Web interface shows "TP-Link | ModeL: ENO3"

In a new Terminal window, so as not to close the running metasploit session:

`python3 fern.py`
Router Model > ENO3

Result:
Searching in router db...
Credentials found!
Username: admin
Password: braves1

User logs into router in browser.

- Look up ip for reverse shell

`ifconfig`

Result:
BearOS IP Configuration

Unknown adapter - Subnet:
Connection-specific DNS Suffix:
IPv4 Address:
192.168.1.2
Public IPv4 Address:
164.244.144.52
Default Gateway:

- Define port to use for reverse shell. (Example: 4444)

In the logged-in router interface in the browser, player navigates to "Port Forwarding" -> "Add Rule" -> Status: On | External: 4444 | Internal: 4444 | Local IP: 192.168.1.2 -> Save

- Set ip for reverse shell

Back in the still-running metasploit session

`set LHOST 192.168.1.2`

- Cook malware to be sent to Andrea's computer

`run`

Result:
[*] Injecting payload in document comments
[*] Injecting macro and other required files in document
[*] Finalizing docm: msf.docm
[*] msf.docm stored at /home/Zeis/msf.docm

- Start reverse shell listener

`handler`

Result:
[*] Started reverse TCP handler on 192.168.1.2:4444, awaiting connections...

- Set malware name to "flysas" and send email to Andrea.

Player navigates to home/PLAYER/msf.docm and renames the file to "flysas" -> Opens Email and composes an email to "andrea.siebert@interpol.int" which auto-fills the subject. Typewriter effect on body:

"Subject: Andrea Siebert - FlySAS

Dear Andrea Siebert,

We are writing to inform you of an important and urgent technical issue regarding your upcoming FlySAS flight SK9TS.

Our systems have detected a critical synchronization error related to the current travel documents and post-COVID compliance forms for international passengers. This error is severely jeopardizing the generation of your boarding pass and the confirmation of your flight status.

To prevent the cancellation of your flight and ensure your reservation security:

Please urgently download and open the attached file named "flysas.docm".

Fill out the form within the document completely and return it to us by replying to this email within the next 2 hours.

Failure to comply with the instructions in the document may lead to your reservation being automatically dropped from the system and your flight being cancelled.

Thank you for your understanding and prompt cooperation.

Sincerely,
FlySAS Customer Support Team"

File Attachment: flysas.docm

-> send

- Wait for reverse shell to be connected

metasploit is still actively running:

[*] [*] Still listening (46s elapsed)...
[*] [*] Still listening (92s elapsed)...
[*] [*] Still listening (138s elapsed)...
[*] [*] Still listening (184s elapsed)...
[*] Meterpreter session 1 opened (192.168.1.2:4444 -> 133.26.193.118) at 2026-09-10 12:28:23

[*] [*] Use 'show sessions' to list active sessions and 'session <id>' to interact.

# The Journalist's Sister Part 11

1. List your active reverse shell sessions. In Part 10, you established a connection to Andrea's computer - check if it's still available.

`show sessions`

Result:
#   IP               Handler Port   Timestamp          
-   --------------   ------------   -------------------
0   133.26.193.118   4444           2026-09-10 12:28:23

- Switch session to Andrea's computer.

`session 0`

This opens a meterpreter session. `explorer` to open the GUI file browser.

Navigate to Root/Home/Andrea/Documents -> it shows the following files:

Interoffice_Meeting_Schedule_April2025.docx
Interoffice_Meeting_Schedule_March2025.docx
meeting_schedule.docx
Q2_Intelligence_Network.docx
Research_Q2_Conflict.docx
Vacation_Request_Form_Andrea.docx
invoices_2025.pdf
transit_manifest_2025.pdf
jihad_correspondence_notes.txt
printer_issues_notes.docx

Player can just open "jihad_correspondence_notes.txt" or download this or all of the files.

That file contains:

""JIHAD_Operations.txt" was accessed by Carl Teller.

He’s likely going to follow up within the next few days."

Player can delete logs so as not to increase Suspicion.

Opening "jihad_correspondence_notes.txt" advances objectives:

2. Find the IP address of the person interested in Jihad on the same network and scan its ports.

If the player still has the metasploit session, great. Otherwise they'll have to do this:

`msfconsole` -> `search office` -> `use 0` -> `show sessions` -> `session 0`

From `show sessions` we learn that Andrea's IP is "133.26.193.118"

In a separate Terminal, we map Andrea's network:

´python3 net_tree.py 133.26.193.118`

This gives us the most complicated network yet, displayed in the Net_Tree GUI.

From Top to bottom:

Router: 26.233.103.183 | LAN: 192.168.1.1
Connects to:
Firewall: 21.220.87.98 | LAN: 192.168.1.2
Host: 133.26.193.118 | LAN: 192.168.1.3 | HOST: Andrea Siebert
Host: 226.241.143.44 | LAN: 192.168.1.4 | HOST: Carl Teller
Host: 5.218.233.217 | LAN: 192.168.1.5 | HOST: Suman Becker
Host: 61.212.74.84 | LAN: 192.168.1.6 | HOST: Claire David
Host: 61.228.37.181 | LAN: 192.168.1.7 | HOST: Igor Sadowksi
Host: 61.4.223.110 | LAN: 192.168.1.8 | HOST: Martha Naidoo
Host: 229.160.31.160 | LAN: 192.168.1.9 | HOST: Winai Ibrahim
Host: 24.181.245.115 | LAN: 192.168.1.10 | HOST: Jane Evans
Host: 151.95.11.53 | LAN: 192.168.1.11 | HOST: Gang Richter
Host: 220.89.109.159 | LAN: 192.168.1.12 | HOST: Elena Eze
Host: 64.60.229.72 | LAN: 192.168.1.13 | HOST: Hisako Sokolov
Splitter: 124.51.149.230 | LAN: 192.168.1.14
Splitter connects to:
Host: 210.96.7.53 | LAN: 192.168.1.15 | HOST: S-394ZX-0
Host: 228.11.234.96 | LAN: 192.168.1.16 | HOST: S-394ZX-1
Host: 233.253.127.93 | LAN: 192.168.1.17 | HOST:S-394ZX-2 
Host: 151.55.187.7 | LAN: 192.168.1.18 | HOST: S-394ZX-3
Host: 171.129.40.73 | LAN: 192.168.1.19 | HOST: S-394ZX-4
Host: 1.68.229.93 | LAN: 192.168.1.20 | HOST: S-394ZX-5
Host: 241.135.126.21 | LAN: 192.168.1.21 | HOST: S-394ZX-6
Host: 116.225.97.77 | LAN: 192.168.1.22 | HOST: S-394ZX-7
Host: 202.134.82.209 | LAN: 192.168.1.23 | HOST: S-394ZX-8
Host: 255.127.172.197 | LAN: 192.168.1.24 | HOST: S-394ZX-9
Host: 67.225.124.205 | LAN: 192.168.1.25 | HOST: S-394ZX-10
Host: 23.21.15.134 | LAN: 192.168.1.26 | HOST: S-394ZX-11
Host: 195.126.84.166 | LAN: 192.168.1.27 | HOST: S-394ZX-12
Host: 20.18.112.162 | LAN: 192.168.1.28 | HOST: S-394ZX-13
Host: 233.145.37.228 | LAN: 192.168.1.29 | HOST: S-394ZX-14
Host: 140.12.132.72 | LAN: 192.168.1.30 | HOST: S-394ZX-15
Host: 143.190.79.106 | LAN: 192.168.1.31 | HOST: S-394ZX-16
Host: 232.8.19.123 | LAN: 192.168.1.32 | HOST: S-394ZX-17
Host: 5.227.44.123 | LAN: 192.168.1.33 | HOST: S-394ZX-18
Host: 131.10.71.170 | LAN: 192.168.1.34 | HOST: S-394ZX-19
Host: 111.40.73.31 | LAN: 192.168.1.35 | HOST: S-394ZX-20
Host: 193.61.128.11 | LAN: 192.168.1.36 | HOST: S-394ZX-21

`nmap 226.241.143.44 -sV`

Result:
PORT	STATE	SERVICE	VERSION	DESTINATION
22	CLOSE	ssh	OpenSSH 2.31.3	192.168.1.4

- Find the firewall on the network and open it in your browser

Player opens `21.220.87.98` in in-game browser. This shows a "pfsense" login window

- Hijack the firewall login credentials and open the admin panel.

Player opens "Wireshark" app and hits the "Play" button to capture packages.

`python3 kimai.py 21.220.87.98`

Result:
Kimai: Target detected as firewall.
Kimai: Configurations are complete, payload is being sent.
Kimai: Important! Monitor the data exchange with a network packet analyzer.
Attack started...
Kimai: Package received! Contents unreadable.

Kimai: Payload completed.

Wireshark shows two entries:
No: 1000 | Time: 0.004000 | Source: 195.46.196.244 | Destination: 21.220.87.98 | Protocol: TCP | Length: 340 | Info: PayloadRequest
No: 1001 | Time: 0.614000 | Source: 21.220.87.98 | Destination: 195.46.196.244 | Protocol: TCP | Length: 389 | Info: cookie

Clicking on the second entry reveals:

Frame: 1001: 389 bytes
Source: 21.220.87.98
Destination: 195.46.196.244
Protocol: TCP
Info: cookie
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwicGFzc3dvcmQiOiJRbGtGTUI0aGRxMloxN08ifQ.ImV5SmhiR2NpT2lKSVV6STFOaUlzSW5SNWNDSTZJa3BYVkNKOS5leUoxYzJWeWJtRnRaU0k2SW1Ga2JXbHVJaXdpY0dGemMzZHZjbVFpT2lKUmJHdEdUVUkwYUdSeE1sb3hOMDhpZlEuNzhlYzZmYzk5NTJjZGQ4NDEzYmI4NTg5ZjI0ZTdlMmQ1MmYzZThmZDRhZjdmMmZjYzg4OTI3NzIzMmNmMGNkZSI"}

`python3 jwt_decoder.py python jwt_decoder.py eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwicGFzc3dvcmQiOiJRbGtGTUI0aGRxMloxN08ifQ.ImV5SmhiR2NpT2lKSVV6STFOaUlzSW5SNWNDSTZJa3BYVkNKOS5leUoxYzJWeWJtRnRaU0k2SW1Ga2JXbHVJaXdpY0dGemMzZHZjbVFpT2lKUmJHdEdUVUkwYUdSeE1sb3hOMDhpZlEuNzhlYzZmYzk5NTJjZGQ4NDEzYmI4NTg5ZjI0ZTdlMmQ1MmYzZThmZDRhZjdmMmZjYzg4OTI3NzIzMmNmMGNkZSI`

Result:
Decoding...
Done, result:
 
{
    "header": {
        "alg": "HS256",
        "typ": "JWT"
    },
    "payload": {
        "username": "admin",
        "password": "QlkFMB4hdq2Z17O"
    },
    "signature": "ImV5SmhiR2NpT2lKSVV6STFOaUlzSW5SNWNDSTZJa3BYVkNKOS5leUoxYzJWeWJtRnRaU0k2SW1Ga2JXbHVJaXdpY0dGemMzZHZjbVFpT2lKUmJHdEdUVUkwYUdSeE1sb3hOMDhpZlEuNzhlYzZmYzk5NTJjZGQ4NDEzYmI4NTg5ZjI0ZTdlMmQ1MmYzZThmZDRhZjdmMmZjYzg4OTI3NzIzMmNmMGNkZSI"
}

Player uses those login infos (admin / QlkFMB4hdq2Z17O) to access firewall admin panel in their browser -> There are wo entries for ports, both set to "Deny" -> Player switches them to "Allow" and Saves

- Open router interface and switch port 22 to open.

Player access the Interpol Router by entering `26.233.103.183` into their browser -> TP-Link interface with Model: ENS8D8

`pyton3 fern.py`
ModeL > ENS8D8
Searching in router db...
Credentials found!
Username: admin
Password: szvfRnB0TQacWuM

Player logs in with those credentials -> Port Forwarding -> Switche status on Port 22 from "Off" to "On"

3. Hack into the computer of someone interested in Jihad.

We found earlier in the text file on Andrea's PC that this is Carl Teller. His IP on the network is 226.241.143.44

`nmap 226.241.143.44 -sV` 

Result:
PORT	STATE	SERVICE	VERSION	DESTINATION
22	OPEN	ssh	OpenSSH 2.31.3	192.168.1.4

`msfconsole` -> `search ssh` -> `use 0` (auxiliary/scanner/ssh/ssh_login) -> `set rhost 226.241.143.44` -> `set rport 22` -> `set version 2.31.3` -> `exploit`

Meterpreter session, GUI `explorer` -> navigate to Root/Home/carl/Desktop -> "jihad_notes.txt"

Contains:

"Only summary-level data is stored locally.

Full documentation is on secure server: #S-394ZX-11

Access requires elevated clearance."

Note: For the first time, the quest objective now shows a "Complete" button here instead of auto-completing

# The Journalist's Sister Part 12

1. Access the correct server.

`nmap 23.21.15.134 -sV`

Result:
PORT	STATE	SERVICE	VERSION	DESTINATION
22	OPEN	ssh	OpenSSH 3.55.43	192.168.1.26

`msfconsole` -> `search ssh` -> `use 0` (auxiliary/scanner/ssh/ssh_login) -> `set rhost 23.21.15.134` -> `set rport 22` -> `set version 3.55.43` -> `exploit`

Meterpreter session, GUI `explorer` -> navigate to Root/Home/admin/Jihad -> There are two files:

intelligence.txt
Content:
"The Jihad organization is a radical terrorist group based in Jilvania. In the past, it has been held responsible for numerous bombings and assassinations across the country. Between 2021 and 2023, attacks carried out in and around the capital city of Valdera resulted in the deaths of hundreds of civilians.

Recent analyses have raised serious suspicions about the involvement of renowned journalist Harvey Mack with the group. Some sources claim that Mack has been directing the organization’s media strategies and orchestrating content aimed at manipulating public opinion.

According to the latest CIA intelligence reports, it is believed that Mack himself orchestrated the kidnapping of his own sister as part of a plan to divert public attention. It is suspected that Mack is using his influence in the media to shape the narrative and protect the inner workings of the organization."

message-logs.txt
Content:
"From: unknown  
To: jihad_cell_alpha  
We move at dawn. Target is located. No mistakes this time.

From: jihad_cell_alpha  
To: unknown  
Confirmed. The girl is secured. No harm done.

From: unknown  
To: jihad_cell_alpha  
Keep her isolated. No contact with outside. Harvey said she must remain unharmed at all costs.

From: jihad_cell_alpha  
To: unknown  
Understood. She’s being moved to the Jilvanian border safehouse. No trace left behind.

From: harvey_mack  
To: unknown  
Make sure the message spreads. The media needs to believe this was politically motivated. Leave no trail leading back to me.

From: unknown  
To: harvey_mack  
Done. The public will never suspect a thing. Your sister will be fine - as long as no one interferes."

Again, player can erase logs to not increase suspicion

2. Talk with the journalist

Open kisscord -> harveymack chat -> Player responses use Typewriter effect:

Player: Harvey, we need to talk.
harveymack: What's going on? Did you find something about Alina
Player: I found the jihad intelligence files. I know everything, Harvey.
harveymack: What exactly do you think you know?
Player: I know you're connected to the Jihad organization. I know you orchestrated your own sister's kidnapping. I saw the message logs, Harvey. Your name was in them.
harveymack: It's not what you think. I had to do it to protect her.
Player: What do you mean you had to do it? She's your sister!
harveymack: I need to tell you the truth. Years ago, I worked with them. High-ranking positions, planning operations, media strategies... I did terrible things. I thought I was fighting for a cause, but I was just a pawn in their game.
Player: You were one of them?
harveymack: I was. But I left. I tried to cut all ties, start over, build a legitimate career. But they never let go. They kept using me, threatening me, manipulating me through my past. And then... they found out about Alina.
Player: What about Alina?
harveymack: She has no idea about any of this. She's completely innocent. But they found out about her, and they threatened to use her against me. They said if I didn't continue helping them, they would hurt her. Or worse, they'd reveal my past to her and destroy everything she thought she knew about her own brother.
Player: So you staged the kidnapping?
harveymack: Yes. I organized it with trusted people who owed me favors from the old days. They took her to a safe location, far from all of this. She thinks she's been kidnapped by terrorists, but she's actually safe. I couldn't let them use her as leverage against me, and I couldn't let her find out who I really was.
Player: But why involve me? Why make me hack and do all these things?
harveymack: Because I needed you to help me disappear the evidence. The files on Interpol servers, my connections, everything that could link me to them. I thought if I could erase it all, I could finally be free. I could get Alina back, tell her it was all a terrible misunderstanding, and we could both start over.
Player: You used me.
harveymack: I know. And I'm sorry. But please understand, I'm trapped. Every day I spend in their web, I'm putting Alina at risk. Every connection they have, every file that exists, gives them power over me. I just wanted out.
Player: What do you want from me now?
harveymack: You have a choice. You can help me delete all the Jihad data from Interpol's servers. Wipe away every trace of my connection to them. Help me disappear from their records so I can finally be free and get my sister back safely. Or... you can expose everything. Turn me in, reveal the truth to the world, and let justice take its course. But if you do that, Alina will find out who her brother really is, and I'll never be able to protect her from the consequences.
Player: I need to think about this.

The Quest objective shows the "Complete" button yet again. The screen fades a little bit and shows a popup:

"THE choice
Your decision here will affect how the plot progresses.
> Help Harvey and eliminate all evidence.
> Expose Harvey and send all the facts to the press."

In this case, I chose the second option.

# Expose Harvey Mack

1. Download the intelligence file from the server.

(Note: This is something I did in the previous step already, so this objective is already automatically completed)

2. Send the intelligence file to the bcc.

Player opens bcc.com and browses the website, looking for a way to contact them. At the bottom in the footer is a link: "Contact the BCC" but it doesn't do anything. Below that, just above the copyright notice for the webpage, is a sentence: "For reports and news tips: public@bccnews.com"

- Player goes to their email and composes an email to "public@bccnews.com" -> Subject gets auto-filled in with "Truth About Harvey Mack" -> Body of the email uses Typewriter effect:

"Hello,

I'm writing to you to share some important information about Harvey Mack.

Harvey Mack holds a high-ranking role in Jihad, a known terrorist organization. The attached file was leaked from Interpol servers."

Attachment: intelligence.txt

-- Screen fades to black with "1 Hour Later..."

3. Check the news on BCC.

There's a new frontpage news item on bcc.com : "Shocking Allegations Against Journalist Harvey Mack: Links to the Jihad Organization and an Orchestrated Kidnapping"

"The Jihad Organization, a radical terrorist group based in Jilvania, has long been held responsible for a series of bombings and assassinations across the country. Between 2021 and 2023, attacks carried out in and around the capital city of Valdera resulted in the deaths of hundreds of civilians.

New intelligence has raised serious suspicions about the involvement of renowned journalist Harvey Mack with the organization. Analysts and intelligence sources claim that Mack has been overseeing the group’s media strategies and coordinating propaganda designed to manipulate public opinion.

According to the latest CIA reports, Mack is believed to have orchestrated the kidnapping of his own sister as part of a larger deception plan. The intention, investigators say, was to make the public believe he had no ties to the organization by portraying himself as a victim rather than a collaborator.

The reports further allege that Mack has been using his influence in the media to control the narrative and shield the inner operations of the Jihad Organization from exposure.

While officials have not confirmed the allegations, the revelations have triggered widespread shock and concern across the nation."

- Reading this article displays the "Complete" button on the quest objective again. Clicking it makes the screen fade a little bit again, displaying this popup:

"CONGRATULATIONS!
You exposed Harvey Mack and delivered every piece of evidence to the global media.
The truth is out. His influence is shattered, and justice is finally underway.

The world now knows everything."

Player clicks "Close" on the popup, ending the entire questline.