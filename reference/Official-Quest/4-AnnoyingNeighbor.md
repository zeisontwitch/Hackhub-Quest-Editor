# Annoying Neighbors

1. Receive phone call from "Maggie"

"Hello, I know it's a little late and I shouldn't be calling at this hour, but I need your help. Can you help me?"
Click on "What happened?" -> Character says "What happened, Maggie?"
"My neighbor. Fuck, this kid is a complete idiot. I have a very important exam tomorrow and I cant focus because of the shouting of the game."
Click on: "What do you want?" -> Character says "0k. What exactly do you want from me?"
"Dude... I know you're a hacker. Turn off that kid's computer so I can study. Come on! Please..."
Click on: "Give me ip address." -> Character says "Okey Well... I will, but you have to at least give me an IP address."
"Dude, how can I know the kids's IP address? You know, I dont know much about these things. I just know his name, that's all."
Click on: "Give his name." -> Character says "Ugh! Okay, give his name."
"Thank you so much! I'll send his name as a message. Goodnight."

2. Receive SMS from Maggie

"Kid's name: Sawat Evans"

3. The hack

- Search for the Sawat Evans with lynx

`lynx Sawat Evans`
Result:
Scanning social media platforms...
No data found.
Searching for contact information...
No data found.
Checking for IP address activity...
IP Addresses : 27.237.42.135
Locating physical address...
No data found.
Searching web for additional information...
No data found.

- Find an open port on the target IP address

`nmap 27.237.42.135 -sV`
Result:
PORT	STATE	SERVICE	VERSION	DESTINATION
22	OPEN	ssh		192.168.1.2

- Crack the target's SSH key using brute-force

`hydra -T 27.237.42.135:22 -P /home/Zeis/wordlist.lst`
Result:
[DATA] 6 tasks, 1 server, 9759 login tries user (guest), ~14566 tries per task
[DATA] attacking service ssh on target 27.237.42.135:22

Login information matched!
+-------+----------+
| USER  | PASSWORD |
+-------+----------+
| guest | anchor   |
+-------+----------+

- Establish an SSH connection without using the port, then use the cracked password when the terminal prompts you to

`ssh -h guest@27.237.42.135`

- Shut down the target's computer

`shutdown`

4. Receive call from Maggie again

"Oh my God! Finally he shutted up. Thank you very much, goodnight."
Click on "Goodnight." -> Character says "You're welcome. Goodnight."
(Maggie hangs up, quest auto-finishes)