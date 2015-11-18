from zipfile import ZipFile
import os, random, struct
from Crypto.Cipher import AES
import StringIO

def decrypt_zip(decryption_key, encrypted_zip_path):
    string_io = decrypt_file(decryption_key, encrypted_zip_path)
    zip = ZipFile(string_io, mode='r')
    return zip

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
