import re
import os
from configobj import ConfigObj

class Version(object):
    def __init__(self,major_release,standard_release,revision,path=""):
        self.major_release = major_release
        self.standard_release = standard_release
        self.revision = revision
        self.path = path

    def __cmp__(self,other):
        if other.__class__ == self.__class__:
            major = self.major_release.__cmp__(other.major_release)*4
            standard = self.standard_release.__cmp__(other.standard_release)*2
            rev = self.revision.__cmp__(other.revision)
            total = major + standard + rev

            if total >= 1:
                return 1
            elif total == 0:
                return 0
            else:
                return -1
        else:
            return 1
            
    def __repr__(self):
        return ".".join([str(self.major_release), str(self.standard_release), str(self.revision)])

    def get_hardware_config_path(self):
        if self < Version(1,3,0):
            return "%s/%s" % (self.path,"pyelixys/hal/hwconf.ini")
        else:
            return "%s/%s" % (self.path,"src/pyelixys/hal/hwconf.ini")

    def get_db_path(self):
        if self < Version(1,3,0):
            return "%s/%s" % (self.path,"elixys.db")
        else:
            return "%s/%s" % (self.path,"src/elixys.db")

def search_versions(elixys_directories):
    pattern = 'pyelixys_v([0-9]*)[.]([0-9]*)[.]([0-9]*)'
    versions = []

    for directory in elixys_directories:
        dir_match = re.match(pattern, directory)
        if dir_match:
            group = dir_match.groups()
            major = int(group[0])
            standard = int(group[1])
            rev = int(group[2])
            versions.append(Version(major,standard,rev))

    return versions

def determine_elixys_version(zip):
    root_dir = zip.namelist()[0]
    try:
        file = zip.open("%ssrc/pyelixys/hal/templates/hwconf_hardware.ini" % root_dir)
    except KeyError as e:
        file = zip.open("%spyelixys/hal/templates/hwconf_hardware.ini" % root_dir)

    config = ConfigObj(file)
    app_name = config["Version"]["name"]
    ver = search_versions(["pyelixys_v%s" % config["Version"]["version"]])[0]
    return app_name, ver

def find_latest(elixys_directories):
    versions = search_versions(elixys_directories)
    versions.sort(reverse=True)
    return versions[0] if len(versions) > 0 else None

if __name__ == "__main__":
    versions = []
    versions.append( Version(1,10,10) )
    versions.append( Version(1,10,1) )
    versions.append( Version(2,0,0) )
    versions.append( Version(2,1,10) )
    versions.sort(reverse=True)

    print versions
