var express = require('express');
var router = express.Router();
const FabricClient = require('../fabric/client.js');
const client = new FabricClient();

// get user list in create product
router.get('/create', function(req, res, next) {
  var userRequest = new Promise((resolve, request) => {
    var users = client.listUsers();
    resolve(users);
  })
  Promise.all([userRequest]).then((data) => {
    res.render('createProduct', {users: data[0]});
  });
})

// Create Product
router.post('/create', function(req, res, next) {
  var name = req.body.name;
  var description = req.body.description;
  var stages = req.body.stages;
  var identity = req.body.identity;
  var request = new Promise((resolve, reject) => {
    try{
      var product = client.invoke(identity, 'createProduct', [name, description, stages]);
      resolve(product);
    }catch(error){
      reject(error);
    }
  });
  request.then(product => {
    res.redirect("/");
  });
})

/* GET products and user listing. */
router.get('/:productId', function(req, res, next) {
  var productRequest = new Promise((resolve, reject) => {
    try{
      var product = client.query('admin', 'queryProduct', [req.params.productId]);
      resolve(product);
    }catch(error){
      reject(error);
    }
  });
  var userRequest = new Promise((resolve, request) => {
    var users = client.listUsers();
    resolve(users);
  })
  Promise.all([productRequest, userRequest]).then((data) => {
    res.render('product', {product: data[0], users: data[1]} );
  });

});

// signatures
router.post('/:productId', function(req, res, next) {
  var identity = req.body.identity;
  var request = new Promise((resolve, reject) => {
    try{
      var product = client.invoke(identity, "signProduct", [req.params.productId]);
      resolve(product);
    }catch(error){
      reject()
    }
  })

  request.then(product => {
    res.redirect('/product/${req.params.productId}')
  }, (error) => {
    console.log("Error", error);
    res.render('error', {error:error})
  });
});

module.exports = router;
