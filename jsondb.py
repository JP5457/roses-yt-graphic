from pathlib import Path
import json
import io
import sys

#This is the database for the app. its just a json file. Its fine we only store a few hundred lines of text. Probably fine. eh.
class Jsondb:
    def __init__(self):
        project = Path("/opt/notice.json")
        if project.is_file() == False:
            print("Database json did not exists, creating new db", file=sys.stderr)
            with open("/opt/notice.json", 'w') as file:
                file.write("{}") 
            data = self.get_data()
            data["active"] = {"category":"","end":"Wed, 30 Apr 2025 11:01:55 GMT","start":"Wed, 30 Apr 2025 11:01:55 GMT","title":"Continuity", "id": ""}
            self.save_data(data)

    def get_data(self):
        with open("/opt/notice.json", 'r') as file:
            data = json.load(file)
            return data

    def save_data(self, data):
        with open("/opt/notice.json", 'w') as file:
            json.dump(data, file)

    def set_active(self, active):
        data = self.get_data()
        data["active"] = active
        self.save_data(data)

    def get_active(self):
        data = self.get_data()
        return data["active"]

