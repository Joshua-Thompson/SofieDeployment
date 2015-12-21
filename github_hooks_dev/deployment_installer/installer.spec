# -*- mode: python -*-

block_cipher = None


a = Analysis(['installer.py'],
             pathex=['C:\\Python27','C:\\Users\\Justin\\Documents\\SofieDeployment\\github_hooks_dev\\deployment_installer','C:\\Python27\\Lib\\site-packages','C:\\Python27\\libs','C:\\Python27\\DLLs','C:\\Python27\\Scripts',"C:\\Python27\\Lib\\site-packages\\PyQt5"],
             binaries=[('C:\\Qt\\5.5\\msvc2013\\bin\\QtWebEngineProcess.exe', 'bin')],
             datas=[('C:\\Qt\\5.5\\msvc2013\\.tag','bin'),
                    ('C:\\Qt\\5.5\\msvc2013\\icudtl.dat', 'bin'),
                    ('C:\\Qt\\5.5\\msvc2013\\icudtl.dat', '.'),
                    ('C:\\Qt\\5.5\\msvc2013\\qtwebengine_resources_100p.pak', 'bin'),
                    ('C:\\Qt\\5.5\\msvc2013\\qtwebengine_resources.pak', 'bin'),
                    ('C:\\Qt\\5.5\\msvc2013\\qtwebengine_resources_200p.pak', 'bin'),
                    ('qt.conf', '.')
                    ],
             hiddenimports=["PyQt5", "PyQt5.Qt"],
             hookspath=["C:\\Qt\\5.5\\msvc2013\\bin\\", "C:\\Python27\\Lib\\site-packages\\PyQt5"],
             runtime_hooks=(''),
             excludes=None,
             win_no_prefer_redirects=None,
             win_private_assemblies=None,
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
#a.datas += extra_datas('C:\\Qt\\5.5\\msvc2013\\bin')

pyz = PYZ(a.pure, a.zipped_data,
             cipher=block_cipher)
exe = EXE(pyz,
          a.scripts,
          exclude_binaries=True,
          name='installer',
          debug=True,
          strip=None,
          upx=False,
          console=True )
coll = COLLECT(exe,
               a.binaries,
               a.zipfiles,
               a.datas,
               strip=None,
               upx=True,
               name='installer')
