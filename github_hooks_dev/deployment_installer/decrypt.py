from zipfile import ZipFile
import os, random, struct
from Crypto.Cipher import AES
import base64
import StringIO

def decrypt_zip(decryption_key, encrypted_zip_path):
    string_io = decrypt_file(decryption_key, encrypted_zip_path)
    zip = ZipFile(string_io, mode='r')
    return (zip,string_io)

def decrypt_file(key, in_filename, chunksize=24*1024):
    """ Decrypts a file using AES (CBC mode) with the
        given key. Parameters are similar to encrypt_file,
        with one difference: out_filename, if not supplied
        will be in_filename without its last extension
        (i.e. if in_filename is 'aaa.zip.enc' then
        out_filename will be 'aaa.zip')
    """
    with open(in_filename, 'rb') as infile:
        iv = infile.read(16)
        decryptor = AES.new(key, AES.MODE_CBC, iv)
        zip_io = StringIO.StringIO()

        while True:
            chunk = infile.read(chunksize)
            if len(chunk) == 0:
                break
            zip_io.write(decryptor.decrypt(chunk))
        return zip_io

obj = AES.new('This is a key123', AES.MODE_CBC, 'This is an IV456')
def decrypt_passcodes(passcodes):
    decrypted = []
    for code in passcodes:
        username = base64.decodestring(code[0])
        password = base64.decodestring(code[1])
        username = obj.decrypt(username).rstrip()
        password = obj.decrypt(password).rstrip()
        decrypted.append((username,password))
    return decrypted

def encrypt_passcodes(passcodes):
    encrypted = []
    for code in passcodes:
        username = code[0]
        password = code[1]
        username = base64.encodestring(obj.encrypt(username + ' '*(16 - len(username) % 16)))
        password = base64.encodestring(obj.encrypt(password + ' '*(16 - len(password) % 16)))
        encrypted.append((username,password))
    return encrypted

