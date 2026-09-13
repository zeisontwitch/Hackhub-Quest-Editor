# Infiltrate school secure system and manipulate grades

1. Accept this quest on Hackhub.com:

"Infiltrate the school's secure systems to manipulate the exam grades of targeted students. Utilize your skills to accomplish this task carefully, without triggering alarms or leaving traces."

2. Receive this Email:

"Subject: Get Data From FTP

Hi,
My name is Rajendra Pavlova.

I haven't been able to pass Physics for exactly 2 years and I got a bad grade in the last exam.
It would be great if you could access the system and change my grade to 82

I don't know how you will do it, but all I have is the school's website.
pastel-skyline.info

If you succeed, I will pay you. I look forward to hearing from you."

3. The hack:

- Find IP address of target domain: `nslookup pastel-skyline.info`
Result:
Server: pastel-skyline.info
Address: 104.231.100.115

- Find an open database port by IP Address: `nmap 104.231.100.115`
Result:
PORT	STATE	SERVICE
21	CLOSE	ftp
80	CLOSE	http
3306	OPEN	database
8080	CLOSE	http-proxy

- Find the login information of the school database with the brute-force tool hydra: `hydra -T 104.231.100.115:3306 -P /home/Zeis/wordlist.lst`
Result:
[DATA] 6 tasks, 1 server, 12963 login tries user (guest), ~14566 tries per task
[DATA] attacking service ssh on target 104.231.100.115:3306

Login information matched!
+-------+----------+
| USER  | PASSWORD |
+-------+----------+
| guest | littlema |
+-------+----------+

- Use "Database Manager" App to login with IP, User, Password

- Select "Grades" DB entry and change "Rajendra Pavlova" entry for "Physics" from "8" to "82" (the moment "82 is entered, the quest finishes automatically) -> Click "Complete" on the quest on Hackhub.com
