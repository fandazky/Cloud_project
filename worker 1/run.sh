#sudo bash
file=$1
cd ..
sudo openvpn --config $file --daemon
