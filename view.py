from flask import Flask, render_template, redirect, session, request
from waitress import serve
import os
import requests
import json
import random
from datetime import datetime, timezone
import pytz
import sys
import secrets
import re
import jwt
from jsondb import Jsondb
from flask_apscheduler import APScheduler

#Imports ENV variables

#I'm not sure if this does anything but i'm scared to delete it
log_location = os.environ.get('LOG_LOCATION', "/logs/")

#url of the myradio api, change this if you want to test with the myradio dev instance (you don't)
fixtures_url = os.environ.get('FIXTURE_URL', "changeme")

#creates an app and scheduler thread
class Config:
    SCHEDULER_API_ENABLED = True
    PREFERRED_URL_SCHEME = 'https'

app = Flask(__name__)
app.config.from_object(Config())

scheduler = APScheduler()
scheduler.init_app(app)
scheduler.start()

#just logs some stuff
unix_timestamp = (datetime.now() - datetime(1970, 1, 1)).total_seconds()
print("Starting at " + str(unix_timestamp) , file=sys.stderr)

#important for session stuff
app = Flask(__name__)
app.secret_key = secrets.token_urlsafe(16)  

jsondb = Jsondb()

#the scheduler thread runs myradio api calls every 15 minutes and stores the result
#this stops this app from spamming myradio with requests and also makes its own api way faster

@app.route("/")
def index():
    return render_template('index.html')

#either redirects the user to myradio to signing (see auth) or renders a flask-wtf form or stores the values from a submitted form

@app.route("/currentfixtures")
def openroles():
    response = requests.get(fixtures_url)
    fixtures = json.loads(response.text)
    now = datetime.now(timezone.utc)
    now = datetime(2025, 5, 3, 16, 0, 0, tzinfo=timezone.utc)
    ongoing = []

    for fixture in fixtures:
        try:
            start = datetime.fromisoformat(fixture['startsAt'].replace('Z', '+00:00'))
            end = datetime.fromisoformat(fixture['endsAt'].replace('Z', '+00:00'))
            if start <= now <= end:
                ongoing.append(fixture)
        except (KeyError, ValueError):
            continue  # Skip malformed entries

    toret = []
    for i in ongoing:
        if i["id"] != jsondb.get_active()["id"]:
            fix = {"title": i["sport"]["name"], "category": i["teams"][0]["team"]["name"], "start": i["startsAt"], "end": i["endsAt"]}
            toret.append(fix)

    return toret

@app.route("/todayfixtures")
def fixtures_today():
    response = requests.get(fixtures_url)
    fixtures = json.loads(response.text)

    # Set "today" to a fixed test date
    today = datetime.now(timezone.utc).date()
    today = datetime(2025, 5, 3, tzinfo=timezone.utc).date()

    today_fixtures = []

    for fixture in fixtures:
        try:
            start = datetime.fromisoformat(fixture['startsAt'].replace('Z', '+00:00')).astimezone(timezone.utc)
            if start.date() == today:
                print("today!",file=sys.stderr)
                fix = {
                    "title": fixture["sport"]["name"],
                    "category": fixture["teams"][0]["team"]["name"],
                    "start": fixture["startsAt"],
                    "end": fixture["endsAt"]
                }
                today_fixtures.append(fix)
        except (KeyError, ValueError):
            continue  # Skip malformed entries

    return today_fixtures


@app.route("/edit", methods=['GET', 'POST'])
def edit():
    response = requests.get(fixtures_url)
    fixtures = json.loads(response.text)
    now = datetime.now(timezone.utc)
    now = datetime(2025, 5, 3, 16, 0, 0, tzinfo=timezone.utc)
    ongoing = []

    for fixture in fixtures:
        try:
            start = datetime.fromisoformat(fixture['startsAt'].replace('Z', '+00:00'))
            end = datetime.fromisoformat(fixture['endsAt'].replace('Z', '+00:00'))
            if start <= now <= end:
                ongoing.append(fixture)
        except (KeyError, ValueError):
            continue  # Skip malformed entries

    toret = []
    for i in ongoing:
        fix = {"title": i["sport"]["name"], "category": i["teams"][0]["team"]["name"], "start": i["startsAt"], "end": i["endsAt"], "id":i["id"]}
        toret.append(fix)

    if request.method == 'POST':
        print(fixture, file=sys.stderr)
        selected_fixture = request.form.get('fixture')
        for i in toret:
            if i["id"] == selected_fixture:
                jsondb.set_active(i)
                break
    return render_template('edit.html', fixtures=toret)

@app.route("/active")
def active():
    return jsondb.get_active()

@app.route("/getscores")
def getscores():
    response = requests.get(fixtures_url)
    fixtures = json.loads(response.text)

    team_scores = [0,0]

    for event in fixtures:
        if event.get("status") != "Complete":
            continue  # Skip events that haven't been completed
        
        points_entry = event.get("competitionPoints", [])

        team_scores[0] += points_entry[0]["points"]
        team_scores[1] += points_entry[1]["points"]
        

    return {"york": team_scores[0], "lancaster": team_scores[1]}

@app.route("/getrecentscores")
def getrecentscores():
    response = requests.get(fixtures_url)
    fixtures = json.loads(response.text)

    team_scores = [0,0]

    completed_scores = []

    for event in fixtures:
        if event.get("status") != "Complete":
            continue  # Skip events that haven't been completed
        
        points_entry = event.get("competitionPoints", [])

        team_scores_york = points_entry[0]["points"]
        team_scores_lancaster = points_entry[1]["points"]

        end = datetime.fromisoformat(event['endsAt'].replace('Z', '+00:00'))

        fixture = {"york": team_scores_york, "lancaster": team_scores_lancaster, "title": event["sport"]["name"], "category": event["teams"][0]["team"]["name"], "endsAt": end}

        completed_scores.append(fixture)

    completed_scores.sort(key=lambda x: x["endsAt"], reverse=True)

    # Return only the 5 most recent scores (excluding 'endsAt' in output if not needed)
    return [{k: v for k, v in score.items() if k != "endsAt"} for score in completed_scores[:5]]

from flask import jsonify
from datetime import datetime, timezone
import requests
import json

@app.route("/gettodayscores")
def gettodayscores():
    response = requests.get(fixtures_url)
    fixtures = json.loads(response.text)

    completed_scores = []

    # Get today's date in UTC
    today = datetime.now(timezone.utc).date()
    today = datetime(2025, 4, 26, tzinfo=timezone.utc).date()

    for event in fixtures:
        if event.get("status") != "Complete":
            continue  # Skip events that haven't been completed

        points_entry = event.get("competitionPoints", [])
        if len(points_entry) < 2:
            continue  # Skip if scores aren't available for both teams

        team_scores_york = points_entry[0]["points"]
        team_scores_lancaster = points_entry[1]["points"]

        # Convert 'endsAt' to UTC datetime
        end = datetime.fromisoformat(event['endsAt'].replace('Z', '+00:00'))

        # Check if it ended today
        if end.date() == today:
            fixture = {
                "york": team_scores_york,
                "lancaster": team_scores_lancaster,
                "title": event["sport"]["name"],
                "category": event["teams"][0]["team"]["name"],
            }
            completed_scores.append(fixture)

    return jsonify(completed_scores)



if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5047))
    print("Starting server on port " + str(port) , file=sys.stderr)
    #app.run(debug=False, host='0.0.0.0', port=port)
    serve(app, host='0.0.0.0',port=5047,threads=8)
