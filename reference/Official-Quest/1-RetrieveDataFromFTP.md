# Retrieve data from FTP server

1. Accept this quest on Hackhub.com

2. Receive Email this email:
"Subject: Is host working?

I have an ftp server. It contained classified information, but I don't know what it was. Can you connect to server and send me the secret file content?

30.3.114.193
Yu.Mendoza90
NWD2QtlXTwz7jxN"

3. The hack:
Connect to FTP server: `ftp -h 30.3.114.193 -u Yu.Mendoza90 -p NWD2QtlXTwz7jxN` -> list files with `ls` (lists folders 'pictures' and 'secret') -> Go to secret folder with `cd secret` -> view files in folder with `ls` and find 'credit_card.txt -> read file with `cat credit_card.txt` -> copy-paste file contents into reply email to client and send

4. Finish quest by clicking on "Complete" on the Hackhub.com quest