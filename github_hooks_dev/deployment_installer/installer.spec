# -*- mode: python -*-

block_cipher = None


a = Analysis(['installer.py'],
             pathex=['Qt'],
             binaries=[('C:\\Qt\\5.5\\msvc2013\\bin\\QtWebEngineProcess.exe', 'bin')],
             datas=[('C:\\Qt\\5.5\\msvc2013\\.tag','bin'),
                    ('C:\\Qt\\5.5\\msvc2013\\icudtl.dat', 'bin'),
                    ('C:\\Qt\\5.5\\msvc2013\\icudtl.dat', '.'),
                    ('C:\\Qt\\5.5\\msvc2013\\qtwebengine_resources_100p.pak', 'bin'),
                    ('C:\\Qt\\5.5\\msvc2013\\qtwebengine_resources.pak', 'bin'),
                    ('C:\\Qt\\5.5\\msvc2013\\qtwebengine_resources_200p.pak', 'bin'),
                    ('qt.conf', '.')
                    ],
             hiddenimports=[],
             hookspath=[],
             runtime_hooks=[],
             excludes=[],
             win_no_prefer_redirects=False,
             win_private_assemblies=False,
             cipher=block_cipher)
##### include mydir in distribution #######
def extra_datas(mydir):
    def rec_glob(p, files):
        import os
        import glob
        for d in glob.glob(p):
            if os.path.isfile(d):
                files.append(d)
            rec_glob("%s/*" % d, files)
    files = []
    rec_glob("%s/*" % mydir, files)
    extra_datas = []
    for f in files:
        extra_datas.append((f, f, 'DATA'))

    return extra_datas
###########################################

# append the 'data' dir
a.datas += extra_datas('dependencies')

pyz = PYZ(a.pure, a.zipped_data,
             cipher=block_cipher)
exe = EXE(pyz,
          a.scripts,
          exclude_binaries=True,
          name='installer',
          debug=False,
          strip=False,
          upx=True,
          console=False )
coll = COLLECT(exe,
               a.binaries,
               a.zipfiles,
               a.datas,
               strip=False,
               upx=True,
               name='installer')
