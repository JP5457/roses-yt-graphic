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

@scheduler.task('interval', id='do_job_1', seconds=20, misfire_grace_time=900)
def job1():
    jsondb.set_allstreams(requests.get("https://media-dashboard.yorksu.org/api/cm5pio57y0000vt6y0l5p92f4/seasons/cm9tx5ab10001o9011ugbylm7/coverage").text)
    jsondb.set_catchup(requests.get("https://media-dashboard.yorksu.org/api/cm5pio57y0000vt6y0l5p92f4/seasons/cm9tx5ab10001o9011ugbylm7/coverage?catchup=true").text)
    jsondb.set_allfix(requests.get("https://sports-admin.yorksu.org/api/clst1o9lv0001q5teb61pqfyy/seasons/cm7uo6y6a0005nn0153286r5l/fixtures").text)
    jsondb.set_points(requests.get("https://sports-admin.yorksu.org/api/clst1o9lv0001q5teb61pqfyy/seasons/cm7uo6y6a0005nn0153286r5l").text)

#the scheduler thread runs myradio api calls every 15 minutes and stores the result
#this stops this app from spamming myradio with requests and also makes its own api way faster

@app.route("/")
def index():
    return render_template('index.html')

@app.route("/breakfast")
def breakfast():
    return render_template('breakfast.html')

@app.route("/roundup")
def roundup():
    return render_template('roundup.html')

#either redirects the user to myradio to signing (see auth) or renders a flask-wtf form or stores the values from a submitted form

@app.route("/currentfixtures")
def currentfixtures():
    response = jsondb.get_allstreams()
    livefixtures = json.loads(response)
    ongoing = []

    toret = []

    for i in livefixtures:
        try:
            if i["coverage"] == "RadioCoverage" and i["live"] == True:
                if i["id"] != jsondb.get_active()["id"]:
                    fix = {"title": i["fixture"]["sport"], "category": i["fixture"]["name"]}
                    toret.append(fix)
        except:
            continue

    return toret

@app.route("/catchup")
def catchup():
    response = jsondb.get_catchup()
    livefixtures = json.loads(response)
    ongoing = []

    toret = []

    for i in livefixtures:
        try:
            if i["coverage"] == "RadioCoverage" and i["live"] == False and i["catchup"] == True:
                if i["id"] != jsondb.get_active()["id"]:
                    fix = {"title": i["fixture"]["sport"], "category": i["fixture"]["name"]}
                    toret.append(fix)
        except:
            continue

    return toret


@app.route("/todayfixtures")
def fixtures_today():
    response = jsondb.get_allfix()
    fixtures = json.loads(response)

    # Set "today" to a fixed test date
    today = datetime.now(timezone.utc).date()

    today_fixtures = []

    for fixture in fixtures:
        try:
            start = datetime.fromisoformat(fixture['startsAt'].replace('Z', '+00:00')).astimezone(timezone.utc)
            if start.date() == today:
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
    response = jsondb.get_allstreams()
    livefixtures = json.loads(response)
    ongoing = []

    for i in livefixtures:
        try:
            if i["coverage"] == "RadioCoverage" and i["live"] == True:
                if i["id"] != jsondb.get_active()["id"]:
                    fix = {"title": i["fixture"]["sport"], "category": i["fixture"]["name"], "id" = i["id"]}
                    ongoing.append(fix)
        except:
            continue

    toret = ongoing

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
    response = jsondb.get_points()
    scores = json.loads(response)

    return {"york": scores["competitionInfo"]["pointsByCollection"]["York"], "lancaster": scores["competitionInfo"]["pointsByCollection"]["Lancaster"], "total": scores["competitionInfo"]["totalPointsAvailable"], "remaining": scores["competitionInfo"]["remainingPoints"]}

@app.route("/getrecentscores")
def getrecentscores():
    response = jsondb.get_allfix()
    fixtures = json.loads(response)

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
    return [{k: v for k, v in score.items() if k != "endsAt"} for score in completed_scores[:6]]

from flask import jsonify
from datetime import datetime, timezone
import requests
import json

@app.route("/gettodayscores")
def gettodayscores():
    response = jsondb.get_allfix()
    fixtures = json.loads(response)

    completed_scores = []

    # Get today's date in UTC
    today = datetime.now(timezone.utc).date()

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
    job1()
    port = int(os.environ.get('PORT', 5047))
    print("Starting server on port " + str(port) , file=sys.stderr)
    #app.run(debug=False, host='0.0.0.0', port=port)
    serve(app, host='0.0.0.0',port=5047,threads=8)
