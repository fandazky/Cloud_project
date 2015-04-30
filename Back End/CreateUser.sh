#!/bin/bash
cd /etc/openvpn/easy-rsa

client=$1

if [ x$client = x ]; 
then
    echo "Usage: $0 clientname"
    exit 1
fi

if [ ! -e keys/$client.key ];
then
    echo "Generating keys..."
    source ./vars
    ./pkitool $client
    echo "...keys generated."
fi
tarball=./keys/$client.tgz

if [ ! -e $tarball ];
then
    echo "Creating tarball..."
    tmpdir=keys/$client
    mkdir $tmpdir
    cp keys/ca.crt $tmpdir/
    cp keys/$client.key $tmpdir/$client.key
    cp keys/$client.crt $tmpdir/$client.crt
    rm keys/$client.*
    tar -C $tmpdir -czvf $tarball .
    echo "...tarball created"
    python script.py $client
else
    echo "Nothing to do, so nothing done. (keys/$client.tgz already exists)"
fi
