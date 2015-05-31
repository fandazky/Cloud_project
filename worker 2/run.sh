#sudo bash
file=$1 
port=$2
ufw allow $port/tcp
echo ufw allow $port/tcp >> iptables.sh
echo ufw deny $port/tcp >> delete.sh
echo ufw delete deny $port/tcp >> delete.sh

cd ..
sudo openvpn --config $file --daemon

