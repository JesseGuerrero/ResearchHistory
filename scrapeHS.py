import requests
from bs4 import BeautifulSoup

def _getHSValues(userID: str, name: str, demographic: str) -> dict:
    url = f'https://scholar.google.com/citations?user={userID}'

    # Fetch the page with headers
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
    }
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print("Failed to fetch the page")
        return {"name": "", "h_index": -1, "citations": -1}

    # Parse the HTML content
    soup = BeautifulSoup(response.text, 'html.parser')

    # Find the table by ID
    table = soup.find('table', id='gsc_rsb_st')

    # Check if the table was found
    if not table:
        print("Table not found")
        return {"name": "", "h_index": -1, "citations": -1}

    # Get the first and second `tr` elements
    rows = table.find_all('tr')
    if len(rows) < 2:
        print("Not enough rows in the table")
        return {"name": "", "h_index": -1, "citations": -1}

    # Extract values from the second `td` of the first and second `tr`
    citations = rows[1].find_all('td')[1].text
    hIndex = rows[2].find_all('td')[1].text
    return {"name": name.replace("\n", ""), "h_index": int(hIndex), "citations": int(citations), "type": demographic}

def getHSInfo() -> dict:
    hsInfo = []
    for demographic in ["students", "teachers"]:
        with open(f'players/{demographic}.txt', 'r') as file:
            for line in file:
                user = line.split('=')
                if len(user) == 2:
                    hsValue = _getHSValues(user[0], user[1], demographic)
                    if hsValue["citations"] == -1:
                        continue
                    hsInfo.append(hsValue)
                else:
                    print("Line format error:", line)
    return hsInfo

import json
import time
import subprocess

from datetime import datetime

while True:
    with open("hiscores.json", "w") as json_file:
        json.dump(getHSInfo(), json_file)
        print("dumped " + str(datetime.now().date()))
        # Git add command
        #subprocess.run(["git", "add", "."])

        # Git commit command
        #commit_message = f"Updated hiscores on {str(datetime.now().date())}"
        #subprocess.run(["git", "commit", "-m", commit_message])

        # Git push command
        #subprocess.run(["git", "push", "origin", "main"])
#     time.sleep(60*60*24*3)