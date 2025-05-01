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
            data["allfix"] = []
            data["allstreams"] = []
            data["catchup"] = []
            data["points"] = []
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

    def set_allfix(self, fix):
        data = self.get_data()
        data["allfix"] = fix
        self.save_data(data)

    def get_allfix(self):
        data = self.get_data()
        return data["allfix"]

    def set_allstreams(self, streams):
        data = self.get_data()
        data["allstreams"] = streams
        self.save_data(data)

    def get_allstreams(self):
        data = self.get_data()
        return data["allstreams"]

    def set_catchup(self, catch):
        data = self.get_data()
        data["catchup"] = catch
        self.save_data(data)

    def get_catchup(self):
        data = self.get_data()
        return data["catchup"]

    def set_points(self, point):
        data = self.get_data()
        data["points"] = point
        self.save_data(data)

    def get_points(self):
        data = self.get_data()
        return data["points"]


