import os
import port_for
import sys
from port_for import *

port= port_for.select_random()
serial=open('../serial')
data_serial=serial.read().split('\n')
indeks=int(data_serial[0])+1


name=sys.argv[1]
path='keys/'+name+'/'
opvn=open('keys/client.ovpn', 'r+')
ca_key=open(path+name+'.key', 'r')
crt=open(path+name+'.crt', 'r')
ca=open(path+'ca.crt', 'r+')

crtdata=crt.read()
print crtdata
crtdata='<cert>'+'\n'+crtdata+'\n'+'</cert>'

ca_keydata=ca_key.read()
ca_keydata='<key>'+'\n'+ca_keydata+'\n'+'</key>'
ca_data=ca.read()
ca_data='<ca>'+'\n'+ca_data+'\n'+'</ca>'

opvn_data=opvn.readlines()
opvn_data[41]='remote 10.151.32.100 '+str(port)
data_ovpn=''
for data in opvn_data:
	data_ovpn=data_ovpn+'\n'+data


opvn_data=data_ovpn+ca_data+'\n'+crtdata+'\n'+ca_keydata+'\n'

temp=open(path+name+'.ovpn', 'w+')

temp.write(opvn_data)
temp.close()
ca_key.close()
crt.close()
ca.close()
os.system('scp '+path+name+'.ovpn root@128.199.201.124:cloudVPN/config')

server=open('../server.conf')
data_server=server.readlines()
file_server=open('../server'+str(indeks)+'.conf','w+')
data_server[31]='port '+str(port)

for data in data_server:
        file_server.write(data+'\n')

os.system('echo '+str(indeks)+' > ../serial')
file_server.close()
serial.close()
server.close()
nama='server'+str(indeks)+'.conf'
print nama
os.system('sudo bash run.sh '+nama)
