# blockchain-fabric-training
<code>
# set up the docker and initailize the dockers
sudo chmod 666 /var/run/docker.sock
./startFabric.sh


cd javascript
npm install
node enrollAdmin.js    #(which is the wallet and admin be created)
node registerUser.js ogcio creator    #(Create a user as creator)

node registerUser.js m2 manager #(Create a m2 as manager)

cd ../chaincode/go
go build

#deploy new version
cd ~
./upgradeCC.sh

cd javascript
node invoke.js creator1 createProduct "Macbook Pro" "Laptop" 5

node invoke.js admin queryAllProduct
</code>

<code>
cd javascript/myapp
npm install
npm start
</code>
